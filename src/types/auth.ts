export interface User {
    id: string;
    name: string;
    email: string;
    lastSelectedGroupId?: string | null;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    userId: string;
    name: string;
    email: string;
    lastSelectedGroupId?: string | null;
}