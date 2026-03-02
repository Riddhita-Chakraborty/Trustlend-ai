from flask import Blueprint, request, current_app
from app.utils.response import success_response, error_response
from app.utils.file_utils import save_upload
from app.services import ocr_service, llm_service, fairness_service

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_document():
    if 'file' not in request.files:
        return error_response("No file part", 400)
    
    file = request.files['file']
    
    if file.filename == '':
        return error_response("No selected file", 400)
        
    filepath, filename = save_upload(file)
    
    if not filepath:
        return error_response("File type not allowed or save failed", 400)
        
    try:
        # 1. OCR Extraction
        text = ocr_service.extract_text(filepath)
        if not text or len(text) < 10:
            return error_response("Could not extract text from document. Please ensure it's a clear image or PDF.", 400)

        # 2. LLM Analysis
        analysis_result = llm_service.analyze_loan_terms(text)
        if "error" in analysis_result:
             return error_response(analysis_result["error"], 500)

        # 3. Fairness Scoring
        fairness_score = fairness_service.calculate_fairness(analysis_result)

        # 4. Construct Final Response
        response_data = {
            "analysis": analysis_result,
            "fairness": fairness_score,
            "filename": filename
        }

        return success_response(response_data, "Document analyzed successfully")
        
    except Exception as e:
        current_app.logger.error(f"Analysis Failed: {str(e)}")
        return error_response(f"An error occurred during analysis: {str(e)}", 500)
