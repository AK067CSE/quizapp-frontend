import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://quiz-app-backend-2nnz.onrender.com/api'  // Replace with your Render URL
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const quizAPI = {
  // Start a new quiz
  startQuiz: async (email) => {
    const response = await api.post('/quiz/start', { email });
    return response.data;
  },

  // Update question (visit/attempt)
  updateQuestion: async (quizId, questionId, data) => {
    const response = await api.put(`/quiz/question/${quizId}/${questionId}`, data);
    return response.data;
  },

  // Submit quiz
  submitQuiz: async (quizId, timeTaken) => {
    const response = await api.post(`/quiz/submit/${quizId}`, { time_taken: timeTaken });
    return response.data;
  },

  // Get quiz results
  getResults: async (quizId) => {
    const response = await api.get(`/quiz/results/${quizId}`);
    return response.data;
  }
};

export default api;
