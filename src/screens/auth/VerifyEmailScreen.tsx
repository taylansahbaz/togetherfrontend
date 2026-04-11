import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    Text,
    TextInput,
    View,
} from "react-native";

import { verifyEmail } from "@/src/api/auth";
import CustomAlert from "../../components/common/CustomAlert";
import { useAuth } from "../../hooks/useAuth";

type AlertType = "info" | "success" | "danger";

type AlertState = {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    confirmText: string;
    cancelText: string;
    showCancelButton: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
};

export default function VerifyEmailScreen({ navigation, route }: any) {
    const email = route.params?.email || "";
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const { authenticateWithToken } = useAuth();

    const [alertState, setAlertState] = useState<AlertState>({
        visible: false,
        title: "",
        message: "",
        type: "info",
        confirmText: "Tamam",
        cancelText: "İptal",
        showCancelButton: false,
    });

    const hideAlert = () => {
        setAlertState((prev) => ({
            ...prev,
            visible: false,
        }));
    };

    const showAlert = ({
        title,
        message,
        type = "info",
        confirmText = "Tamam",
        cancelText = "İptal",
        showCancelButton = false,
        onConfirm,
        onCancel,
    }: {
        title: string;
        message: string;
        type?: AlertType;
        confirmText?: string;
        cancelText?: string;
        showCancelButton?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
    }) => {
        setAlertState({
            visible: true,
            title,
            message,
            type,
            confirmText,
            cancelText,
            showCancelButton,
            onConfirm,
            onCancel,
        });
    };

    const handleVerify = async () => {
        if (code.length < 6) {
            showAlert({
                title: "Hata",
                message: "Lütfen 6 haneli kodu eksiksiz girin.",
                type: "danger",
            });
            return;
        }

        try {
            setLoading(true);

            const data = await verifyEmail(email, code);
            const { accessToken } = data;

            showAlert({
                title: "Başarılı",
                message: "E-posta adresiniz doğrulandı! Hoş geldiniz.",
                type: "success",
                onConfirm: async () => {
                    if (authenticateWithToken) {
                        await authenticateWithToken(accessToken);
                    }
                },
            });
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                "Geçersiz veya süresi dolmuş kod girdiniz.";

            showAlert({
                title: "Hata",
                message: errorMessage,
                type: "danger",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../assets/images/home-bg.png")}
                resizeMode="cover"
                style={{ flex: 1 }}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(245, 249, 250, 0.95)",
                        justifyContent: "center",
                    }}
                >
                    <SafeAreaView style={{ flex: 1 }}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={{ flex: 1, padding: 24, justifyContent: "center" }}
                        >
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={{
                                    position: "absolute",
                                    top: 10,
                                    left: 24,
                                    zIndex: 10,
                                    width: 40,
                                    height: 40,
                                    backgroundColor: "white",
                                    borderRadius: 20,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 3,
                                }}
                            >
                                <Ionicons name="arrow-back" size={20} color="#102a43" />
                            </Pressable>

                            <View
                                style={{
                                    alignItems: "center",
                                    marginBottom: 32,
                                    marginTop: 40,
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: "#E8F4F6",
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginBottom: 16,
                                    }}
                                >
                                    <Ionicons
                                        name="mail-unread-outline"
                                        size={40}
                                        color="#2F7E8D"
                                    />
                                </View>

                                <Text
                                    style={{
                                        fontSize: 28,
                                        fontWeight: "800",
                                        color: "#102a43",
                                        textAlign: "center",
                                    }}
                                >
                                    Mailini Kontrol Et
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: "#64748b",
                                        textAlign: "center",
                                        marginTop: 8,
                                        lineHeight: 22,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: "700",
                                            color: "#102a43",
                                        }}
                                    >
                                        {email}
                                    </Text>{" "}
                                    adresine gönderdiğimiz 6 haneli kodu gir.
                                </Text>
                            </View>

                            <View
                                style={{
                                    backgroundColor: "#ffffff",
                                    padding: 24,
                                    borderRadius: 24,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 3,
                                }}
                            >
                                <TextInput
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    placeholder="• • • • • •"
                                    placeholderTextColor="#cbd5e1"
                                    style={{
                                        backgroundColor: "#f8fafc",
                                        borderWidth: 1,
                                        borderColor: "#e2e8f0",
                                        borderRadius: 16,
                                        fontSize: 32,
                                        letterSpacing: 12,
                                        fontWeight: "700",
                                        color: "#102a43",
                                        textAlign: "center",
                                        paddingVertical: 16,
                                        marginBottom: 20,
                                    }}
                                />

                                <Pressable
                                    onPress={handleVerify}
                                    disabled={loading || code.length < 6}
                                    style={{
                                        backgroundColor:
                                            code.length === 6 ? "#2F7E8D" : "#94a3b8",
                                        borderRadius: 16,
                                        paddingVertical: 18,
                                        alignItems: "center",
                                        shadowColor: "#2F7E8D",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: code.length === 6 ? 0.3 : 0,
                                        shadowRadius: 8,
                                        elevation: 4,
                                    }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text
                                            style={{
                                                color: "white",
                                                fontSize: 16,
                                                fontWeight: "800",
                                            }}
                                        >
                                            Doğrula ve Başla
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </View>
            </ImageBackground>

            <CustomAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                confirmText={alertState.confirmText}
                cancelText={alertState.cancelText}
                showCancelButton={alertState.showCancelButton}
                onConfirm={() => {
                    const callback = alertState.onConfirm;
                    hideAlert();
                    callback?.();
                }}
                onCancel={() => {
                    const callback = alertState.onCancel;
                    hideAlert();
                    callback?.();
                }}
            />
        </View>
    );
}