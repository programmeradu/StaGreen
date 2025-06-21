import fetch from "node-fetch";
import PickUpRequest from "../models/pickup_request.js"; // For getOptimizedRoutes

// Helper function to send JSON responses
const sendJsonResponse = (response, statusCode, data) => {
  response.status(statusCode).json(data);
};

// FastAPI ML service URL - configurable via environment variable
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

export const getWastePrediction = async (request, response) => {
  const { area, days } = request.query;

  // Validate area
  if (!area || typeof area !== "string" || area.trim() === "") {
    return sendJsonResponse(response, 400, {
      error: "Area must be a non-empty string.",
    });
  }

  // Validate days
  const daysInt = parseInt(days, 10);
  if (isNaN(daysInt) || daysInt <= 0) {
    return sendJsonResponse(response, 400, {
      error: "Days must be a positive integer.",
    });
  }

  try {
    // Call FastAPI ML service for predictions
    const mlResponse = await fetch(`${ML_API_URL}/predict/fill-levels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        predictions: [
          {
            bin_id: `area_${area}`,
            timestamp: new Date().toISOString(),
            area,
            prediction_days: daysInt,
          },
        ],
      }),
    });

    if (!mlResponse.ok) {
      const errorData = await mlResponse
        .json()
        .catch(() => ({ error: "ML service error" }));
      console.error(
        `ML service error for area "${area}":`,
        mlResponse.status,
        errorData,
      );
      return sendJsonResponse(response, 500, {
        error: `ML service unavailable: ${errorData.detail || errorData.error || "Unknown error"}`,
      });
    }

    const predictionData = await mlResponse.json();
    return sendJsonResponse(response, 200, predictionData);
  } catch (error) {
    console.error(
      `Error calling ML service for waste prediction for area "${area}": ${error.message}`,
    );
    return sendJsonResponse(response, 500, {
      error: "Failed to connect to ML prediction service.",
    });
  }
};

export const getOptimizedRoutes = async (request, response) => {
  const { date } = request.query;

  // Validate date (basic validation, can be improved with a library like moment.js or date-fns)
  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return sendJsonResponse(response, 400, {
      error: "Invalid date format. Please use YYYY-MM-DD.",
    });
  }

  const queryDate = new Date(date); // Convert to Date object for MongoDB query
  if (isNaN(queryDate.getTime())) {
    return sendJsonResponse(response, 400, { error: "Invalid date value." });
  }

  try {
    // Fetch pickup requests for the given date and status 'Pending'
    const startOfDay = new Date(queryDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const pickupRequests = await PickUpRequest.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      requestStatus: "Pending",
    }).select("requestId latitude longitude approxGarbageWeight -_id");

    if (!pickupRequests || pickupRequests.length === 0) {
      return sendJsonResponse(response, 200, {
        routes: [],
        status: "success",
        message: "No pending pickups for the selected date.",
      });
    }

    // Prepare input for FastAPI route optimization
    const routeOptimizationData = {
      pickup_requests: pickupRequests.map((req) => ({
        citizen_id: req.requestId,
        latitude: req.latitude,
        longitude: req.longitude,
        estimated_waste_volume_liters: (req.approxGarbageWeight || 50) * 1.2, // Convert kg to liters (rough estimate)
        priority: "medium",
        pickup_time_window_start: `${date}T08:00:00Z`,
        pickup_time_window_end: `${date}T18:00:00Z`,
      })),
      available_trucks: [
        {
          truck_id: "truck_001",
          current_latitude: 5.6037, // Accra, Ghana depot
          current_longitude: -0.187,
          capacity_liters: 2000,
          available_from: `${date}T08:00:00Z`,
          available_until: `${date}T18:00:00Z`,
        },
      ],
    };

    // Call FastAPI route optimization service
    const mlResponse = await fetch(`${ML_API_URL}/routes/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(routeOptimizationData),
    });

    if (!mlResponse.ok) {
      const errorData = await mlResponse
        .json()
        .catch(() => ({ error: "Route optimization service error" }));
      console.error(
        `Route optimization service error for date "${date}":`,
        mlResponse.status,
        errorData,
      );
      return sendJsonResponse(response, 500, {
        error: `Route optimization service unavailable: ${errorData.detail || errorData.error || "Unknown error"}`,
      });
    }

    const optimizedRoutes = await mlResponse.json();
    return sendJsonResponse(response, 200, optimizedRoutes);
  } catch (error) {
    if (error.name === "MongoError" || error.message.includes("Database")) {
      console.error(
        `Database error while fetching pickup requests for date "${date}": ${error.message}`,
      );
      return sendJsonResponse(response, 500, {
        error: "Database error while fetching pickup requests.",
      });
    } else {
      console.error(
        `Error calling route optimization service for date "${date}": ${error.message}`,
      );
      return sendJsonResponse(response, 500, {
        error: "Failed to connect to route optimization service.",
      });
    }
  }
};

export const getPickupHeatmapData = async (request, response) => {
  const { date } = request.query;

  // Validate date
  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return sendJsonResponse(response, 400, {
      error: "Invalid date format. Please use YYYY-MM-DD.",
    });
  }

  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) {
    return sendJsonResponse(response, 400, { error: "Invalid date value." });
  }

  try {
    const startOfDay = new Date(queryDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const pickupRequests = await PickUpRequest.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      // Fetching 'Completed' and 'Scheduled' statuses for the heatmap
      requestStatus: { $in: ["Completed", "Scheduled"] },
    }).select("requestId latitude longitude garbageType approxGarbageWeight");

    const features = pickupRequests.reduce((acc, pickup) => {
      // Ensure latitude and longitude are present and are valid numbers
      const latitude = parseFloat(pickup.latitude);
      const longitude = parseFloat(pickup.longitude);

      if (
        pickup.latitude != null &&
        pickup.longitude != null &&
        !isNaN(latitude) &&
        !isNaN(longitude)
      ) {
        acc.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON is [lon, lat]
          },
          properties: {
            requestId: pickup.requestId,
            garbageType: pickup.garbageType,
            // Ensure approxGarbageWeight is a number, default to 0 if not parseable
            approxGarbageWeight: parseFloat(pickup.approxGarbageWeight) || 0,
          },
        });
      } else {
        console.warn(
          `Skipping pickup request ${pickup.requestId} due to missing or invalid coordinates.`,
        );
      }
      return acc;
    }, []);

    const geoJsonData = {
      type: "FeatureCollection",
      features,
    };

    return sendJsonResponse(response, 200, geoJsonData);
  } catch (dbError) {
    console.error(
      `Database error while fetching pickup requests for heatmap on date "${date}": ${dbError.message}`,
    );
    return sendJsonResponse(response, 500, {
      error: "Database error while fetching pickup heatmap data.",
    });
  }
};
