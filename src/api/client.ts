import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/storage";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
});

api.interceptors.request.use(async (config) => {
    const token = await storage.getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});