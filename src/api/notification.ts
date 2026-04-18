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

export const getMyNotifications = async () => {
  const response = await api.get("/notifications/my");
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const acceptNotificationInvite = async (notificationId: string) => {
  const response = await api.post(`/notifications/${notificationId}/accept`);
  return response.data;
};

export const rejectNotificationInvite = async (notificationId: string) => {
  const response = await api.post(`/notifications/${notificationId}/reject`);
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};