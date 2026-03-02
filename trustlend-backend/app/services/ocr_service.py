import os
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# Configure Tesseract path if provided in env
tesseract_cmd = os.getenv('TESSERACT_CMD')
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

# Configure Poppler path for pdf2image if provided
poppler_path = os.getenv('POPPLER_PATH')

def extract_text(filepath):
    """
    Extracts text from an image or PDF file.
    """
    try:
        file_ext = os.path.splitext(filepath)[1].lower()
        
        if file_ext == '.pdf':
            return _extract_from_pdf(filepath)
        elif file_ext in ['.png', '.jpg', '.jpeg']:
            return _extract_from_image(filepath)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise e

def _extract_from_image(filepath):
    try:
        image = Image.open(filepath)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to process image: {str(e)}")

def _extract_from_pdf(filepath):
    try:
        # strict=False allows for some tolerance in PDF reading
        # poppler_path is required on Windows if not in PATH
        images = convert_from_path(filepath, poppler_path=poppler_path)
        
        full_text = []
        for i, image in enumerate(images):
            text = pytesseract.image_to_string(image)
            full_text.append(f"--- Page {i+1} ---\n{text}")
            
        return "\n".join(full_text)
    except Exception as e:
        raise Exception(f"Failed to process PDF: {str(e)}")
