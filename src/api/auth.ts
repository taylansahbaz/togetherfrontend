import { AuthResponse, LoginRequest, RegisterRequest, User } from "../types/auth";
import { api } from "./client";

function mapAuthUser(data: AuthResponse): User {
  return {
    id: data.userId,
    name: data.name,
    email: data.email,
    lastSelectedGroupId: data.lastSelectedGroupId || null,
  };
}

export async function login(payload: LoginRequest): Promise<{ token: string; refreshToken: string; user: User }> {
  const response = await api.post("/auth/login", payload);
  const data: AuthResponse = response.data.data ?? response.data;

  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
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

export async function googleLogin(idToken: string): Promise<{ token: string; refreshToken: string; user: User }> {
  const response = await api.post("/auth/google-login", { idToken });
  const data: AuthResponse = response.data.data ?? response.data;

  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    user: mapAuthUser(data),
  };
}

export async function appleLogin(payload: {
  idToken: string;
  fullName?: string | null;
  authorizationCode?: string;
}): Promise<{ token: string; refreshToken: string; user: User }> {
  console.log("Sending Apple login payload to backend:", {
    hasIdToken: !!payload.idToken,
    hasAuthCode: !!payload.authorizationCode,
    fullName: payload.fullName,
  });
  const response = await api.post("/auth/apple-login", payload);
  const data: AuthResponse = response.data.data ?? response.data;

  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
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

export async function exportMyData(): Promise<any> {
  const response = await api.get("/auth/export-data");
  return response.data?.data ?? response.data;
}

export const verifyEmail = async (email: string, code: string) => {
  const response = await api.post("/auth/verify-email", { email, code });
  return response.data;
};

export const resendVerification = async (email: string) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  const response = await api.post("/auth/reset-password", {
    email,
    code,
    newPassword,
  });

  return response.data;
}
export const refreshAccessToken = async (refreshToken: string): Promise<{ token: string; refreshToken: string; user: User }> => {
  const response = await api.post("/auth/refresh", { refreshToken });
  const data: AuthResponse = response.data.data ?? response.data;

  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    user: mapAuthUser(data),
  };
};