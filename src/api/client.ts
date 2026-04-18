import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/storage";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    isRefreshing = false;
    failedQueue = [];
};

api.interceptors.request.use(async (config) => {
    const token = await storage.getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 error ve retry etmedik ise
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await storage.getRefreshToken();
                
                if (!refreshToken) {
                    // Refresh token yok, logout yap
                    console.log("DEBUG: Refresh token not found in storage, clearing auth data");
                    await storage.clearAllAuthData();
                    delete api.defaults.headers.common["Authorization"];
                    processQueue(new Error("Refresh token not found"), null);
                    return Promise.reject(new Error("Refresh token not found - User must re-authenticate"));
                }

                // Refresh token ile yeni access token al
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Yeni token'ları storage'a kaydet
                await storage.setToken(accessToken);
                await storage.setRefreshToken(newRefreshToken);

                // Header'ı güncelle
                api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Queue'daki request'leri process et
                processQueue(null, accessToken);

                // Original request'i retry et
                return api(originalRequest);
            } catch (err) {
                // Refresh başarısız, logout yap
                await storage.clearAllAuthData();
                delete api.defaults.headers.common["Authorization"];

                processQueue(err, null);
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);