import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.MODE === 'development' 
        ? 'http://localhost:5000/api' 
        : '/api'
});

export const API_BASE_URL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:5000' 
    : '';

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
