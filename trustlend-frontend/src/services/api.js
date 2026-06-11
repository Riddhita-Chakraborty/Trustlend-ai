import axios from 'axios';

const API_URL = '/api';

// ── Existing ──────────────────────────────────────────────────────────────────

export const analyzeDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}/analyze`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    } catch (error) {
        if (error.response) throw error.response.data;
        throw new Error('Network error or server unreachable');
    }
};

export const compareDocuments = async (fileA, fileB) => {
    const formData = new FormData();
    formData.append('file_a', fileA);
    formData.append('file_b', fileB);
    try {
        const response = await axios.post(`${API_URL}/compare`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    } catch (error) {
        if (error.response) throw error.response.data;
        throw new Error('Network error or server unreachable');
    }
};

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * Start a chat session by uploading a file.
 * Returns { session_id, filename, char_count }
 */
export const startChatSession = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}/chat/start`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    } catch (error) {
        if (error.response) throw error.response.data;
        throw new Error('Network error or server unreachable');
    }
};

/**
 * Start a chat session from already-extracted loan text
 * (avoids re-running OCR if the user just finished an analysis).
 * Returns { session_id, filename, char_count }
 */
export const startChatFromText = async (loanText, filename = 'document') => {
    try {
        const response = await axios.post(
            `${API_URL}/chat/start`,
            { loan_text: loanText, filename },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.data;
    } catch (error) {
        if (error.response) throw error.response.data;
        throw new Error('Network error or server unreachable');
    }
};

/**
 * Ask a question in an existing chat session.
 * Returns { answer, citations }
 */
export const askQuestion = async (sessionId, question) => {
    try {
        const response = await axios.post(
            `${API_URL}/chat/ask`,
            { session_id: sessionId, question },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.data;
    } catch (error) {
        if (error.response) throw error.response.data;
        throw new Error('Network error or server unreachable');
    }
};

/**
 * End a chat session and free server memory.
 */
export const endChatSession = async (sessionId) => {
    try {
        await axios.delete(`${API_URL}/chat/end`, {
            data: { session_id: sessionId },
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (_) {
        // Non-critical — session will expire server-side anyway
    }
};