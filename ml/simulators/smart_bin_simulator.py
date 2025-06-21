import json
import random
import sys
from datetime import datetime

# Predefined sample bin locations (bin_id, lat, lon, capacity_kg)
PREDEFINED_BINS = [
    {"bin_id": "B001", "latitude": 5.605, "longitude": -0.187, "capacity_kg": 100},
    {"bin_id": "B002", "latitude": 5.610, "longitude": -0.190, "capacity_kg": 150},
    {"bin_id": "B003", "latitude": 5.600, "longitude": -0.180, "capacity_kg": 100},
    {"bin_id": "B004", "latitude": 5.615, "longitude": -0.175, "capacity_kg": 200},
    {"bin_id": "B005", "latitude": 5.595, "longitude": -0.195, "capacity_kg": 100},
    {"bin_id": "B006", "latitude": 5.608, "longitude": -0.170, "capacity_kg": 150},
    {"bin_id": "B007", "latitude": 5.602, "longitude": -0.200, "capacity_kg": 100},
    {"bin_id": "B008", "latitude": 5.612, "longitude": -0.185, "capacity_kg": 200},
    {"bin_id": "B009", "latitude": 5.598, "longitude": -0.178, "capacity_kg": 150},
    {"bin_id": "B010", "latitude": 5.606, "longitude": -0.192, "capacity_kg": 100},
]

def get_simulated_full_bins(target_date_str):
    """
    Simulates bin fill levels for a target date.
    For PoC, this uses a deterministic but date-influenced pattern.
    """
    try:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
        day_of_month = target_date.day
    except ValueError:
        day_of_month = 1

    full_bins = []
    # Use a fixed seed based on the day to make output deterministic per day
    # but different for different days.
    random.seed(day_of_month)

    for bin_info in PREDEFINED_BINS:
        simulated_fill_percentage = random.randint(70, 100) # More direct simulation

        if simulated_fill_percentage > 75:
            waste_amount = int(bin_info["capacity_kg"] * (simulated_fill_percentage / 100.0))
            waste_amount = max(1, waste_amount)

            full_bins.append({
                "requestId": bin_info["bin_id"],
                "latitude": bin_info["latitude"],
                "longitude": bin_info["longitude"],
                "approxGarbageWeight": waste_amount,
                "capacity_kg": bin_info["capacity_kg"]
            })
    return full_bins

if __name__ == "__main__":
    if len(sys.argv) > 1:
        date_arg = sys.argv[1]
    else:
        date_arg = datetime.now().strftime("%Y-%m-%d")

    simulated_data = get_simulated_full_bins(date_arg)
    print(json.dumps(simulated_data))
