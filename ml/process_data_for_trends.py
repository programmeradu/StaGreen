import pandas as pd

def extract_area(address):
    """
    Extracts a general area from an address string.
    Example: "123 Main St, Springfield, IL" -> "Springfield"
    """
    try:
        parts = address.split(',')
        if len(parts) > 1:
            area = parts[-2].strip()
            # Basic check if it might be a city name (heuristic)
            if len(area.split()) <= 3: # Arbitrary check for city-like names
                return area
        if parts: # If only one part or the second to last wasn't suitable
            area = parts[-1].strip()
            if len(area.split()) <= 3:
                 return area
        return "Unknown" # Default if no suitable area found
    except AttributeError:
        return "Unknown" # Handle cases where address is not a string (e.g., NaN)

def process_data():
    """
    Loads, processes, and saves waste trend data.
    """
    print("Loading data...")
    try:
        df = pd.read_csv('ml/data/pickUpRequests.csv')
    except FileNotFoundError:
        print("Error: ml/data/pickUpRequests.csv not found.")
        return
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return

    print("Processing data...")
    # Convert 'date' column to datetime objects
    try:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
    except Exception as e:
        print(f"Error converting 'date' column: {e}")
        # Continue processing or return, depending on how critical this is
        # For now, let's remove rows where date could not be parsed
        df.dropna(subset=['date'], inplace=True)
        if df.empty:
            print("No valid date entries found after attempting to parse dates. Exiting.")
            return

    # Apply extract_area function
    df['area'] = df['pickUpAddress'].apply(extract_area)

    # Filter out rows where 'approxGarbageWeight' is missing or not a number
    # First, convert to numeric, coercing errors to NaN
    df['approxGarbageWeight'] = pd.to_numeric(df['approxGarbageWeight'], errors='coerce')
    df.dropna(subset=['approxGarbageWeight'], inplace=True)

    if df.empty:
        print("No valid data remaining after cleaning 'approxGarbageWeight'. Exiting.")
        return

    # Group by 'area' and 'date', then sum 'approxGarbageWeight'
    # Ensure 'date' is suitable for grouping (e.g., just the date part if it's datetime)
    # If 'date' column is already datetime objects, df.groupby will handle it.
    # If 'date' also includes time and you want to group by day, use df['date'].dt.date
    daily_waste = df.groupby(['area', df['date'].dt.date])['approxGarbageWeight'].sum()

    # Reset index and rename columns
    processed_df = daily_waste.reset_index()
    processed_df.rename(columns={'approxGarbageWeight': 'total_daily_waste', 'date': 'date'}, inplace=True)
    # Ensure date column is named 'date' after reset_index if it was changed above
    # The 'date' column from dt.date will be just date, which is fine for trends.

    print("Saving processed data...")
    try:
        processed_df.to_csv('ml/data/processed_waste_trends.csv', index=False)
        print("Processed data saved to ml/data/processed_waste_trends.csv")
    except Exception as e:
        print(f"Error saving processed data: {e}")

if __name__ == '__main__':
    # Create dummy data directory if it doesn't exist for local testing
    # This part would ideally be handled by a setup script or CI environment
    import os
    if not os.path.exists('ml/data'):
        os.makedirs('ml/data')
        print("Created ml/data directory for dummy data.")
        # Create a dummy pickUpRequests.csv for the script to run
        dummy_data = {
            'date': ['2023-01-01', '2023-01-01', '2023-01-02', '01/03/2023', 'bad-date', None, '2023-01-04'],
            'pickUpAddress': ['123 Main St, Accra, Ghana', '456 Oak Ave, Accra, Ghana', '789 Pine Rd, Noida, India', '321 Maple Dr, New Delhi, India', 'Unknown City', 'Central Perk, New York, NY', '10 Downing St, London, UK'],
            'approxGarbageWeight': [10, 15, '20', 12.5, 'N/A', 30, None]
        }
        dummy_df = pd.DataFrame(dummy_data)
        dummy_df.to_csv('ml/data/pickUpRequests.csv', index=False)
        print("Created dummy ml/data/pickUpRequests.csv for testing.")

    process_data()
