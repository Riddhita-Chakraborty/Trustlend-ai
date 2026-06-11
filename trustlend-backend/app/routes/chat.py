"""
chat.py
-------
Flask routes for the conversational Q&A feature.

Endpoints:
  POST /api/chat/start   — upload a document, get back a session_id
  POST /api/chat/ask     — ask a question using an existing session_id
  DELETE /api/chat/end   — clean up a session

Place at: trustlend-backend/app/routes/chat.py
Register in: trustlend-backend/app/__init__.py
"""

from flask import Blueprint, request, current_app
from app.utils.response import success_response, error_response
from app.utils.file_utils import save_upload
from app.services import ocr_service
from app.services.chat_service import create_session, ask, clear_session

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/chat/start', methods=['POST'])
def start_chat():
    """
    POST /api/chat/start
    Form field: file (PDF or image)

    Creates a chat session from the uploaded document.
    Returns: { session_id, filename, page_count (approx) }

    Note: If the user already went through /api/analyze for this document,
    the frontend can pass the already-extracted text via JSON instead.
    Both modes are supported.
    """
    # Mode A: file upload
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return error_response("No file selected.", 400)

        filepath, filename = save_upload(file)
        if not filepath:
            return error_response("File type not allowed or save failed.", 400)

        try:
            loan_text = ocr_service.extract_text(filepath)
        except Exception as e:
            current_app.logger.error(f"OCR failed in chat/start: {e}")
            return error_response(f"Could not extract text: {e}", 500)

        if not loan_text or len(loan_text) < 10:
            return error_response("Could not extract text from document.", 400)

    # Mode B: raw text (from a previous analyze call)
    elif request.is_json and request.json.get("loan_text"):
        loan_text = request.json["loan_text"]
        filename  = request.json.get("filename", "document")

    else:
        return error_response("Provide either a 'file' upload or JSON with 'loan_text'.", 400)

    session_id = create_session(loan_text)

    return success_response(
        {
            "session_id":  session_id,
            "filename":    filename,
            "char_count":  len(loan_text),
        },
        "Chat session started. You can now ask questions about this document."
    )


@chat_bp.route('/chat/ask', methods=['POST'])
def ask_question():
    """
    POST /api/chat/ask
    JSON body: { "session_id": "...", "question": "..." }

    Returns: { answer, citations: [{source_label, excerpt}] }
    """
    data = request.get_json(silent=True) or {}

    session_id = data.get("session_id", "").strip()
    question   = data.get("question",   "").strip()

    if not session_id:
        return error_response("session_id is required.", 400)
    if not question:
        return error_response("question is required.", 400)
    if len(question) > 1000:
        return error_response("Question too long (max 1000 characters).", 400)

    result = ask(session_id, question)

    return success_response(result, "Answer generated.")


@chat_bp.route('/chat/end', methods=['DELETE'])
def end_chat():
    """
    DELETE /api/chat/end
    JSON body: { "session_id": "..." }

    Clears the session to free memory.
    """
    data       = request.get_json(silent=True) or {}
    session_id = data.get("session_id", "")
    clear_session(session_id)
    return success_response({}, "Session ended.")