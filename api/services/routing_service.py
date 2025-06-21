import httpx # For Google Maps API call
import math
import logging
from typing import List, Dict, Tuple, Any, Optional
from fastapi import HTTPException # For raising HTTP errors within service

try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False
    # Create dummy classes for type hints when ortools is not available
    routing_enums_pb2 = None
    pywrapcp = None

from ..config import settings # For MAPS_API_KEY_GHANA
# Assuming Pydantic models for input/output clarity if complex, or use TypedDicts
from ..models_pydantic import RouteStop

logger = logging.getLogger(__name__)

async def get_distance_matrix(
    origins: List[Tuple[float, float]], # List of (lat, lon) tuples
    destinations: List[Tuple[float, float]],
    api_key: str,
    region: str = "GH" # Ghana localization
) -> List[List[int]]: # Returns matrix of distances in meters
    """
    Fetches a distance matrix from Google Maps Distance Matrix API.
    Returns distances in meters.
    """
    if not origins or not destinations:
        logger.warning("Origins or destinations list is empty for distance matrix.")
        return [[]]

    # Format origins and destinations for API: "lat,lng|lat,lng|..."
    origins_str = "|".join([f"{lat},{lng}" for lat, lng in origins])
    destinations_str = "|".join([f"{lat},{lng}" for lat, lng in destinations])

    # Max elements (origins x destinations) is typically 100 for standard API users,
    # or origins + destinations <= 25. Check current Google Docs for limits.
    # If num_origins * num_destinations > 100 (e.g. 10x10), batching is needed.
    # For a single matrix (all origins to all destinations), num_origins = num_destinations.
    # So, if len(origins) > 10 for a square matrix, batching would be needed.
    # This PoC assumes the number of locations is within typical free tier limits (e.g. up to 25x25 for some APIs or 10x10 for others).
    # For a real application, robust batching logic is crucial.

    url = (
        f"https://maps.googleapis.com/maps/api/distancematrix/json?"
        f"origins={origins_str}&destinations={destinations_str}"
        f"&key={api_key}&region={region}&units=metric" # units=metric for meters/km
    )

    matrix = [[0] * len(destinations) for _ in range(len(origins))]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status() # Raise an exception for HTTP errors 4xx/5xx
            data = response.json()

        if data['status'] != 'OK':
            error_message = data.get('error_message', '')
            logger.error(f"Google Maps Distance Matrix API error: {data['status']} - {error_message}")
            # Fallback to Haversine or raise error based on policy
            raise Exception(f"Google Maps API Error: {data['status']}. {error_message}")

        for i, row in enumerate(data['rows']):
            if row['elements'][0].get('status') == 'ZERO_RESULTS': # Check if entire row has no results
                 logger.warning(f"Google Maps API returned ZERO_RESULTS for origin {i} ({origins[i]}). Using large penalty for all destinations from this origin.")
                 for j_idx in range(len(destinations)):
                     matrix[i][j_idx] = 999999999 # Large penalty
                 continue

            for j, element in enumerate(row['elements']):
                if element['status'] == 'OK':
                    # Get distance in meters
                    matrix[i][j] = element['distance']['value']
                else:
                    # Handle cases where a route between two points is not found
                    logger.warning(f"No route found by Google Maps between origin {i} ({origins[i]}) and destination {j} ({destinations[j]}). Status: {element['status']}. Using large penalty.")
                    matrix[i][j] = 999999999 # Large penalty for no route
        return matrix
    except httpx.RequestError as e:
        logger.error(f"HTTPX Request error calling Google Maps API: {e}", exc_info=True)
        raise # Re-raise to be handled by the calling function
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP Status error calling Google Maps API: {e.response.status_code} - {e.response.text}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error processing Google Maps API response: {e}", exc_info=True)
        raise # Re-raise

def create_ortools_data_model(
    demands: List[int],
    vehicle_capacities: List[int],
    num_vehicles: int,
    depot_index: int,
    # Pickup objects (containing original info like bin_id, lat, lon) will be passed separately to map results
):
    """Stores the data for the OR-Tools CVRP problem, using an externally provided distance matrix."""
    data = {}
    data['demands'] = demands # Includes depot demand (0)
    data['vehicle_capacities'] = vehicle_capacities
    data['num_vehicles'] = num_vehicles
    data['depot'] = depot_index
    # The number of locations will be derived from the length of the distance matrix passed to solver
    return data

