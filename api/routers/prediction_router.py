from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Depends, Header
from typing import List, Dict, Optional, Any
import uuid
import logging
from datetime import datetime

# Assuming Pydantic models are in api.models_pydantic
from ..models_pydantic import PredictionRequest, PredictionResponse, PredictionInputItem, PredictionOutputItem
# Assuming prediction service is in api.services.prediction_service
from ..services import prediction_service
from ..config import settings # For RETRAIN_API_KEY

logger = logging.getLogger(__name__)

# Helper function for API Key Auth
async def verify_retrain_api_key(x_retrain_key: Optional[str] = Header(None)):
    if not settings.RETRAIN_API_KEY: # Should have been caught by config validation, but as a safeguard
        logger.error("RETRAIN_API_KEY not configured on server.")
        raise HTTPException(status_code=500, detail="Internal server configuration error: API key not set.")
    if not x_retrain_key or x_retrain_key != settings.RETRAIN_API_KEY:
        logger.warning(f"Unauthorized attempt to access retrain endpoint. Provided key: '{x_retrain_key}'")
        raise HTTPException(status_code=401, detail="Not authenticated or invalid API key")
    return True

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)

# In-memory store for job statuses (for PoC, can be replaced by DB later)
# This needs to be at module level or in a class to persist across requests for a single worker instance
# For serverless, this in-memory store will reset with each new instance.
# A proper distributed cache or DB is needed for robust job status in serverless.
# For now, this demonstrates the async pattern.
retrain_job_statuses: Dict[str, Dict] = {}


@router.post("/fill-levels", response_model=PredictionResponse)
async def get_fill_level_predictions(request_data: PredictionRequest):
    """
    Predicts future fill levels for a list of bins and timestamps.
    """
    results = []
    if not request_data.predictions:
        raise HTTPException(status_code=400, detail="No prediction items provided.")

    for item in request_data.predictions:
        try:
            predicted_level = prediction_service.predict_fill_levels(
                bin_id=item.bin_id,
                future_timestamp=item.timestamp
            )
            if predicted_level is not None:
                results.append(PredictionOutputItem(
                    bin_id=item.bin_id,
                    timestamp=item.timestamp,
                    predicted_fill_level_percent=predicted_level
                ))
            else:
                # Log the failure for this specific item but continue processing others
                logger.warning(f"Prediction failed for bin {item.bin_id} at {item.timestamp} (model or data issue).")
                # Optionally, include failed items in response with an error message
                # For PredictionOutputItem to support error_message, it needs to be added to its Pydantic model
                # For now, using -1 as an indicator of failure, assuming predicted_fill_level_percent is float
                results.append(PredictionOutputItem(
                    bin_id=item.bin_id,
                    timestamp=item.timestamp,
                    predicted_fill_level_percent=-1.0
                ))
        except Exception as e:
            logger.error(f"Unexpected error during prediction for bin {item.bin_id}: {e}", exc_info=True)
            # Similar to above, log and optionally mark this item as failed
            results.append(PredictionOutputItem(
                bin_id=item.bin_id,
                timestamp=item.timestamp,
                predicted_fill_level_percent=-1.0
            ))

    # The check `if not results:` might not be needed if we always append, even on failure.
    # However, if all individual predictions resulted in an error state that didn't append,
    # it could still be relevant. Given the current logic, results will likely not be empty if request_data.predictions was not.
    # A better check might be if all results are failure indicators.
    # For now, if the input list was not empty, results will not be empty.

    return PredictionResponse(results=results)

# Placeholder for /retrain and /retrain/status/{job_id} - will be implemented next

# --- Background Task Function for Model Retraining ---
def background_model_training(job_id: str):
    global retrain_job_statuses # Access the module-level dict
    try:
        logger.info(f"Background retraining job {job_id} started.")
        retrain_job_statuses[job_id] = {"status": "running", "job_id": job_id, "start_time": datetime.utcnow().isoformat(), "message": "Training in progress..."}

        success = prediction_service.train_waste_prediction_model()

        if success:
            retrain_job_statuses[job_id]["status"] = "completed"
            retrain_job_statuses[job_id]["end_time"] = datetime.utcnow().isoformat()
            retrain_job_statuses[job_id]["message"] = "Model training completed successfully."
            logger.info(f"Background retraining job {job_id} completed successfully.")
        else:
            retrain_job_statuses[job_id]["status"] = "failed"
            retrain_job_statuses[job_id]["end_time"] = datetime.utcnow().isoformat()
            retrain_job_statuses[job_id]["error_message"] = "Model training function reported failure."
            retrain_job_statuses[job_id]["message"] = "Model training failed. Check logs for details."
            logger.error(f"Background retraining job {job_id} failed as reported by training function.")
    except Exception as e:
        error_message = f"Exception in background retraining job {job_id}: {str(e)}"
        logger.error(error_message, exc_info=True)
        # Ensure job_id entry exists before trying to update it
        if job_id not in retrain_job_statuses:
             retrain_job_statuses[job_id] = {"status": "failed", "job_id": job_id, "submit_time": "Unknown - error before full init", "start_time": datetime.utcnow().isoformat()}

        retrain_job_statuses[job_id]["status"] = "failed"
        retrain_job_statuses[job_id]["end_time"] = datetime.utcnow().isoformat()
        retrain_job_statuses[job_id]["error_message"] = str(e)
        retrain_job_statuses[job_id]["message"] = "An unexpected error occurred during model training."

# --- Model Retraining Endpoints ---

@router.post("/retrain", status_code=202) # 202 Accepted
async def trigger_model_retraining(
    background_tasks: BackgroundTasks,
    is_authenticated: bool = Depends(verify_retrain_api_key)
):
    """
    Triggers asynchronous retraining of the waste prediction model.
    Requires `X-Retrain-Key` header for authentication.
    """
    job_id = str(uuid.uuid4())
    global retrain_job_statuses
    # Initialize job status
    retrain_job_statuses[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "submit_time": datetime.utcnow().isoformat(),
        "message": "Retraining job accepted and pending execution."
    }

    background_tasks.add_task(background_model_training, job_id)

    logger.info(f"Model retraining job {job_id} successfully initiated.")
    return {"message": "Model retraining initiated.", "job_id": job_id, "status_url": f"/predict/retrain/status/{job_id}"}

@router.get("/retrain/status/{job_id}", response_model=Optional[Dict[str, Any]]) # Using Dict for flexibility
async def get_retraining_job_status(job_id: str):
    """
    Gets the status of a model retraining job.
    """
    global retrain_job_statuses
    status_info = retrain_job_statuses.get(job_id)
    if not status_info:
        logger.warning(f"Attempt to get status for non-existent job_id: {job_id}")
        raise HTTPException(status_code=404, detail=f"Retraining job with ID '{job_id}' not found.")

    # Add current server time to response for context if job is still running/pending
    if status_info.get("status") in ["pending", "running"]:
        status_info["current_server_time"] = datetime.utcnow().isoformat()

    return status_info
