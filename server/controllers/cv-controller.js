import { spawn } from "child_process";
import path from "path";

export const detectBinsInImage = async (request, response) => {
  // For now, we'll assume 'image_identifier' (e.g., a URL or a file path later)
  // is passed in the request body.
  // Actual image upload and handling would require middleware like multer.
  const { image_identifier } = request.body;

  if (!image_identifier) {
    return response
      .status(400)
      .json({ error: "Missing image_identifier in request body" });
  }

  const scriptPath = path.resolve(process.cwd(), "../cv/bin_detector.py");
  // Note: In a real scenario, process.cwd() might not be 'server/'.
  // This path assumes the server is run from the 'server/' directory.

  console.log(
    `Calling CV script at: ${scriptPath} with identifier: ${image_identifier}`,
  );

  const pythonProcess = spawn("python", [scriptPath, image_identifier]);

  let stdoutData = "";
  let stderrData = "";

  pythonProcess.stdout.on("data", (data) => {
    stdoutData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    stderrData += data.toString();
    console.error(`CV Script STDERR: ${data.toString()}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`CV script exited with code ${code}`);
    if (stderrData && code !== 0) {
      // Check stderrData as well, as script might print to stderr before non-zero exit
      try {
        const errorJson = JSON.parse(stderrData); // Python script might output JSON error
        return response.status(500).json(errorJson);
      } catch (e) {
        return response
          .status(500)
          .json({ error: "CV script error", details: stderrData });
      }
    }
    if (code !== 0) {
      // This case handles non-zero exit without stderr, or stderr that wasn't JSON
      return response.status(500).json({
        error: "CV script failed",
        exitCode: code,
        details: stderrData,
      });
    }

    try {
      const result = JSON.parse(stdoutData);
      if (result.status === "error") {
        // This checks for "error" status set by the python script itself
        return response.status(400).json(result); // Error reported by script logic
      }
      return response.status(200).json(result);
    } catch (e) {
      return response.status(500).json({
        error: "Failed to parse CV script output",
        details: stdoutData,
      });
    }
  });

  pythonProcess.on("error", (err) => {
    console.error("Failed to start CV script:", err);
    return response
      .status(500)
      .json({ error: "Failed to start CV script", details: err.message });
  });
};
