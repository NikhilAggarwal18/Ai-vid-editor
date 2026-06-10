import os
import json

rendered_file_path = "output/clip_46fccfc2-8e0b-40a6-a80b-a9d37ba67a22.mp4"
is_mock = False
print(f"File exists: {os.path.exists(rendered_file_path)}")
if os.path.exists(rendered_file_path):
    print(f"File size: {os.path.getsize(rendered_file_path)}")
    try:
        with open(rendered_file_path, "r") as f:
            data = json.load(f)
            print("Loaded JSON successfully:", data)
            is_mock = True
    except Exception as e:
        print("Error loading JSON:", e)

print("is_mock result:", is_mock)
