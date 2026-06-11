"""
chat_service.py
---------------
Handles conversational Q&A about an uploaded loan document.

Design:
  - The full OCR text is stored in a server-side session store (in-memory dict,
    keyed by session_id) so follow-up questions don't require re-uploading.
  - Each question triggers a RAG retrieval over the KB + the loan text itself,
    then sends the assembled context + full conversation history to Gemini.
  - Returns an answer string + the KB citations that grounded the answer.

Place at: trustlend-backend/app/services/chat_service.py
"""

import uuid
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ── In-memory session store ───────────────────────────────────────────────────
# { session_id: { "loan_text": str, "history": [...], "created_at": datetime } }
_sessions: dict = {}
SESSION_TTL_HOURS = 2   # sessions expire after 2 hours of inactivity


def create_session(loan_text: str) -> str:
    """
    Store the loan document text and return a fresh session_id.
    Called once per document upload, right after OCR.
    """
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "loan_text":  loan_text,
        "history":    [],          # list of {"role": "user"|"assistant", "content": str}
        "created_at": datetime.utcnow(),
    }
    _cleanup_expired()
    logger.info(f"Chat session created: {session_id[:8]}…")
    return session_id


def get_session(session_id: str) -> dict | None:
    """Return session dict or None if not found / expired."""
    session = _sessions.get(session_id)
    if not session:
        return None
    # Refresh TTL on access
    session["created_at"] = datetime.utcnow()
    return session


def ask(session_id: str, question: str) -> dict:
    """
    Answer a question about the loan document stored in this session.

    Returns:
    {
        "answer":    str,
        "citations": [ { source_file, source_label, excerpt }, ... ]
    }
    """
    session = get_session(session_id)
    if not session:
        return {
            "answer":    "Session expired or not found. Please re-upload your document.",
            "citations": [],
        }

    loan_text = session["loan_text"]
    history   = session["history"]

    # ── RAG: retrieve KB chunks relevant to this question ────────────────────
    rag_context = ""
    citations   = []
    try:
        from app.services.rag_service import retrieve_with_citations
        # Query = question + first 500 chars of loan doc (adds domain context)
        combined_query = question + "\n" + loan_text[:500]
        rag_context, citations = retrieve_with_citations(combined_query, k=5)
    except Exception as e:
        logger.warning(f"RAG retrieval failed for chat: {e}")

    # ── Build Gemini prompt ───────────────────────────────────────────────────
    try:
        import google.generativeai as genai
        import os
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Format conversation history for context
        history_text = ""
        if history:
            history_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
                for m in history[-6:]   # last 3 turns only to stay within token limit
            )

        rag_section = ""
        if rag_context:
            rag_section = f"""
REGULATORY REFERENCE (from RBI Knowledge Base)
===============================================
{rag_context}
END OF REGULATORY REFERENCE
"""

        prompt = f"""You are a helpful financial assistant explaining a loan agreement to a borrower.
You have access to:
1. The full loan document text
2. Relevant RBI regulatory guidelines (below)
3. The conversation history so far

RULES:
- Answer only based on the loan document and regulatory context provided
- Be specific — quote or reference exact clauses from the document when relevant
- Use plain, simple language a non-expert can understand
- If a clause is risky or non-compliant, say so clearly and cite the RBI rule
- If the document doesn't contain enough information to answer, say so honestly
- Keep answers concise (3-6 sentences unless detail is needed)
- Do NOT make up information not present in the document

{rag_section}
LOAN DOCUMENT:
{loan_text[:20000]}

CONVERSATION HISTORY:
{history_text if history_text else "(No prior conversation)"}

USER'S QUESTION: {question}

ANSWER:"""

        response = model.generate_content(prompt)
        answer   = response.text.strip()

    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        answer = f"Sorry, I couldn't generate an answer right now. Error: {str(e)}"
        citations = []

    # ── Update history ────────────────────────────────────────────────────────
    session["history"].append({"role": "user",      "content": question})
    session["history"].append({"role": "assistant", "content": answer})

    return {"answer": answer, "citations": citations}


def clear_session(session_id: str):
    """Delete a session (called when user navigates away or re-uploads)."""
    _sessions.pop(session_id, None)


def _cleanup_expired():
    """Remove sessions older than SESSION_TTL_HOURS."""
    cutoff = datetime.utcnow() - timedelta(hours=SESSION_TTL_HOURS)
    expired = [sid for sid, s in _sessions.items() if s["created_at"] < cutoff]
    for sid in expired:
        del _sessions[sid]
    if expired:
        logger.info(f"Cleaned up {len(expired)} expired chat sessions.")