async def solve_vehicle_routing_problem(
    locations_with_ids: List[Dict[str, Any]], # e.g., [{"bin_id": "depot", "latitude": lat, "longitude": lon}, {"bin_id": "bin1", ...}, ...]
                                              # First item MUST be the depot.
    demands: List[int], # Corresponding to locations_with_ids, depot demand is demands[0] (should be 0)
    vehicle_capacities: List[int],
    num_vehicles: int
) -> List[List[RouteStop]]: # Returns list of routes, each route is a list of RouteStop Pydantic models
    """
    Solves the CVRP using Google OR-Tools and Google Maps API for distance matrix.
    locations_with_ids: List of dicts, first element is depot. Each dict needs 'bin_id', 'latitude', 'longitude'.
    demands: List of demands corresponding to locations_with_ids. demands[0] is for depot (0).
    """
    if not ORTOOLS_AVAILABLE:
        logger.error("Cannot solve vehicle routing: OR-Tools not available in this environment.")
        raise HTTPException(status_code=503, detail="Route optimization service unavailable in this deployment.")
    
    if not locations_with_ids or len(locations_with_ids) <= 1: # Need at least depot and one stop
        logger.info("Not enough locations for routing (need depot + at least one stop).")
        return []

    depot_index = 0 # By convention, first location in locations_with_ids is the depot

    # Prepare locations for Distance Matrix API
    coords_list = [(loc['latitude'], loc['longitude']) for loc in locations_with_ids]

    try:
        # 1. Get Distance Matrix from Google Maps API
        logger.info(f"Fetching distance matrix for {len(coords_list)} locations...")
        if not settings.MAPS_API_KEY_GHANA:
            logger.error("Google Maps API key (MAPS_API_KEY_GHANA) is not configured.")
            raise HTTPException(status_code=500, detail="Maps API key not configured on server.")

        distance_matrix = await get_distance_matrix(
            coords_list,
            coords_list,
            settings.MAPS_API_KEY_GHANA,
            region="GH"
        )
        if not distance_matrix or not distance_matrix[0]: # Check if matrix is empty or malformed
            logger.error("Received empty or malformed distance matrix from Google Maps API.")
            raise HTTPException(status_code=503, detail="Failed to retrieve valid distance matrix.")
        logger.info("Distance matrix fetched successfully.")

    except Exception as e: # Catch errors from get_distance_matrix or key error
        # Log details if e is HTTPException, otherwise log generic
        if isinstance(e, HTTPException):
            logger.error(f"Failed to get distance matrix: {e.detail}", exc_info=True)
            raise # Re-raise HTTPException
        else:
            logger.error(f"Failed to get distance matrix due to an unexpected error: {e}", exc_info=True)
            raise HTTPException(status_code=503, detail=f"Distance matrix service unavailable or error: {str(e)}")


    # 2. Create OR-Tools data model
    data = create_ortools_data_model(
        demands, vehicle_capacities, num_vehicles, depot_index
    )

    # Basic validation: demand vs capacity
    max_demand = max(demands) if demands else 0
    if vehicle_capacities and max_demand > vehicle_capacities[0]: # Assuming same capacity for all for this check
         logger.error(f"Demand ({max_demand}) exceeds vehicle capacity ({vehicle_capacities[0]}).")
         raise HTTPException(status_code=400, detail=f"Demand ({max_demand}) exceeds vehicle capacity ({vehicle_capacities[0]}).")


    # 3. Create Routing Model
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Demand callback for capacity constraints
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['demands'][from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        data['vehicle_capacities'],
        True,  # start cumul to zero
        'Capacity')

    # 4. Set Search Parameters and Solve
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.FromSeconds(10) # Increased time limit slightly

    logger.info("Solving CVRP with OR-Tools...")
    solution = routing.SolveWithParameters(search_parameters)

    # 5. Parse Solution and return routes
    output_routes: List[List[RouteStop]] = []
    if solution:
        logger.info("CVRP Solution found.")
        for vehicle_id in range(data['num_vehicles']):
            index = routing.Start(vehicle_id)
            route_for_vehicle_stops: List[RouteStop] = []
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                if node_index != data['depot']: # Exclude depot from stops list
                    original_loc_info = locations_with_ids[node_index]
                    route_for_vehicle_stops.append(RouteStop(
                        requestId=original_loc_info['bin_id'], # map 'bin_id' from locations_with_ids to 'requestId'
                        latitude=original_loc_info['latitude'],
                        longitude=original_loc_info['longitude'],
                        approxGarbageWeight=float(demands[node_index]) # Use the demand for this node, ensure float
                    ))
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                if index == previous_index and not routing.IsEnd(index) : # Check if stuck and not at the end
                    logger.warning(f"Routing solution for vehicle {vehicle_id} seems stuck at index {index}. Breaking to avoid infinite loop.")
                    break # Safety break

            if route_for_vehicle_stops: # Only add routes that have stops
                output_routes.append(route_for_vehicle_stops)
        logger.info(f"Parsed {len(output_routes)} routes from solution.")
    else:
        logger.warning("No solution found for CVRP by OR-Tools.")

    return output_routes
