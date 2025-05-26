import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import haversine_distances # Corrected import
import sys
import json

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    lat1_rad = np.radians(lat1)
    lon1_rad = np.radians(lon1)
    lat2_rad = np.radians(lat2)
    lon2_rad = np.radians(lon2)

    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = np.sin(dlat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    r = 6371  # Radius of Earth in kilometers.
    return c * r

def create_routes_for_area(pickup_df, depot_location, truck_capacity_kg, max_stops_per_route=10):
    """
    Creates optimized routes for a given area using a greedy nearest neighbor approach.
    Expects pickup_df to have 'latitude', 'longitude', 'approxGarbageWeight', 'requestId'.
    """
    if not isinstance(pickup_df, pd.DataFrame):
        # This check is important if the input might not be a DataFrame
        raise ValueError("Input pickup_data must be a pandas DataFrame.")

    if pickup_df.empty:
        return []

    remaining_pickups = pickup_df.copy()
    
    # Ensure required columns are present before attempting numeric conversion
    required_cols_for_processing = ['latitude', 'longitude', 'approxGarbageWeight', 'requestId']
    for col in required_cols_for_processing:
        if col not in remaining_pickups.columns:
            raise ValueError(f"Missing required column in pickup data: '{col}'")

    try:
        remaining_pickups['latitude'] = pd.to_numeric(remaining_pickups['latitude'], errors='coerce')
        remaining_pickups['longitude'] = pd.to_numeric(remaining_pickups['longitude'], errors='coerce')
        remaining_pickups['approxGarbageWeight'] = pd.to_numeric(remaining_pickups['approxGarbageWeight'], errors='coerce')
    except Exception as e:
        raise ValueError(f"Error converting columns to numeric: {e}. Ensure 'latitude', 'longitude', and 'approxGarbageWeight' are present and convertible.")

    # Drop rows where essential numeric conversions failed or requestId is missing
    remaining_pickups.dropna(subset=['latitude', 'longitude', 'approxGarbageWeight', 'requestId'], inplace=True)
    
    all_routes = []

    while not remaining_pickups.empty:
        current_route = []
        current_route_weight = 0
        current_location = depot_location # (lat, lon)

        for _ in range(max_stops_per_route): # Limit stops per route
            if remaining_pickups.empty:
                break

            # Calculate distances from current_location to all remaining_pickups
            # haversine_distances expects input in radians for its own calculation,
            # but our helper takes degrees. We need to apply our helper row-wise.
            
            distances = remaining_pickups.apply(
                lambda row: haversine_distance(current_location[0], current_location[1], 
                                               row['latitude'], row['longitude']),
                axis=1
            )

            if distances.empty: # Should not happen if remaining_pickups is not empty
                break
            
            closest_pickup_idx = distances.idxmin()
            next_pickup = remaining_pickups.loc[closest_pickup_idx]
            
            pickup_weight = next_pickup['approxGarbageWeight']

            if current_route_weight + pickup_weight <= truck_capacity_kg:
                # Append a dictionary with desired details
                current_route.append({
                    "requestId": next_pickup['requestId'],
                    "latitude": next_pickup['latitude'],
                    "longitude": next_pickup['longitude'],
                    "approxGarbageWeight": next_pickup['approxGarbageWeight']
                    # Add other fields from next_pickup if needed, e.g., next_pickup.get('pickUpAddress')
                })
                current_route_weight += pickup_weight
                current_location = (next_pickup['latitude'], next_pickup['longitude'])
                remaining_pickups = remaining_pickups.drop(closest_pickup_idx)
            else:
                # Current truck is full or this pickup is too heavy for the remaining capacity
                break 
        
        if current_route:
            all_routes.append(current_route)
        elif not remaining_pickups.empty and not current_route :
            # This case can happen if the first closest pickup is already too heavy for an empty truck.
            # To prevent an infinite loop, remove the item if it's too big for an empty truck.
            if not distances.empty: # Ensure distances Series is not empty
                first_pickup_candidate_idx = distances.idxmin()
                first_pickup_candidate = remaining_pickups.loc[first_pickup_candidate_idx]
                if first_pickup_candidate['approxGarbageWeight'] > truck_capacity_kg:
                    # Using sys.stderr for warnings so stdout remains clean for JSON output
                    print(f"Warning: Request {first_pickup_candidate['requestId']} ({first_pickup_candidate['approxGarbageWeight']}kg) exceeds truck capacity ({truck_capacity_kg}kg) and will be skipped.", file=sys.stderr)
                    remaining_pickups = remaining_pickups.drop(first_pickup_candidate_idx)
            # If distances is empty, it implies remaining_pickups was empty or became empty after dropping some.
            # The outer loop `while not remaining_pickups.empty:` will handle termination.

        # The original logic had more complex conditions here.
        # The current structure with `while not remaining_pickups.empty:` and dropping items
        # that are too large (either for current capacity or overall truck capacity)
        # should cover termination. If a route is empty, it means no pickup could be added.
        # The outer loop will then try to form a new route with the (potentially reduced)
        # set of remaining_pickups. If all remaining_pickups are eventually dropped, the loop terminates.
                # but not necessarily for an empty truck. The outer loop should eventually terminate.
                # If the route is empty and pickups remain, it implies the loop broke due to capacity or stop limits.
                # If no items were added, it might be that the first item itself didn't fit.
                # The logic to break the outer loop if no progress is made is important.
                # For now, the main loop condition `while not remaining_pickups.empty:` will handle termination.
                # If a route is empty and pickups remain, it implies the first item considered was too large,
                # or some other break condition was met immediately.
                # If an item is too large for any truck, it should be logged and skipped.
                pass


    return all_routes

# Duplicated __main__ block was removed from the original file during a previous edit.
# The following is the correct single __main__ block.
if __name__ == '__main__':
    try:
        input_json_str = sys.stdin.read()
        if not input_json_str.strip():
            print(json.dumps({"error": "Empty input received from stdin.", "status": "error"}), file=sys.stderr)
            sys.exit(1)
            
        input_data = json.loads(input_json_str)

        pickup_data_list = input_data.get('pickup_data')
        depot_location_list = input_data.get('depot_location')
        truck_capacity_kg = input_data.get('truck_capacity_kg')
        max_stops = input_data.get('max_stops_per_route', 10) # Default if not provided

        # Validate presence of required parameters
        missing_params = []
        if pickup_data_list is None: missing_params.append("'pickup_data'")
        if depot_location_list is None: missing_params.append("'depot_location'")
        if truck_capacity_kg is None: missing_params.append("'truck_capacity_kg'")
        if missing_params:
            raise ValueError(f"Missing required parameters in input JSON: {', '.join(missing_params)}.")
        
        # Validate types and values
        if not isinstance(pickup_data_list, list):
            raise ValueError("'pickup_data' must be a list.")
        if not isinstance(depot_location_list, list) or len(depot_location_list) != 2:
            raise ValueError("'depot_location' must be a list of two numbers [lat, lon].")
        try:
            depot_location = (float(depot_location_list[0]), float(depot_location_list[1]))
        except (ValueError, TypeError) as e:
            raise ValueError(f"'depot_location' coordinates must be numbers: {e}")

        if not isinstance(truck_capacity_kg, (int, float)) or truck_capacity_kg <= 0:
            raise ValueError("'truck_capacity_kg' must be a positive number.")
        if not isinstance(max_stops, int) or max_stops < 0: # allow 0 stops, means route is just depot to depot
            raise ValueError("'max_stops_per_route' must be a non-negative integer.")

        # Convert pickup_data to DataFrame
        pickup_df = pd.DataFrame(pickup_data_list)
        
        # Define expected columns for the DataFrame, even if it's empty
        expected_df_cols = ['latitude', 'longitude', 'approxGarbageWeight', 'requestId']

        if pickup_df.empty and len(pickup_data_list) > 0:
            # This implies the list of dicts was not empty but resulted in an empty DataFrame,
            # possibly due to all dicts being empty or malformed.
            # Ensure DataFrame has the expected columns for consistency downstream.
            pickup_df = pd.DataFrame(columns=expected_df_cols)
            # No error raised here, create_routes_for_area handles empty df.
        elif pickup_df.empty and len(pickup_data_list) == 0:
            # If input list was empty, create an empty DF with correct columns.
            pickup_df = pd.DataFrame(columns=expected_df_cols)
        else: # DataFrame is not empty
            missing_cols_in_df = [col for col in expected_df_cols if col not in pickup_df.columns]
            if missing_cols_in_df:
                raise ValueError(f"Missing required columns in 'pickup_data' items: {', '.join(missing_cols_in_df)}")

        generated_routes = create_routes_for_area(
            pickup_df,
            depot_location,
            truck_capacity_kg,
            max_stops_per_route=max_stops
        )
        # Output success as JSON to stdout
        print(json.dumps({"routes": generated_routes, "status": "success"}))

    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input from stdin.", "status": "error"}), file=sys.stderr)
        sys.exit(1)
    except ValueError as ve: # Handles missing params, type errors, column errors
        print(json.dumps({"error": str(ve), "status": "error"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e: # Catch-all for other unexpected errors
        print(json.dumps({"error": f"An unexpected error occurred: {str(e)}", "status": "error"}), file=sys.stderr)
        sys.exit(1)
# Removed old file-based loading and filtering logic.
# The script now expects data via stdin as per the task requirements.
