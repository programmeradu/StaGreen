from pydantic import BaseModel, Field, HttpUrl # HttpUrl might be useful later
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId # For handling MongoDB ObjectId if needed in responses

# Helper for ObjectId serialization if we ever expose raw MongoDB _id
# For now, we'll primarily use our application-specific IDs like bin_id

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# --- MongoDB Document Models (reflecting collection structures) ---

class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [longitude, latitude]

class BinMetadata(BaseModel):
    area: Optional[str] = None
    last_emptied: Optional[datetime] = None
    # Add other relevant metadata fields if any

class BinDocument(BaseModel):
    # id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id") # If exposing MongoDB _id
    bin_id: str = Field(..., example="GH-ACC-BIN-001") # Ghana-specific ID format
    location: GeoLocation
    capacity_liters: Optional[int] = Field(None, gt=0) # Made optional, if kg is primary
    capacity_kg: Optional[int] = Field(None, gt=0, example=100) # Added capacity_kg
    metadata: Optional[BinMetadata] = None
    # custom_fields: Optional[Dict[str, Any]] = None # For any extra data

    class Config:
        json_encoders = {ObjectId: str} # Ensures ObjectId is serialized to str
        # For FastAPI to work with MongoDB models that might have an _id field:
        # an_id_field_can_be_anything: bool = Field(default=False, alias='_id')
        # However, it's often cleaner to map _id to id or handle it in services.
        # For this model, we're focusing on app-level bin_id.
        allow_population_by_field_name = True # Allows using alias _id if we were to map it


class WasteReadingDocument(BaseModel):
    # id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    bin_id: str = Field(..., example="GH-ACC-BIN-001")
    fill_level_percent: float = Field(..., ge=0, le=100) # Between 0 and 100
    reading_timestamp: datetime
    # source: Optional[str] = None # e.g., "sensor", "manual_input", "prediction_correction"

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True

# --- API Request/Response Models (examples, will be expanded in Phase 2) ---

# Example: For creating a new bin (if we had such an endpoint)
class BinCreateRequest(BaseModel):
    bin_id: str = Field(..., example="GH-ACC-BIN-002")
    longitude: float = Field(..., example=-0.1875)
    latitude: float = Field(..., example=5.6040)
    capacity_liters: int = Field(..., gt=0, example=1100)
    area: Optional[str] = Field(None, example="Adabraka")

# Example: For prediction input
class PredictionInputItem(BaseModel):
    bin_id: str = Field(..., example="GH-ACC-BIN-001")
    timestamp: datetime # Future timestamp for which prediction is needed

class PredictionRequest(BaseModel):
    predictions: List[PredictionInputItem]

# Example: For prediction output
class PredictionOutputItem(BaseModel):
    bin_id: str
    timestamp: datetime
    predicted_fill_level_percent: float

class PredictionResponse(BaseModel):
    results: List[PredictionOutputItem]

# Example: For optimized route output (structure from OR-Tools part)
class RouteStop(BaseModel):
    requestId: str # This is bin_id
    latitude: float
    longitude: float
    approxGarbageWeight: float # This is the demand/fill_level in kg or liters

class OptimizedRoute(BaseModel):
    # route_id: Optional[str] = None # If we assign IDs to routes
    vehicle_id: Optional[int] = None # If we assign vehicle to route
    stops: List[RouteStop]
    total_distance_km: Optional[float] = None # To be added by routing service
    total_time_minutes: Optional[float] = None # To be added by routing service
    total_load_kg: Optional[float] = None # To be added by routing service

class OptimizationResponse(BaseModel):
    routes: List[OptimizedRoute] # List of routes, each route is a list of stops
    status: str = Field(..., example="success")
    # any other metadata, like total fleet distance, time, etc.

# This file will grow as more API endpoints and services are defined.
# These initial models align with the MongoDB structures provided by the user
# and provide examples for future API I/O.

# --- Fleet Vehicle Models ---

class FleetVehicleDepot(BaseModel):
    latitude: float = Field(..., example=5.6037)  # Accra example
    longitude: float = Field(..., example=-0.1870)

class FleetVehicleDocument(BaseModel):
    # id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id") # If exposing MongoDB _id
    vehicle_id: str = Field(..., example="GH-TRUCK-01") # Ghana-specific format
    capacity_kg: int = Field(..., gt=0, example=5000)
    # Depot location for this vehicle
    start_depot: FleetVehicleDepot
    # End depot might be different, or same as start for simplicity in many CVRP setups
    end_depot: Optional[FleetVehicleDepot] = None
    is_active: bool = Field(default=True)
    # other specs like fuel_type, current_driver_id, etc. can be added later

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True
