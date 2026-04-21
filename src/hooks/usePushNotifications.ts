import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { navigateWhenReady } from "../navigation/NavigationRef";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const handleNotificationNavigation = (data: {
      type?: string;
      placeId?: string;
      groupId?: string;
    }) => {
      if (!data?.type) return;

      const placeTypes = new Set([
        "place_created",
        "place_added_to_wishlist",
        "place_photo_added",
        "place_review_added",
        "place_marked_visited",
        "wish_day_invite",
        "wish_day_updated",
        "wish_day_cancelled",
        "wish_day_rsvp_response",
        "wish_day_reminder",
      ]);

      const groupTypes = new Set([
        "group_member_added",
        "group_invitation_sent",
        "group_invite",
        "group_invite_accepted",
        "group_invite_rejected",
        "group_member_left",
        "ownership_transferred",
      ]);

      if (placeTypes.has(data.type) && data.placeId) {
        navigateWhenReady("PlaceDetail", { placeId: data.placeId });
        return;
      }

      if (groupTypes.has(data.type) && data.groupId) {
        navigateWhenReady("GroupMembers", { groupId: data.groupId });
      }
    };

    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return;

      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((incomingNotification) => {
        setNotification(incomingNotification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          type?: string;
          placeId?: string;
          groupId?: string;
        };

        console.log("Notification clicked:", data);
        handleNotificationNavigation(data);
      });

    // App kapalıyken bildirime basılıp açıldıysa initial response'i de yakala.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const data = response.notification.request.content.data as {
        type?: string;
        placeId?: string;
        groupId?: string;
      };
      console.log("Initial notification response:", data);
      handleNotificationNavigation(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2F7E8D",
    });
  }

  if (!Device.isDevice) {
    console.log("Push notification için fiziksel cihaz gerekli.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Bildirim izni alınamadı.");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log("EAS projectId bulunamadı.");
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Expo Push Token:", token);
    return token;
  } catch (error) {
    console.log("Push token alınamadı:", error);
    return null;
  }
}