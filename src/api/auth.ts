import { AuthResponse, LoginRequest, RegisterRequest, User } from "../types/auth";
import { api } from "./client";

function mapAuthUser(data: AuthResponse): User {
    return {
        id: data.userId,
        name: data.name,
        email: data.email,
    };
}

export async function login(payload: LoginRequest): Promise<{ token: string; user: User }> {
    const response = await api.post("/auth/login", payload);
    const data: AuthResponse = response.data.data ?? response.data;

    return {
        token: data.accessToken,
        user: mapAuthUser(data),
    };
}

export async function register(payload: RegisterRequest): Promise<{ token: string; user: User }> {
    const response = await api.post("/auth/register", payload);
    const data: AuthResponse = response.data.data ?? response.data;

    return {
        token: data.accessToken,
        user: mapAuthUser(data),
    };
}

export async function getMe(): Promise<User> {
    const response = await api.get("/auth/me");
    const data = response.data.data ?? response.data;

    return {
        id: data.userId ?? data.id,
        name: data.name,
        email: data.email,
    };
}

export async function updateProfile(payload: { name: string; email: string }): Promise<void> {
    await api.put("/auth/update-profile", payload);
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put("/auth/change-password", payload);
}

export async function deleteAccount(): Promise<void> {
    await api.delete("/auth/delete-account");
}