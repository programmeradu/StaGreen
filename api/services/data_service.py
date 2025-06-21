import logging
from typing import List, Dict, Optional
from datetime import datetime

from ..database import get_collection
# Assuming Pydantic models are in api.models_pydantic
from ..models_pydantic import FleetVehicleDocument, WasteReadingDocument, GeoLocation, BinDocument

logger = logging.getLogger(__name__)

FLEET_VEHICLES_COLLECTION = "fleet_vehicles"
WASTE_READINGS_COLLECTION = "waste_readings"
BINS_COLLECTION = "bins" # Added for fetching bin locations if needed

# --- Fleet Vehicle Management ---

def get_active_fleet_vehicles() -> List[FleetVehicleDocument]:
    """Fetches all active fleet vehicles from the database."""
    try:
        vehicle_collection = get_collection(FLEET_VEHICLES_COLLECTION)
        vehicles_cursor = vehicle_collection.find({"is_active": True})
        vehicles_list = list(vehicles_cursor) # Synchronous conversion

        # Validate with Pydantic model before returning
        return [FleetVehicleDocument(**vehicle) for vehicle in vehicles_list]
    except Exception as e:
        logger.error(f"Error fetching active fleet vehicles: {e}", exc_info=True)
        return []

def get_fleet_vehicle_by_id(vehicle_id: str) -> Optional[FleetVehicleDocument]:
    """Fetches a single fleet vehicle by its ID."""
    try:
        vehicle_collection = get_collection(FLEET_VEHICLES_COLLECTION)
        vehicle_data = vehicle_collection.find_one({"vehicle_id": vehicle_id, "is_active": True}) # Synchronous
        if vehicle_data:
            return FleetVehicleDocument(**vehicle_data)
        return None
    except Exception as e:
        logger.error(f"Error fetching vehicle {vehicle_id}: {e}", exc_info=True)
        return None

def ensure_sample_fleet_vehicles(): # This function can remain synchronous
    """Adds sample Ghana-localized fleet vehicles if the collection is empty."""
    try:
        vehicle_collection = get_collection(FLEET_VEHICLES_COLLECTION)
        count = vehicle_collection.count_documents({}) # Synchronous
        if count == 0:
            logger.info("No fleet vehicles found. Adding sample vehicles for Ghana context...")
            sample_vehicles_data = [
                {
                    "vehicle_id": "GH-TRUCK-01", "capacity_kg": 7000,
                    "start_depot": {"latitude": 5.6356, "longitude": -0.1750}, # Example Accra North depot
                    "is_active": True
                },
                {
                    "vehicle_id": "GH-TRUCK-02", "capacity_kg": 5000,
                    "start_depot": {"latitude": 5.5595, "longitude": -0.2190}, # Example Accra West depot
                    "is_active": True
                },
                {
                    "vehicle_id": "GH-TRUCK-03", "capacity_kg": 5000,
                    "start_depot": {"latitude": 5.5680, "longitude": -0.1380}, # Example Accra East (Tema side) depot
                    "is_active": False # Example of an inactive truck
                }
            ]
            # Validate data with Pydantic model before inserting
            vehicles_to_insert = [FleetVehicleDocument(**data).dict(by_alias=True, exclude_none=True) for data in sample_vehicles_data]
            # Using dict() for insertion. exclude_none=True can be useful if models have many optional fields.
            vehicle_collection.insert_many(vehicles_to_insert) # Synchronous
            logger.info(f"Added {len(vehicles_to_insert)} sample fleet vehicles.")
    except Exception as e:
        logger.error(f"Error ensuring sample fleet vehicles: {e}", exc_info=True)

# --- Waste Reading Management ---

def get_latest_waste_readings_for_bins(bin_ids: List[str]) -> List[WasteReadingDocument]:
    """
    Fetches the most recent waste reading for each specified bin ID.
    """
    if not bin_ids:
        return []
    try:
        readings_collection = get_collection(WASTE_READINGS_COLLECTION)
        pipeline = [
            {"$match": {"bin_id": {"$in": bin_ids}}},
            {"$sort": {"reading_timestamp": -1}},
            {"$group": {
                "_id": "$bin_id",
                "latest_reading_doc": {"$first": "$$ROOT"}
            }},
            {"$replaceRoot": {"newRoot": "$latest_reading_doc"}}
        ]
        latest_readings_cursor = readings_collection.aggregate(pipeline) # Synchronous
        readings_list = list(latest_readings_cursor)

        # Validate with Pydantic
        return [WasteReadingDocument(**reading) for reading in readings_list]
    except Exception as e:
        logger.error(f"Error fetching latest waste readings for bins {bin_ids}: {e}", exc_info=True)
        return []

