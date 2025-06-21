// API base URL - configurable via environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const getUsersList = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (res.ok) {
      // Check res.ok for success (status 200-299)
      const response = await res.json();
      return response;
    }
    // Handle non-ok responses
    try {
      const errorResponse = await res.json();
      console.error('Error from getUsersList API (non-ok):', res.status, errorResponse);
      return { error: errorResponse.error || `HTTP error! status: ${res.status}` };
    } catch (e) {
      console.error('Error parsing non-ok response for getUsersList API:', res.status, e);
      return { error: `HTTP error! status: ${res.status}` };
    }
  } catch (error) {
    console.error('Network error while calling getUsersList api', error);
    return { error: error.message || 'Network request failed' };
  }
};

export const getPickUpRequests = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/getAllPickUpRequests`);
    if (res.ok) {
      const response = await res.json();
      return response;
    }
    try {
      const errorResponse = await res.json();
      console.error('Error from getPickUpRequests API (non-ok):', res.status, errorResponse);
      return { error: errorResponse.error || `HTTP error! status: ${res.status}` };
    } catch (e) {
      console.error('Error parsing non-ok response for getPickUpRequests API:', res.status, e);
      return { error: `HTTP error! status: ${res.status}` };
    }
  } catch (error) {
    console.error('Network error while calling getPickUpRequests API', error);
    return { error: error.message || 'Network request failed' };
  }
};

export const getTrucksList = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/getTrucksList`);
    if (res.ok) {
      const response = await res.json();
      return response;
    }
    try {
      const errorResponse = await res.json();
      console.error('Error from getTrucksList API (non-ok):', res.status, errorResponse);
      return { error: errorResponse.error || `HTTP error! status: ${res.status}` };
    } catch (e) {
      console.error('Error parsing non-ok response for getTrucksList API:', res.status, e);
      return { error: `HTTP error! status: ${res.status}` };
    }
  } catch (error) {
    console.error('Network error while calling getTrucksList API', error);
    return { error: error.message || 'Network request failed' };
  }
};

export const getPendingPickUpRequests = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/getPendingPickUpRequests`);
    if (res.ok) {
      const response = await res.json();
      return response;
    }
    try {
      const errorResponse = await res.json();
      console.error('Error from getPendingPickUpRequests API (non-ok):', res.status, errorResponse);
      return { error: errorResponse.error || `HTTP error! status: ${res.status}` };
    } catch (e) {
      console.error('Error parsing non-ok response for getPendingPickUpRequests API:', res.status, e);
      return { error: `HTTP error! status: ${res.status}` };
    }
  } catch (error) {
    console.error('Network error while calling getPendingPickUpRequests API', error);
    return { error: error.message || 'Network request failed' };
  }
};

export const getIdleTrucks = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/getIdleTrucks`);
    if (res.ok) {
      const response = await res.json();
      return response;
    }
    try {
      const errorResponse = await res.json();
      console.error('Error from getIdleTrucks API (non-ok):', res.status, errorResponse);
      return { error: errorResponse.error || `HTTP error! status: ${res.status}` };
    } catch (e) {
      console.error('Error parsing non-ok response for getIdleTrucks API:', res.status, e);
      return { error: `HTTP error! status: ${res.status}` };
    }
  } catch (error) {
    console.error('Network error while calling getIdleTrucks API', error);
    return { error: error.message || 'Network request failed' };
  }
};

export const getWastePredictionsAPI = async (area, days) => {
  try {
    const url = `${API_BASE_URL}/api/ml/waste-prediction?area=${encodeURIComponent(area)}&days=${days}`;
    const res = await fetch(url);

    // It's good practice to check if the response is ok before parsing JSON
    if (!res.ok) {
      // Try to parse error response from backend if available
      const errorData = await res.json().catch(() => null); // Avoid crashing if error response isn't JSON
      console.error('Error fetching waste predictions:', res.status, res.statusText, errorData);
      // You might want to throw an error here or return a specific error object
      // For now, returning what the backend sent or a generic error
      return errorData || { error: `HTTP error! status: ${res.status}` };
    }

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error while calling getWastePredictionsAPI:', error);
    // Return an error object that the component can check
    return { error: error.message || 'Failed to fetch predictions.' };
  }
};

export const getOptimizedRoutesAPI = async (date) => {
  try {
    const url = `${API_BASE_URL}/api/ml/optimize-routes?date=${date}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error('Error fetching optimized routes:', res.status, res.statusText, errorData);
      return errorData || { error: `HTTP error! status: ${res.status}` };
    }

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error while calling getOptimizedRoutesAPI:', error);
    return { error: error.message || 'Failed to fetch optimized routes.' };
  }
};

export const getPickupHeatmapDataAPI = async (date) => {
  try {
    const url = `${API_BASE_URL}/api/spatial/pickup-heatmap?date=${date}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error('Error fetching pickup heatmap data:', res.status, res.statusText, errorData);
      return errorData || { error: `HTTP error! status: ${res.status}` };
    }

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error while calling getPickupHeatmapDataAPI:', error);
    return { error: error.message || 'Failed to fetch pickup heatmap data.' };
  }
};

export const generateDynamicRoutesAPI = async (date, num_trucks, vehicle_capacity_kg) => {
  try {
    const url = `${API_BASE_URL}/api/fleet/generate-dynamic-routes`;
    const requestBody = { date };
    if (num_trucks !== undefined && num_trucks !== null) {
      requestBody.num_trucks = num_trucks;
    }
    if (vehicle_capacity_kg !== undefined && vehicle_capacity_kg !== null) {
      requestBody.vehicle_capacity_kg = vehicle_capacity_kg;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      let parsedError = { message: `HTTP error! status: ${res.status}` }; // Default error
      try {
        // Attempt to parse the error response from the backend
        const errorData = await res.json();
        parsedError = errorData || parsedError; // Use backend error if available
      } catch (e) {
        // If parsing fails, stick with the default HTTP error
        console.error('Failed to parse error JSON from backend:', e);
      }
      console.error('Error generating dynamic routes:', res.status, res.statusText, parsedError);
      return {
        error: parsedError.error || parsedError.message || 'Failed to generate dynamic routes',
        details: parsedError.details,
        status: res.status,
      };
    }

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error while calling generateDynamicRoutesAPI:', error);
    return { error: error.message || 'Network request failed' };
  }
};
