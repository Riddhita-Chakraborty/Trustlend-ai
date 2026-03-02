import os
import pytesseract
from app.services.ocr_service import extract_text
from dotenv import load_dotenv

load_dotenv()

print("Testing OCR Service...")
print(f"Tesseract CMD from env: {os.getenv('TESSERACT_CMD')}")
print(f"Pytesseract CMD: {pytesseract.pytesseract.tesseract_cmd}")

image_path = "test_loan.png"
if not os.path.exists(image_path):
    print(f"Image not found at {image_path}")
    exit(1)

try:
    text = extract_text(image_path)
    print("--- Extracted Text Start ---")
    print(text)
    print("--- Extracted Text End ---")
except Exception as e:
    print("OCR Failed:")
    print(e)
