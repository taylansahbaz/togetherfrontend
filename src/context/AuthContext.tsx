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

    // 🛠️ DÜZELTİLEN YER: Artık sadece API'ye kayıt isteği atıyor, Token beklemiyor!
    const register = async (payload: RegisterRequest) => {
        await registerApi(payload);
    };

    // 🚀 YENİ EKLENEN YER: VerifyEmail ekranı kodu doğrulayınca bunu çağıracak
    const authenticateWithToken = async (newToken: string) => {
        await storage.setToken(newToken);
        setToken(newToken);
        
        // Token'ı kaydettik, şimdi bu token ile backend'den güncel kullanıcı bilgilerini çekelim
        try {
            const me = await getMe();
            setUser(me);
        } catch (error) {
            console.log("Kullanıcı bilgileri çekilemedi:", error);
        }
    };

    const logout = async () => {
        await storage.removeToken();
        await storage.removeSelectedGroupId();
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
            logout,
            bootstrap,
            updateUser, 
            authenticateWithToken, // Dışarıya açtık
        }),
        [user, token, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}