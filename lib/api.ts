import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Use the local IP address for development, as localhost won't work from an emulator/physical device
// In production, this would be your VPS URL
export const API_BASE_URL = "http://192.168.1.13:3000/lynx/api"; 

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
