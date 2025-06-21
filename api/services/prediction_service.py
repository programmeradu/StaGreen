import pandas as pd
from sklearn.model_selection import train_test_split # If splitting for local validation
from sklearn.ensemble import GradientBoostingRegressor
import joblib
from datetime import datetime
from typing import Optional
import os
import logging

from ..database import get_collection # Assuming get_collection is in database.py
from ..models_pydantic import WasteReadingDocument # Pydantic model for validation if needed, though service might work with dicts

# Get a logger instance (assuming logger is set up in api.index or a shared logging config)
logger = logging.getLogger(__name__)

MODEL_DIR = "api/models_ml"
MODEL_PATH = os.path.join(MODEL_DIR, "waste_predictor_ghana.joblib")

# Ensure MODEL_DIR exists
os.makedirs(MODEL_DIR, exist_ok=True)

def fetch_waste_readings_data() -> pd.DataFrame:
    """Fetches all historical data from the waste_readings collection."""
    try:
        waste_readings_collection = get_collection("waste_readings")
        # Fetch all readings. For very large datasets, consider fetching in chunks or specific ranges.
        readings_cursor = waste_readings_collection.find({})
        readings_list = list(readings_cursor)

        if not readings_list:
            logger.warning("No waste readings found in the database.")
            return pd.DataFrame() # Return empty DataFrame

        logger.info(f"Fetched {len(readings_list)} waste readings from MongoDB.")
        return pd.DataFrame(readings_list)
    except Exception as e:
        logger.error(f"Error fetching waste readings: {e}", exc_info=True)
        # Depending on desired behavior, could return empty DF or re-raise
        return pd.DataFrame()

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Processes raw data and generates features from reading_timestamp."""
    if df.empty or 'reading_timestamp' not in df.columns: # fill_level_percent not needed for feature engineering only
        logger.warning("DataFrame is empty or missing 'reading_timestamp' for feature engineering.")
        # If 'fill_level_percent' is essential for some feature (e.g. lag features), add it to check
        return pd.DataFrame()

    # Ensure reading_timestamp is datetime
    df['reading_timestamp'] = pd.to_datetime(df['reading_timestamp'])

    df['day_of_week'] = df['reading_timestamp'].dt.dayofweek
    df['hour_of_day'] = df['reading_timestamp'].dt.hour
    df['day_of_year'] = df['reading_timestamp'].dt.dayofyear
    # Potentially add 'week_of_year', 'month', 'year'
    # For PoC, keep it simple. More features can be added for better accuracy.
    # Consider 'time_since_last_empty' if 'last_emptied' is available and reliable per bin.
    # For now, focus on time-based features for a general model.

    # For this model, we predict 'fill_level_percent'.
    # We also need 'bin_id' to potentially train per-bin models or use bin_id as a feature.
    # For a general model, we might not use bin_id directly as a feature if not one-hot encoded.

    # Required columns for training: features + target
    # Let's assume for now we train a single model for all bins using these time features.
    # If bin_id is to be used, it needs to be encoded (e.g., one-hot).

    # Sort by timestamp, important for time-series related understanding if doing lag features etc.
    # For simple time component features, sorting here isn't strictly necessary but good practice.
    df = df.sort_values(by='reading_timestamp')

    logger.info("Feature engineering complete.")
    return df

def train_waste_prediction_model():
    """Trains a GradientBoostingRegressor model and saves it."""
    df = fetch_waste_readings_data()
    if df.empty:
        logger.error("Cannot train model: No data fetched.")
        return False

    # Crucially, 'fill_level_percent' must exist in df before this step if it's the target
    if 'fill_level_percent' not in df.columns:
        logger.error("Cannot train model: 'fill_level_percent' target column missing from fetched data.")
        return False

    df_featured = engineer_features(df.copy()) # Use .copy() to avoid SettingWithCopyWarning if df is a slice
    if df_featured.empty or 'fill_level_percent' not in df_featured.columns: # Check again after potential drops in engineer_features
        logger.error("Cannot train model: Feature engineering failed or target column 'fill_level_percent' missing post-engineering.")
        return False

    # Define features and target
    # For now, a simple model using only time-based features.
    # 'bin_id' could be included if properly encoded, or if training per-bin models.
    features = ['day_of_week', 'hour_of_day', 'day_of_year']
    target = 'fill_level_percent'

    if not all(feature in df_featured.columns for feature in features):
        logger.error(f"Cannot train model: Missing one or more features in the DataFrame. Required: {features}")
        return False

    X = df_featured[features]
    y = df_featured[target]

    # Simple train/test split for local validation if desired, though for actual
    # retraining in prod, we might train on all available data.
    # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    # For this function, let's train on all data passed.

    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    try:
        model.fit(X, y)
        joblib.dump(model, MODEL_PATH)
        logger.info(f"Waste prediction model trained and saved to {MODEL_PATH}")
        return True
    except Exception as e:
        logger.error(f"Error during model training or saving: {e}", exc_info=True)
        return False

def predict_fill_levels(bin_id: str, future_timestamp: datetime) -> Optional[float]:
    """
    Loads the saved model and predicts future fill level for a given bin and timestamp.
    For this version, bin_id is logged but not directly used by the general model.
    A more advanced version might load a model specific to bin_id or use bin_id as a feature.
    """
    try:
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found at {MODEL_PATH}. Train the model first.")
            return None

        model = joblib.load(MODEL_PATH)

        # Create a DataFrame for the single prediction point
        features_df = pd.DataFrame([{
            'reading_timestamp': pd.to_datetime(future_timestamp)
            # 'bin_id': bin_id # If bin_id was a feature during training
        }])
        # Engineer features for this timestamp
        # Pass only necessary columns to engineer_features if it expects specific ones
        engineered_features_df = engineer_features(features_df.copy())

        if engineered_features_df.empty:
            logger.error("Failed to engineer features for prediction input.")
            return None

        # Select the same features used for training
        # (ensure this list matches the one in train_waste_prediction_model)
        prediction_features = ['day_of_week', 'hour_of_day', 'day_of_year']
        if not all(feature in engineered_features_df.columns for feature in prediction_features):
            logger.error(f"Missing features for prediction. Required: {prediction_features}, Available: {engineered_features_df.columns.tolist()}")
            return None

        input_features = engineered_features_df[prediction_features]

        prediction = model.predict(input_features)
        predicted_fill_level = prediction[0]

        # Ensure prediction is within logical bounds (0-100)
        predicted_fill_level = max(0.0, min(100.0, predicted_fill_level))

        logger.info(f"Prediction for bin {bin_id} at {future_timestamp}: {predicted_fill_level:.2f}%")
        return round(predicted_fill_level, 2)

    except FileNotFoundError: # This is redundant due to os.path.exists check, but good safeguard
        logger.error(f"Model file not found (predict_fill_levels) at {MODEL_PATH}. Train the model first.")
        return None
    except Exception as e:
        logger.error(f"Error during prediction for bin {bin_id}: {e}", exc_info=True)
        return None
