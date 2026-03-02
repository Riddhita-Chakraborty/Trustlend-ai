import requests
import json
import os

url = 'http://localhost:5000/api/analyze'
# Use the copied image
image_path = 'test_loan.png'

if not os.path.exists(image_path):
    print(f"Image not found at {image_path}")
    exit(1)

files = {'file': open(image_path, 'rb')}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except:
        print(f"Response Text: {response.text}")
except Exception as e:
    print(f"Request Failed: {e}")
