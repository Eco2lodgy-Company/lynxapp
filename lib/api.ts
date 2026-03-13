import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Production VPS — deployed at https://alphatek.fr/lynx
// To run locally, change to: http://192.168.1.13:3000/lynx/api
export const API_BASE_URL = "https://alphatek.fr/lynx/api";

// Asset base URL (for uploaded photos/files)
export const ASSET_BASE_URL = "https://alphatek.fr";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