# --- Bin Information (Potentially needed by routing service) ---
SAMPLE_BINS_DATA = [
    {"bin_id": "GH-ACC-BIN-001", "location": {"type": "Point", "coordinates": [-0.187, 5.605]}, "capacity_kg": 100, "capacity_liters": 240, "metadata": {"area": "Osu"}},
    {"bin_id": "GH-ACC-BIN-002", "location": {"type": "Point", "coordinates": [-0.190, 5.610]}, "capacity_kg": 150, "capacity_liters": 360, "metadata": {"area": "Labadi"}},
    {"bin_id": "GH-ACC-BIN-003", "location": {"type": "Point", "coordinates": [-0.180, 5.600]}, "capacity_kg": 100, "capacity_liters": 240, "metadata": {"area": "Cantonments"}},
    {"bin_id": "GH-ACC-BIN-004", "location": {"type": "Point", "coordinates": [-0.175, 5.615]}, "capacity_kg": 200, "capacity_liters": 500, "metadata": {"area": "Airport Residential"}},
    {"bin_id": "GH-ACC-BIN-005", "location": {"type": "Point", "coordinates": [-0.195, 5.595]}, "capacity_kg": 100, "capacity_liters": 240, "metadata": {"area": "James Town"}},
    {"bin_id": "GH-ACC-BIN-006", "location": {"type": "Point", "coordinates": [-0.170, 5.608]}, "capacity_kg": 150, "capacity_liters": 360, "metadata": {"area": "East Legon"}},
    {"bin_id": "GH-ACC-BIN-007", "location": {"type": "Point", "coordinates": [-0.200, 5.602]}, "capacity_kg": 100, "capacity_liters": 240, "metadata": {"area": "Circle"}},
    {"bin_id": "GH-ACC-BIN-008", "location": {"type": "Point", "coordinates": [-0.185, 5.612]}, "capacity_kg": 200, "capacity_liters": 500, "metadata": {"area": "Roman Ridge"}},
    {"bin_id": "GH-ACC-BIN-009", "location": {"type": "Point", "coordinates": [-0.178, 5.598]}, "capacity_kg": 150, "capacity_liters": 360, "metadata": {"area": "Nima"}},
    {"bin_id": "GH-ACC-BIN-010", "location": {"type": "Point", "coordinates": [-0.192, 5.606]}, "capacity_kg": 100, "capacity_liters": 240, "metadata": {"area": "Adabraka"}},
]

def ensure_sample_bins():
    """Adds sample Ghana-localized bins if the collection is empty."""
    try:
        bins_collection = get_collection(BINS_COLLECTION)
        count = bins_collection.count_documents({})
        if count == 0:
            logger.info("No bins found in 'bins' collection. Adding sample bins for Ghana context...")

            bins_to_insert = []
            for data in SAMPLE_BINS_DATA:
                data_copy = data.copy()
                loc_coords = data_copy["location"]["coordinates"]
                if not (isinstance(loc_coords, list) and len(loc_coords) == 2):
                    logger.error(f"Skipping bin {data_copy.get('bin_id')} due to invalid location coordinates format.")
                    continue

                try:
                    # Ensure capacity_liters is present if your BinDocument model requires it
                    if 'capacity_liters' not in data_copy and 'capacity_kg' in data_copy: # Example logic
                        data_copy['capacity_liters'] = data_copy['capacity_kg'] * 4 # Arbitrary conversion if needed

                    pydantic_bin = BinDocument(**data_copy)
                    bins_to_insert.append(pydantic_bin.dict(by_alias=True, exclude_none=True))
                except Exception as p_exc:
                    logger.error(f"Validation error for sample bin {data_copy.get('bin_id')}: {p_exc}")
                    continue

            if bins_to_insert:
                bins_collection.insert_many(bins_to_insert)
                logger.info(f"Added {len(bins_to_insert)} sample bins to '{BINS_COLLECTION}' collection.")
    except Exception as e:
        logger.error(f"Error ensuring sample bins: {e}", exc_info=True)

def get_bins_by_ids(bin_ids: List[str]) -> List[BinDocument]:
     """Fetches bin details for a list of bin IDs."""
     if not bin_ids:
         return []
     try:
         bins_collection = get_collection(BINS_COLLECTION)
         bins_cursor = bins_collection.find({"bin_id": {"$in": bin_ids}})
         return [BinDocument(**bin_data) for bin_data in list(bins_cursor)]
     except Exception as e:
         logger.error(f"Error fetching bins by IDs {bin_ids}: {e}", exc_info=True)
         return []

def get_all_bins() -> List[BinDocument]:
    """Fetches all bins from the 'bins' collection."""
    try:
        bins_collection = get_collection(BINS_COLLECTION)
        all_bins_cursor = bins_collection.find({})
        return [BinDocument(**bin_data) for bin_data in list(all_bins_cursor)]
    except Exception as e:
        logger.error(f"Error fetching all bins: {e}", exc_info=True)
        return []
