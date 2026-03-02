import axios from 'axios';

const API_URL = '/api';

export const analyzeDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}/analyze`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        }
        throw new Error('Network error or server unreachable');
    }
};
