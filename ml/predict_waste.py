import pandas as pd
import joblib
import sys
import json
from datetime import datetime, timedelta

def predict_waste(area_name, num_days_to_predict, models_dir):
    """
    Loads a pre-trained SARIMA model and predicts waste generation for a specified number of days.

    Args:
        area_name (str): The name of the area for which to predict waste.
        num_days_to_predict (int): The number of future days to predict.
        models_dir (str): The directory where the trained models are stored.

    Returns:
        str: A JSON string containing the predictions or an error message.
    """
    model_filename = f"{models_dir}/waste_model_{area_name.replace(' ', '_').lower()}.joblib"

    try:
        model_results = joblib.load(model_filename)
    except FileNotFoundError:
        return json.dumps({"error": f"Model not found for area: {area_name} at {model_filename}"})
    except Exception as e:
        return json.dumps({"error": f"Error loading model for {area_name}: {str(e)}"})

    try:
        # SARIMAX models predict from the end of the data they were trained on.
        # We need to determine the start date for the forecast.
        # For this implementation, we assume predictions start the day after the model's last observation.
        # A more robust way would be to store the end date of training data with the model.
        # However, the model object itself has the end date of the original data used for fitting if `fitted` on pandas series with DatetimeIndex
        
        # Attempt to get the last date from the model's data representation if possible
        # This is a common attribute for statsmodels results objects for time series
        if hasattr(model_results, 'model') and hasattr(model_results.model, 'endog_dates') and model_results.model.endog_dates is not None and len(model_results.model.endog_dates) > 0:
            last_training_date = model_results.model.endog_dates[-1]
            # Ensure last_training_date is a pandas Timestamp for consistent behavior
            if not isinstance(last_training_date, pd.Timestamp):
                 last_training_date = pd.to_datetime(last_training_date)
        else:
            # Fallback: if we can't get the last date, we can't reliably generate future dates.
            # This indicates a potential issue with how the model was saved or its compatibility.
            # For now, we'll default to predicting from "today" as a simple fallback,
            # but this is NOT ideal for actual time series forecasting continuity.
            # print("Warning: Could not determine the last training date from the model. Predictions will start from tomorrow relative to current date.", file=sys.stderr)
            # last_training_date = pd.Timestamp(datetime.now().date())
            # For this exercise, we will require the model to have this information or fail.
             return json.dumps({"error": f"Could not determine last training date from model for {area_name}. Model may be incompatible or missing necessary date information."})


        forecast_start_date = last_training_date + timedelta(days=1)
        
        # Generate predictions
        forecast_result = model_results.get_forecast(steps=num_days_to_predict)
        predicted_means = forecast_result.predicted_mean

        # Create a list of dates for the prediction period
        prediction_dates = pd.date_range(start=forecast_start_date, periods=num_days_to_predict).tolist()

        predictions_output = []
        for date, value in zip(prediction_dates, predicted_means):
            predictions_output.append({
                "date": date.strftime('%Y-%m-%d'),
                "predicted_waste": round(value, 2) # Rounding for cleaner output
            })
        
        return json.dumps({"area": area_name, "predictions": predictions_output}, indent=4)

    except Exception as e:
        return json.dumps({"error": f"Error during prediction for {area_name}: {str(e)}"})

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print(json.dumps({"error": "Usage: python predict_waste.py <area_name> <num_days_to_predict> <models_dir>"}), file=sys.stderr)
        sys.exit(1)

    area_name_arg = sys.argv[1]
    try:
        num_days_arg = int(sys.argv[2])
        if num_days_arg <= 0:
            raise ValueError("Number of days to predict must be positive.")
    except ValueError as ve:
        print(json.dumps({"error": f"Invalid number of days: {str(ve)}"}), file=sys.stderr)
        sys.exit(1)
    
    models_dir_arg = sys.argv[3]

    # Ensure models_dir ends with a slash for consistency, though os.path.join would be more robust
    if not models_dir_arg.endswith('/'):
        models_dir_arg += '/'

    result_json = predict_waste(area_name_arg, num_days_arg, models_dir_arg)
    print(result_json)
