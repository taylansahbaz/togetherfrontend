import React, { createContext, useEffect, useMemo, useState } from "react";
import { appleLogin, getMe, googleLogin, login as loginApi, register as registerApi } from "../api/auth";
import { api } from "../api/client";
import { LoginRequest, RegisterRequest, User } from "../types/auth";
import { storage } from "../utils/storage";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    loginWithApple: (payload: { idToken: string; fullName?: string | null }) => Promise<void>;
    logout: () => Promise<void>;
    bootstrap: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void; 
    // YENİ: E-posta doğrulamasından sonra gelen Token ile direkt içeri girmek için
    authenticateWithToken: (newToken: string) => Promise<void>; 
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

        api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        setToken(savedToken);

        const me = await getMe();
        setUser(me);
    } catch (error) {
        console.log("Bootstrap auth hatası:", error);
        await storage.removeToken();
        delete api.defaults.headers.common["Authorization"];
        setToken(null);
        setUser(null);
    } finally {
        setIsLoading(false);
    }
};

const authenticateWithToken = async (newToken: string) => {
    await storage.setToken(newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);

    try {
        const me = await getMe();
        setUser(me);
        console.log("authenticateWithToken başarılı, user set edildi:", me);
    } catch (error) {
        console.log("Kullanıcı bilgileri çekilemedi:", error);
        await storage.removeToken();
        delete api.defaults.headers.common["Authorization"];
        setToken(null);
        setUser(null);
    }
};

    const login = async (payload: LoginRequest) => {
        const result = await loginApi(payload);
        console.log("login result:", result);

        await storage.setToken(result.token);
        await storage.setRefreshToken(result.refreshToken);
        const storedToken = await storage.getToken();
        console.log("stored token after login:", storedToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
        setToken(result.token);
        setUser(result.user);
    };

    // 🛠️ DÜZELTİLEN YER: Artık sadece API'ye kayıt isteği atıyor, Token beklemiyor!
    const register = async (payload: RegisterRequest) => {
        await registerApi(payload);
    };
    const loginWithGoogle = async (idToken: string) => {
        const result = await googleLogin(idToken);
        await storage.setToken(result.token);
        await storage.setRefreshToken(result.refreshToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
        
        setUser(result.user);
        setToken(result.token);
    };

    const loginWithApple = async (payload: { idToken: string; fullName?: string | null; authorizationCode?: string }) => {
        const result = await appleLogin(payload);
        await storage.setToken(result.token);
        await storage.setRefreshToken(result.refreshToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
        setUser(result.user);
        setToken(result.token);
    };

    const logout = async () => {
        await storage.removeToken();
        await storage.removeRefreshToken();
        await storage.removeSelectedGroupId();
            delete api.defaults.headers.common["Authorization"];
        setToken(null);
        setUser(null);
    };

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
            loginWithGoogle,
            loginWithApple,
            logout,
            bootstrap,
            updateUser, 
            authenticateWithToken, // Dışarıya açtık
        }),
        [user, token, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}