import { spawn } from 'child_process';
import path from 'path';
import PickUpRequest from '../models/pickup_request.js'; // For getOptimizedRoutes

// Helper function to send JSON responses
const sendJsonResponse = (response, statusCode, data) => {
    response.status(statusCode).json(data);
};

export const getWastePrediction = async (request, response) => {
    const { area, days } = request.query;

    // Validate area
    if (!area || typeof area !== 'string' || area.trim() === '') {
        return sendJsonResponse(response, 400, { error: 'Area must be a non-empty string.' });
    }

    // Validate days
    const daysInt = parseInt(days, 10);
    if (isNaN(daysInt) || daysInt <= 0) {
        return sendJsonResponse(response, 400, { error: 'Days must be a positive integer.' });
    }

    // Define paths - assuming server is run from its own directory 'server/'
    // So, '../ml/' points to the 'ml/' directory at the project root.
    const scriptPath = path.resolve(process.cwd(), '../ml/predict_waste.py');
    const modelsDir = path.resolve(process.cwd(), '../ml/models/');

    console.log(`Spawning waste prediction script: python ${scriptPath} "${area}" ${daysInt} "${modelsDir}"`);

    const pythonProcess = spawn('python', [scriptPath, area, daysInt.toString(), modelsDir]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`Waste Prediction Script STDERR: ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Waste Prediction Script exited with code ${code}`);
        if (stderrData || code !== 0) {
            console.error(`Error during waste prediction for area "${area}": ${stderrData || `Exited with code ${code}`}`);
            // Attempt to parse stderrData if it contains a JSON error from the script
            try {
                const errorJson = JSON.parse(stderrData);
                if (errorJson.error) {
                    return sendJsonResponse(response, 500, { error: `Prediction script error: ${errorJson.error}` });
                }
            } catch (e) {
                // Not a JSON error from script, or malformed
            }
            return sendJsonResponse(response, 500, { error: 'Error during prediction processing.' });
        }

        try {
            const parsedOutput = JSON.parse(stdoutData);
            if (parsedOutput.error) { // Handle cases where script itself prints an error JSON to stdout
                 console.error(`Prediction script returned an error in stdout: ${parsedOutput.error}`);
                 return sendJsonResponse(response, 500, { error: `Prediction error: ${parsedOutput.error}` });
            }
            return sendJsonResponse(response, 200, parsedOutput);
        } catch (error) {
            console.error(`Error parsing waste prediction output for area "${area}": ${error.message}\nRaw output: ${stdoutData}`);
            return sendJsonResponse(response, 500, { error: 'Failed to parse prediction output.' });
        }
    });

    pythonProcess.on('error', (error) => {
        console.error(`Failed to start waste prediction script for area "${area}": ${error.message}`);
        return sendJsonResponse(response, 500, { error: 'Failed to start prediction script.' });
    });
};

export const getOptimizedRoutes = async (request, response) => {
    const { date } = request.query;

    // Validate date (basic validation, can be improved with a library like moment.js or date-fns)
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return sendJsonResponse(response, 400, { error: 'Invalid date format. Please use YYYY-MM-DD.' });
    }
    
    const queryDate = new Date(date); // Convert to Date object for MongoDB query
    if (isNaN(queryDate.getTime())) {
        return sendJsonResponse(response, 400, { error: 'Invalid date value.' });
    }

    // Define paths
    const scriptPath = path.resolve(process.cwd(), '../ml/optimize_routes.py');

    try {
        // Fetch pickup requests for the given date and status 'Pending'
        // Note: MongoDB stores dates in UTC. Ensure your date querying strategy is robust.
        // For a specific day, you might need a range query (start of day to end of day).
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const pickupRequests = await PickUpRequest.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            requestStatus: 'Pending'
        }).select('requestId latitude longitude approxGarbageWeight -_id'); // Select specific fields

        if (!pickupRequests || pickupRequests.length === 0) {
            return sendJsonResponse(response, 200, { routes: [], status: "success", message: "No pending pickups for the selected date." });
        }

        // Prepare input for Python script
        const depot_location = [5.6037, -0.1870]; // Accra, Ghana (Example, make configurable)
        const truck_capacity_kg = 2000; // Example, make configurable
        const max_stops_per_route = 10; // Example, make configurable

        const inputJsonData = {
            pickup_data: pickupRequests.map(req => req.toObject()), // Convert Mongoose docs to plain objects
            depot_location,
            truck_capacity_kg,
            max_stops_per_route
        };
        
        console.log(`Spawning route optimization script: python ${scriptPath}`);
        const pythonProcess = spawn('python', [scriptPath]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdin.write(JSON.stringify(inputJsonData));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error(`Route Optimization Script STDERR: ${data.toString()}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Route Optimization Script exited with code ${code}`);
            if (stderrData || code !== 0) {
                console.error(`Error during route optimization for date "${date}": ${stderrData || `Exited with code ${code}`}`);
                 try {
                    const errorJson = JSON.parse(stderrData); // Python script outputs JSON errors to stderr
                    if (errorJson.error) {
                        return sendJsonResponse(response, 500, { error: `Route optimization script error: ${errorJson.error}` });
                    }
                } catch (e) {
                    // Not a JSON error from script, or malformed
                }
                return sendJsonResponse(response, 500, { error: 'Error during route optimization processing.' });
            }

            try {
                const parsedOutput = JSON.parse(stdoutData);
                 if (parsedOutput.error) { // Handle cases where script itself prints an error JSON to stdout
                    console.error(`Route optimization script returned an error in stdout: ${parsedOutput.error}`);
                    return sendJsonResponse(response, 500, { error: `Optimization error: ${parsedOutput.error}` });
                }
                return sendJsonResponse(response, 200, parsedOutput);
            } catch (error) {
                console.error(`Error parsing route optimization output for date "${date}": ${error.message}\nRaw output: ${stdoutData}`);
                return sendJsonResponse(response, 500, { error: 'Failed to parse route optimization output.' });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error(`Failed to start route optimization script for date "${date}": ${error.message}`);
            return sendJsonResponse(response, 500, { error: 'Failed to start route optimization script.' });
        });

    } catch (dbError) {
        console.error(`Database error while fetching pickup requests for date "${date}": ${dbError.message}`);
        return sendJsonResponse(response, 500, { error: 'Database error while fetching pickup requests.' });
    }
};
