import React, { createContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginApi, register as registerApi } from "../api/auth";
import { LoginRequest, RegisterRequest, User } from "../types/auth";
import { storage } from "../utils/storage";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    bootstrap: () => Promise<void>;
    // YENİ: Uygulama içi anlık güncelleme fonksiyonu
    updateUser: (userData: Partial<User>) => void; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const bootstrap = async () => {
        try {
            setIsLoading(true);
            const savedToken = await storage.getToken();

            if (!savedToken) {
                setToken(null);
                setUser(null);
                return;
            }

            setToken(savedToken);
            const me = await getMe();
            setUser(me);
        } catch {
            await storage.removeToken();
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (payload: LoginRequest) => {
        const result = await loginApi(payload);
        await storage.setToken(result.token);
        setToken(result.token);
        setUser(result.user);
    };

    const register = async (payload: RegisterRequest) => {
        const result = await registerApi(payload);
        await storage.setToken(result.token);
        setToken(result.token);
        setUser(result.user);
    };

    const logout = async () => {
        await storage.removeToken();
        await storage.removeSelectedGroupId();
        setToken(null);
        setUser(null);
    };

    // YENİ: Sadece arayüzdeki (State) kullanıcı bilgilerini ezerek günceller
    const updateUser = (userData: Partial<User>) => {
        setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : null));
    };

    useEffect(() => {
        bootstrap();
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: !!token && !!user,
            isLoading,
            login,
            register,
            logout,
            bootstrap,
            updateUser, 
        }),
        [user, token, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}