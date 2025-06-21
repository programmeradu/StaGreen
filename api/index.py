import logging
import sys # Required for basic StreamHandler (though Uvicorn might override)
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from .database import connect_to_mongo, close_mongo_connection
from .routers import prediction_router, routing_router # Import the new routers
from .services import data_service # Import the new data_service

# Configure logger
# Uvicorn will handle the basic configuration and output.
# We get a logger instance to use within our application.
# To see DEBUG messages locally with Uvicorn: uvicorn api.index:app --reload --log-level debug
# Vercel typically captures INFO and above.
logger = logging.getLogger(__name__)
# Example: logger.info("This is an info message from module level.")

app = FastAPI(title="StaGreen Predictive Fleet API - Ghana")

# --- Global Exception Handlers ---

@app.exception_handler(HTTPException) # Handles FastAPI's own HTTPException and those raised by app
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(
        f"HTTPException for request {request.method} {request.url}: {exc.detail} (status: {exc.status_code})",
        extra={"request_method": request.method, "request_url": str(request.url), "status_code": exc.status_code, "detail": exc.detail}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}, # Standard FastAPI error response format
        headers=exc.headers,
    )

@app.exception_handler(Exception) # Generic fallback for any unhandled Python exception
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled Python exception for request {request.method} {request.url}: {exc}",
        exc_info=True, # This adds stack trace to log
        extra={"request_method": request.method, "request_url": str(request.url)}
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred."},
    )

# --- Lifespan Events (Startup/Shutdown) ---

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI application startup commencing...")
    try:
        connect_to_mongo()
        logger.info("Successfully connected to MongoDB.")
        # Ensure sample data (synchronous call, FastAPI handles it in a thread)
        data_service.ensure_sample_fleet_vehicles()
        logger.info("Sample fleet vehicle check complete.")
        data_service.ensure_sample_bins() # Add this line
        logger.info("Sample bins check complete.")
    except Exception as e:
        logger.critical(f"Error during startup: {e}", exc_info=True)
        # Depending on policy, you might want to exit or prevent app from fully starting
    logger.info("FastAPI application startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("FastAPI application shutdown commencing...")
    close_mongo_connection()
    logger.info("FastAPI application shutdown complete.")

# --- Root Endpoint ---

@app.get("/", tags=["Root"])
async def read_root():
    logger.info("Root endpoint '/' was accessed.")
    return {"message": "Welcome to the StaGreen Predictive Fleet API (Ghana Edition)!"}

# Further routers will be added here (e.g., for predictions, routing)
app.include_router(prediction_router.router)
app.include_router(routing_router.router) # Include the new routing router
# Example: from .routers import another_router
# app.include_router(another_router.router, prefix="/another", tags=["Another Section"])
