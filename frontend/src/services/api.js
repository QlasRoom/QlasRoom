import axios from 'axios';

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Auto-detect production environment if URL is missing
if (!API_BASE_URL) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Use relative path for Vercel Services configuration
        API_BASE_URL = '/_/backend/api';
    } else {
        // Fallback for local development
        API_BASE_URL = 'http://localhost:8000/api';
    }
}

// Protocol Guard: Ensure HTTPS in production to avoid Mixed Content errors
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://')) {
    if (!API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
        API_BASE_URL = API_BASE_URL.replace('http://', 'https://');
    }
}

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 second timeout for slow production endpoints
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;
    
    // Handle Network Errors (like backend down)
    if (!error.response) {
        console.error("Network Error: Backend might be down.", error.message);
        return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token expired/invalid)
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
            try {
                console.log("Access token expired, attempting refresh...");
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });
                const newAccessToken = response.data.access;
                localStorage.setItem('access_token', newAccessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (err) {
                console.error("Refresh token invalid or expired. Logging out...", err);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                if (typeof window !== 'undefined') window.location.href = '/?error=session_expired';
            }
        } else {
            console.warn("No refresh token found. Redirecting to landing...");
            if (typeof window !== 'undefined') window.location.href = '/';
        }
    }
    return Promise.reject(error);
});

export default api;
