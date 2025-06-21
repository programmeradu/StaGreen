from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..models_pydantic import OptimizationResponse, PredictionInputItem, GeoLocation, PredictionOutputItem, RouteStop
from ..services import data_service, prediction_service, routing_service
# from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/routes",
    tags=["Routing"]
)

from pydantic import BaseModel, Field # Moved Field import here
class OptimizeRoutesRequest(BaseModel):
    target_date_str: Optional[str] = None
    prediction_horizon_hours: int = Field(default=12, gt=0)
    fill_level_threshold: float = Field(default=75.0, ge=0, le=100)


@router.post("/optimize", response_model=OptimizationResponse)
async def optimize_vehicle_routes(request_data: OptimizeRoutesRequest):
    """
    Orchestrates the generation of optimized vehicle routes.
    Fetches vehicle data, predicts waste levels for relevant bins,
    and then calls the OR-Tools routing solver.
    """
    try:
        logger.info(f"Route optimization requested with params: {request_data.dict()}")

        # 1. Fetch active fleet vehicles
        # Note: data_service functions are synchronous, FastAPI handles them in a threadpool.
        # If data_service were async, we'd await here.
        active_vehicles = data_service.get_active_fleet_vehicles() # Corrected to sync call
        if not active_vehicles:
            logger.warning("No active vehicles available for routing.")
            # Return Pydantic model directly
            return OptimizationResponse(routes=[], status="error_no_active_vehicles")

        if not active_vehicles[0].start_depot:
            raise HTTPException(status_code=500, detail="First active vehicle has no start_depot defined.")

        depot_location_dict = {
            "bin_id": "DEPOT_01",
            "latitude": active_vehicles[0].start_depot.latitude,
            "longitude": active_vehicles[0].start_depot.longitude,
            "type": "Depot"
        }
        vehicle_capacities = [v.capacity_kg for v in active_vehicles]
        num_vehicles = len(active_vehicles)

        # 2. Identify bins requiring service
        # Fetch all bins from the database
        all_bins_from_db = data_service.get_all_bins() # Corrected to sync call
        if not all_bins_from_db:
            logger.info("No bins found in the database to consider for routing.")
            return OptimizationResponse(routes=[], status="success_no_bins_to_route")

        all_bin_ids_to_consider = [b.bin_id for b in all_bins_from_db]
        bin_details_map = {b.bin_id: b for b in all_bins_from_db} # Map for easy lookup

        # 3. Get predicted fill levels for these bins
        target_datetime_predict = datetime.utcnow()
        if request_data.target_date_str:
            try:
                target_datetime_predict = datetime.strptime(request_data.target_date_str, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid target_date_str format. Use YYYY-MM-DD.")

        prediction_target_timestamp = target_datetime_predict + timedelta(hours=request_data.prediction_horizon_hours)

        # Iteratively call prediction_service.predict_fill_levels
        predicted_results_list = []
        for bin_id_to_predict in all_bin_ids_to_consider:
            predicted_level = prediction_service.predict_fill_levels(
                bin_id=bin_id_to_predict,
                future_timestamp=prediction_target_timestamp
            )
            if predicted_level is not None: # Can be 0.0, which is a valid prediction
                predicted_results_list.append(PredictionOutputItem(
                    bin_id=bin_id_to_predict,
                    timestamp=prediction_target_timestamp, # The timestamp we asked for
                    predicted_fill_level_percent=predicted_level
                ))
            else:
                 logger.warning(f"Prediction service returned None for bin {bin_id_to_predict} at {prediction_target_timestamp}.")
                 # Optionally skip or add with a failure indicator if the model supports it

        bins_for_routing_details = []
        # bin_details_map is already created above from all_bins_from_db

        for pred_item in predicted_results_list:
            if pred_item.predicted_fill_level_percent >= request_data.fill_level_threshold:
                bin_doc = bin_details_map.get(pred_item.bin_id) # Use the map with BinDocument objects
                if bin_doc:
                    # Use capacity_kg from the BinDocument, provide a default if None
                    bin_capacity_kg = bin_doc.capacity_kg if bin_doc.capacity_kg is not None else 100 # Default if not set
                    predicted_weight = (pred_item.predicted_fill_level_percent / 100.0) * bin_capacity_kg

                    bins_for_routing_details.append({
                        "bin_id": pred_item.bin_id,
                        "latitude": bin_doc.location.coordinates[1], # GeoJSON: lon, lat; Pydantic: lat, lon
                        "longitude": bin_doc.location.coordinates[0],
                        "approxGarbageWeight": int(max(1, predicted_weight))
                    })

        if not bins_for_routing_details:
            logger.info("No bins meet the threshold for collection after prediction.")
            return OptimizationResponse(routes=[], status="success_no_bins_meet_threshold")

        # 4. Prepare data for OR-Tools solver
        locations_with_ids_for_or_tools = [depot_location_dict] + bins_for_routing_details
        demands_for_or_tools = [0] + [b['approxGarbageWeight'] for b in bins_for_routing_details]
        logger.info(f"Prepared {len(bins_for_routing_details)} bins for OR-Tools routing.")

        # 5. Call the routing service (now an async function)
        optimized_routes_list_of_lists = await routing_service.solve_vehicle_routing_problem(
            locations_with_ids=locations_with_ids_for_or_tools,
            demands=demands_for_or_tools,
            vehicle_capacities=vehicle_capacities,
            num_vehicles=num_vehicles
        )

        final_routes_for_response = []
        for i, route_stops_raw in enumerate(optimized_routes_list_of_lists):
            # route_stops_raw is List[RouteStop] from routing_service
            final_routes_for_response.append({ # This structure matches OptimizedRoute Pydantic model implicitly
                "vehicle_id": active_vehicles[i].vehicle_id if i < len(active_vehicles) else f"Truck_{i+1}",
                "stops": route_stops_raw
            })

        logger.info(f"OR-Tools optimization complete. Generated {len(final_routes_for_response)} routes.")
        return OptimizationResponse(routes=final_routes_for_response, status="success")

    except HTTPException as http_exc:
        logger.error(f"HTTPException during route optimization: {http_exc.detail}", exc_info=True)
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error during route optimization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
