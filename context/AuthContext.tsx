import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../lib/api";
import { router } from "expo-router";

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync("auth_token");
            const storedUser = await SecureStore.getItemAsync("auth_user");

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                // Optionnel: Vérifier si le token est encore valide avec une route 'me'
            }
        } catch (error) {
            console.error("Error loading stored auth:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post("/mobile/login", { email, password });
            const { token, user } = response.data;

            await SecureStore.setItemAsync("auth_token", token);
            await SecureStore.setItemAsync("auth_user", JSON.stringify(user));

            setToken(token);
            setUser(user);
            router.replace("/dashboard");
        } catch (error: any) {
            console.error("Login failed:", error);
            throw error.response?.data?.error || "Erreur de connexion";
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync("auth_token");
            await SecureStore.deleteItemAsync("auth_user");
            setToken(null);
            setUser(null);
            router.replace("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
