import { spawn } from 'child_process';
import path from 'path';
// Helper function to run a Python script (can be moved to a shared utility if used elsewhere)
const runPythonScript = (scriptPath, args = [], stdinData = null) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [scriptPath, ...args]);
        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

        pythonProcess.on('close', (code) => {
            if (stderrData && code !== 0) { // Prioritize stderr for error reporting from script
                console.error(`Python script ${scriptPath} STDERR: ${stderrData}`);
                try {
                     // Attempt to parse stderr as JSON, if script outputs JSON error
                    const errorJson = JSON.parse(stderrData);
                    return reject(errorJson);
                } catch (e) {
                    return reject({ error: `Python script ${scriptPath} failed with code ${code}`, details: stderrData.trim() });
                }
            }
            if (code !== 0) {
                console.error(`Python script ${scriptPath} exited with code ${code}, STDERR: ${stderrData}`);
                return reject({ error: `Python script ${scriptPath} failed with code ${code}`, details: stderrData.trim() });
            }
            try {
                const result = JSON.parse(stdoutData);
                resolve(result);
            } catch (e) {
                console.error(`Failed to parse JSON output from ${scriptPath}: ${stdoutData}`);
                reject({ error: `Failed to parse JSON output from ${scriptPath}`, details: e.message, rawOutput: stdoutData });
            }
        });
         pythonProcess.on('error', (err) => {
            console.error(`Failed to start Python script ${scriptPath}:`, err);
            reject({ error: `Failed to start Python script ${scriptPath}`, details: err.message });
        });

        if (stdinData) {
            pythonProcess.stdin.write(JSON.stringify(stdinData));
            pythonProcess.stdin.end();
        }
    });
};

export const generateDynamicRoutes = async (request, response) => {
    const { date, num_trucks = 1, vehicle_capacity_kg = 2000 } = request.body; // Using request.body for POST

    if (!date) { // Basic validation
        return response.status(400).json({ error: 'Missing "date" in request body' });
    }
    // Add more validation for date format, num_trucks, vehicle_capacity_kg if needed

    const simulatorScriptPath = path.resolve(process.cwd(), '../ml/simulators/smart_bin_simulator.py');
    const routingScriptPath = path.resolve(process.cwd(), '../ml/core_routing_ortools.py');
    // Assuming server runs from server/ directory. Adjust if CWD is project root.
    // If CWD is project root: path.resolve('ml/simulators/smart_bin_simulator.py')

    try {
        // 1. Get simulated "full" bins data
        console.log(`Calling smart_bin_simulator.py for date: ${date}`);
        const simulatedPickups = await runPythonScript(simulatorScriptPath, [date]);

        if (!simulatedPickups || simulatedPickups.length === 0) {
            return response.status(200).json({ routes: [], status: "success_no_pickups_simulated" });
        }

        // 2. Prepare input for OR-Tools routing script
        const depotLocation = [5.6037, -0.1870]; // Example for Accra - make configurable later
        const routingInput = {
            pickup_data: simulatedPickups,
            num_vehicles: parseInt(num_trucks, 10) || 1,
            vehicle_capacity_kg: parseInt(vehicle_capacity_kg, 10) || 2000,
            depot_location: depotLocation
        };

        // 3. Call OR-Tools routing script
        console.log(`Calling core_routing_ortools.py with ${simulatedPickups.length} pickups.`);
        const optimizedRouteData = await runPythonScript(routingScriptPath, [], routingInput);

        // Check if the script itself reported an error in its JSON output
        if (optimizedRouteData && optimizedRouteData.status && optimizedRouteData.status.startsWith('error_')) {
            console.error('Routing script reported an error:', optimizedRouteData);
            // Status code could be 400 or 500 depending on error type
            return response.status(400).json(optimizedRouteData);
        }

        return response.status(200).json(optimizedRouteData);

    } catch (error) {
        console.error('Error in generateDynamicRoutes controller:', error);
        // If error is already a structured JSON from runPythonScript, send it as is
        // Otherwise, create a generic error structure
        const errorPayload = error.error ? error : { error: 'Failed to generate dynamic routes', details: error.message || error };
        // Determine appropriate status code based on error origin if possible
        const statusCode = error.error && (error.status === "error_demand_exceeds_capacity" || error.details?.includes("ValueError")) ? 400 : 500;
        return response.status(statusCode).json(errorPayload);
    }
};
