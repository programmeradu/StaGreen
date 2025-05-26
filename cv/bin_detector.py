import json
import sys

def detect_bins(image_identifier):
    # In a real scenario, this function would use a CV model
    # to detect bins in the image identified by image_identifier.
    # For now, it returns dummy data.
    print(f"Python script: Processing image_identifier: {image_identifier}", file=sys.stderr)
    return {
        "image_identifier": image_identifier,
        "detected_bins": [
            {"bin_id": "bin_001", "type": "recycling", "confidence": 0.95, "location_in_image": [10, 50, 30, 70]},
            {"bin_id": "bin_002", "type": "general_waste", "confidence": 0.88, "location_in_image": [100, 120, 50, 60]}
        ],
        "status": "success"
    }

if __name__ == '__main__':
    if len(sys.argv) > 1:
        identifier = sys.argv[1]
        result = detect_bins(identifier)
        print(json.dumps(result))
    else:
        error_result = {"error": "No image identifier provided", "status": "error"}
        print(json.dumps(error_result))
        sys.exit(1)
