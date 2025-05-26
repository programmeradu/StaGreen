import pandas as pd
import joblib
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os

def train_and_save_model(area_data, area_name, models_dir='ml/models/'):
    """
    Trains a SARIMA model for a specific area and saves it.

    Args:
        area_data (pd.DataFrame): DataFrame with 'date' (as index) and 'total_daily_waste'.
        area_name (str): Name of the area for model naming.
        models_dir (str): Directory to save the models.
    """
    # Ensure 'date' is the index and is datetime
    if not isinstance(area_data.index, pd.DatetimeIndex):
        try:
            area_data['date'] = pd.to_datetime(area_data['date'])
            area_data = area_data.set_index('date')
        except KeyError: # If 'date' column was already moved to index
            area_data.index = pd.to_datetime(area_data.index)
    
    area_data = area_data.sort_index()

    # Resample to daily frequency, filling missing values if any (e.g., forward fill)
    # This ensures the model has a consistent frequency.
    area_data = area_data.asfreq('D', method='ffill')


    if len(area_data) < 30:
        print(f"Not enough data to train model for area: {area_name}. Found {len(area_data)} data points.")
        return None

    print(f"Training model for area: {area_name}...")
    try:
        # Define a simple SARIMA model
        # These orders (p,d,q)(P,D,Q,s) are placeholders and should be tuned
        model = SARIMAX(area_data['total_daily_waste'],
                        order=(1, 1, 1),
                        seasonal_order=(1, 1, 1, 7),
                        enforce_stationarity=False,
                        enforce_invertibility=False,
                        initialization='approximate_diffuse') # Added for robustness
        
        results = model.fit(disp=False) # disp=False to reduce verbosity

        # Ensure the models directory exists
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)
            print(f"Created directory: {models_dir}")

        model_filename = f"{models_dir}/waste_model_{area_name.replace(' ', '_').lower()}.joblib"
        joblib.dump(results, model_filename)
        print(f"Model saved for area: {area_name} as {model_filename}")
        return model_filename
    except Exception as e:
        print(f"Error training or saving model for {area_name}: {e}")
        return None

if __name__ == '__main__':
    print("Starting model training process...")
    data_filepath = 'ml/data/processed_waste_trends.csv'
    models_base_dir = 'ml/models/'

    try:
        df = pd.read_csv(data_filepath)
        print(f"Loaded data from {data_filepath}")
    except FileNotFoundError:
        print(f"Error: Processed data file not found at {data_filepath}. Please run the data processing script first.")
        # Create dummy processed data if it doesn't exist, to allow this script to run for testing
        print("Creating dummy processed_waste_trends.csv for testing...")
        if not os.path.exists('ml/data'):
            os.makedirs('ml/data')
        dummy_processed_data = {
            'area': ['Accra'] * 40 + ['Noida'] * 40,
            'date': pd.to_datetime(['2023-01-01'] * 80) + pd.to_timedelta([i for i in range(40)] + [i for i in range(40)], unit='D'),
            'total_daily_waste': [10, 12, 11, 13, 14, 10, 12, 11, 13, 14,10, 12, 11, 13, 14, 10, 12, 11, 13, 14,10, 12, 11, 13, 14, 10, 12, 11, 13, 14,10, 12, 11, 13, 14, 10, 12, 11, 13, 14] + \
                                 [15, 17, 16, 18, 19, 15, 17, 16, 18, 19,15, 17, 16, 18, 19, 15, 17, 16, 18, 19,15, 17, 16, 18, 19, 15, 17, 16, 18, 19,15, 17, 16, 18, 19, 15, 17, 16, 18, 19]
        }
        df = pd.DataFrame(dummy_processed_data)
        df.to_csv(data_filepath, index=False)
        print(f"Dummy data created at {data_filepath}")
        # Rerun the script if dummy data was just created (optional, or just proceed)


    try:
        df['date'] = pd.to_datetime(df['date'])
    except Exception as e:
        print(f"Error converting 'date' column to datetime: {e}. Exiting.")
        exit()

    unique_areas = df['area'].unique()
    print(f"Found areas: {unique_areas}")

    for area in unique_areas:
        print(f"\nProcessing area: {area}")
        area_df = df[df['area'] == area].copy() # Use .copy() to avoid SettingWithCopyWarning
        
        # The 'date' column should be set as index for SARIMAX
        area_df.set_index('date', inplace=True)
        
        # Select only the 'total_daily_waste' column for the model
        area_ts = area_df[['total_daily_waste']]

        train_and_save_model(area_ts, area, models_dir=models_base_dir)
    
    print("\nModel training process finished.")
