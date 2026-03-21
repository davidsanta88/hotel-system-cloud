import axios from 'axios';

const api = axios.create({
    baseURL: 'http://hbalconplaza-001-site1.site4future.com/api',
});

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
