import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { registerPushToken } from "../api/notification";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { usePushNotifications } from "../hooks/usePushNotifications";
import AppStackNavigator from "./AppStackNavigator";
import AuthNavigator from "./AuthNavigator";

export default function RootNavigator() {
    const { isAuthenticated, isLoading, token, user } = useAuth();
    const { expoPushToken } = usePushNotifications();

    useEffect(() => {
        console.log("RootNavigator auth state:", {
            isLoading,
            isAuthenticated,
            hasToken: !!token,
            hasUser: !!user,
            expoPushToken,
        });
    }, [isLoading, isAuthenticated, token, user, expoPushToken]);

    useEffect(() => {
        const sendTokenToBackend = async () => {
            if (!isAuthenticated || !expoPushToken) {
                console.log("Kullanıcı doğrulanmamış veya push token mevcut değil, token gönderilmiyor.");
                return;
            }

            try {
                console.log("Token Backend'e gönderiliyor:", expoPushToken);
                await registerPushToken(expoPushToken, Platform.OS);
                console.log("Token başarıyla veritabanına kaydedildi!");
            } catch (error) {
                console.error("Token kaydedilirken hata oluştu:", error);
            }
        };

        sendTokenToBackend();
    }, [isAuthenticated, expoPushToken]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AppStackNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}