import json
import math
import sys
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def create_data_model(pickups, num_vehicles, vehicle_capacities, depot_lat_lon):
    data = {}
    data['locations'] = [depot_lat_lon] + [(p['latitude'], p['longitude']) for p in pickups]
    # Ensure demands are positive integers for OR-Tools
    data['demands'] = [0] + [max(1, int(p['approxGarbageWeight'])) for p in pickups]
    data['num_vehicles'] = num_vehicles
    data['vehicle_capacities'] = vehicle_capacities
    data['depot'] = 0
    data['pickups_info'] = [None] + pickups
    return data

def create_distance_matrix(locations):
    distance_matrix = [[0] * len(locations) for _ in range(len(locations))]
    for from_node in range(len(locations)):
        for to_node in range(len(locations)):
            if from_node == to_node:
                continue
            dist = haversine_distance(
                locations[from_node][0], locations[from_node][1],
                locations[to_node][0], locations[to_node][1]
            )
            distance_matrix[from_node][to_node] = int(dist * 1000)
    return distance_matrix

def solve_cvrp(data):
    manager = pywrapcp.RoutingIndexManager(len(data['locations']),
                                       data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    distance_matrix = create_distance_matrix(data['locations'])
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['demands'][from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        data['vehicle_capacities'],
        True,
        'Capacity')

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.FromSeconds(5)

    solution = routing.SolveWithParameters(search_parameters)

    routes = []
    if solution:
        for vehicle_id in range(data['num_vehicles']):
            index = routing.Start(vehicle_id)
            route_for_vehicle = []
            # total_load = 0 # Not strictly needed for output here
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                if node_index != data['depot']:
                    pickup_info = data['pickups_info'][node_index]
                    # Ensure all necessary fields are present for the frontend
                    route_for_vehicle.append({
                        "requestId": pickup_info.get("requestId", f"P{node_index}"),
                        "latitude": pickup_info["latitude"],
                        "longitude": pickup_info["longitude"],
                        "approxGarbageWeight": pickup_info["approxGarbageWeight"]
                    })
                    # total_load += data['demands'][node_index]
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                if index == previous_index: # Break if stuck (should not happen in valid solutions)
                    break

            if route_for_vehicle: # Only add non-empty routes
                routes.append(route_for_vehicle)
    return routes

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        pickups = input_data['pickup_data']
        num_vehicles = input_data.get('num_vehicles', 1)
        vehicle_capacity = input_data.get('vehicle_capacity_kg', 2000)
        vehicle_capacities = [vehicle_capacity] * num_vehicles
        depot_lat_lon = tuple(input_data['depot_location'])

        if not pickups:
            print(json.dumps({"routes": [], "status": "success_no_pickups"}))
            sys.exit(0)

        data_model = create_data_model(pickups, num_vehicles, vehicle_capacities, depot_lat_lon)

        max_demand = 0
        if data_model['demands']: # Check if demands list is not empty
            max_demand = max(data_model['demands'])

        if vehicle_capacities and max_demand > vehicle_capacities[0] :
            print(json.dumps({"error": f"At least one pickup demand ({max_demand}kg) exceeds vehicle capacity ({vehicle_capacities[0]}kg).", "status": "error_demand_exceeds_capacity"}))
            sys.exit(1)

        if not data_model['locations'] or len(data_model['locations']) <= 1 and not data_model['demands']: # if only depot or no locations
             print(json.dumps({"routes": [], "status": "success_no_valid_pickups_for_routing"}))
             sys.exit(0)


        routes = solve_cvrp(data_model)
        print(json.dumps({"routes": routes, "status": "success"}))

    except Exception as e:
        # Print error to stderr for the Node.js controller to capture
        print(json.dumps({"error": str(e), "status": "error_unexpected_script_failure"}), file=sys.stderr)
        sys.exit(1)
