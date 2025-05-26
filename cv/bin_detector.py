import json
import sys
import os
from PIL import Image

def detect_bins(image_identifier):
    print(f"Python script: Processing image_identifier: {image_identifier}", file=sys.stderr)
    
    if not os.path.exists(image_identifier) or not os.path.isfile(image_identifier):
        print(f"Error: File not found or not a file: {image_identifier}", file=sys.stderr)
        return {
            "image_identifier": image_identifier,
            "error": "File not found or not a regular file",
            "status": "error_file_issue"
        }

    try:
        with Image.open(image_identifier) as img:
            img_format = img.format
            img_size = img.size
            img_mode = img.mode
            
            # Attempt to load image data to catch truncated images, etc.
            img.load() 

            print(f"Image properties: Format={img_format}, Size={img_size}, Mode={img_mode}", file=sys.stderr)
            return {
                "image_identifier": image_identifier,
                "image_properties": {
                    "format": img_format,
                    "width": img_size[0],
                    "height": img_size[1],
                    "mode": img_mode
                },
                "detected_bins": [ 
                    # Placeholder for actual bin detection data if any
                    # For now, we can add a dummy detected bin based on image size for variety
                    {"bin_id": "bin_dummy_001", "type": "general", "confidence": 0.5, "location_in_image": [0, 0, img_size[0]//2, img_size[1]//2]}
                ],
                "status": "success_image_processed"
            }
    except FileNotFoundError: # Should be caught by os.path.exists, but as a safeguard
        print(f"Error: File not found (PIL): {image_identifier}", file=sys.stderr)
        return {
            "image_identifier": image_identifier,
            "error": "File not found",
            "status": "error_file_issue"
        }
    except IOError: # PIL's generic error for file issues (e.g. not an image, truncated)
        print(f"Error: Not a valid image or image file is corrupted: {image_identifier}", file=sys.stderr)
        return {
            "image_identifier": image_identifier,
            "error": "Not a valid image file or file is corrupted",
            "status": "error_file_issue"
        }
    except Exception as e:
        print(f"An unexpected error occurred while processing the image: {e}", file=sys.stderr)
        return {
            "image_identifier": image_identifier,
            "error": f"An unexpected error occurred: {str(e)}",
            "status": "error_unexpected"
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
