import { api } from "./client";

export interface RegisterPushTokenRequest {
    token: string;
    platform: string;
}

// C# tarafındaki [HttpPost] api/notifications endpoint'ine token'ı gönderir
export const registerPushToken = async (token: string, platform: string) => {
    const response = await api.post("/notifications", {
        token,
        platform
    });
    return response.data;
};

// Kullanıcı çıkış yaptığında token'ı silmek için (İleride kullanacağız)
export const removePushToken = async (token: string) => {
        const response = await api.delete(`/notifications?token=${token}`);
    return response.data;
};