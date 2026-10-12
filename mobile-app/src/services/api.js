import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const analyzeItemImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'item_capture.jpg',
  });

  try {
    const response = await axios.post(`${API_BASE_URL}/analyze-item`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("API Error during analysis:", error);
    throw error;
  }
};