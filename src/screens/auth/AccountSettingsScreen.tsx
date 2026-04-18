import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import {
    changePassword,
    getMe,
    updateProfile
} from "../../api/auth";
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

export default function AccountSettingsScreen() {
    const navigation = useNavigation<any>();
    const { updateUser } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

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

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingProfile(true);
                const user = await getMe();
                setName(user?.name || "");
                setEmail(user?.email || "");
            } catch (error) {
                console.log("Kullanıcı verileri yüklenemedi", error);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchUserData();
    }, []);

    const handleUpdateProfile = async () => {
        if (!name.trim() || !email.trim()) {
            showAlert({
                title: "Uyarı",
                message: "İsim ve E-posta alanları boş bırakılamaz.",
                type: "info",
            });
            return;
        }

        try {
            setSavingProfile(true);

            const normalizedName = name.trim();
            const normalizedEmail = email.trim().toLowerCase();

            await updateProfile({
                name: normalizedName,
                email: normalizedEmail,
            });

            updateUser({
                name: normalizedName,
                email: normalizedEmail,
            });

            showAlert({
                title: "Başarılı",
                message: "Profil bilgileriniz güncellendi.",
                type: "success",
            });
        } catch (error: any) {
            showAlert({
                title: "Hata",
                message: error?.response?.data?.message || "Profil güncellenemedi.",
                type: "danger",
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            showAlert({
                title: "Uyarı",
                message: "Lütfen mevcut ve yeni şifrenizi girin.",
                type: "info",
            });
            return;
        }

        if (newPassword.length < 6) {
            showAlert({
                title: "Uyarı",
                message: "Yeni şifreniz en az 6 karakter olmalıdır.",
                type: "info",
            });
            return;
        }

        try {
            setSavingPassword(true);

            await changePassword({ currentPassword, newPassword });

            setCurrentPassword("");
            setNewPassword("");

            showAlert({
                title: "Başarılı",
                message: "Şifreniz başarıyla değiştirildi.",
                type: "success",
            });
        } catch (error: any) {
            showAlert({
                title: "Hata",
                message:
                    error?.response?.data?.message ||
                    "Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.",
                type: "danger",
            });
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.navyHeader}>
                <SafeAreaView>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Hesap Ayarları</Text>

                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Profil Bilgileri</Text>

                        {loadingProfile ? (
                            <ActivityIndicator
                                size="small"
                                color="#2F7E8D"
                                style={{ marginVertical: 20 }}
                            />
                        ) : (
                            <View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Ad Soyad</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons
                                            name="person-outline"
                                            size={20}
                                            color="#94a3b8"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="Adınızı girin"
                                            placeholderTextColor="#cbd5e1"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>E-posta Adresi</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons
                                            name="mail-outline"
                                            size={20}
                                            color="#94a3b8"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="E-posta adresinizi girin"
                                            placeholderTextColor="#cbd5e1"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleUpdateProfile}
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>
                                            Profili Kaydet
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Şifre Değiştir</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mevcut Şifre</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#94a3b8"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Mevcut şifrenizi girin"
                                    placeholderTextColor="#cbd5e1"
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Yeni Şifre</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="key-outline"
                                    size={20}
                                    color="#94a3b8"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Yeni şifrenizi girin"
                                    placeholderTextColor="#cbd5e1"
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: "#0f172a" }]}
                            onPress={handleChangePassword}
                            disabled={savingPassword}
                        >
                            {savingPassword ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    Şifreyi Güncelle
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },

    navyHeader: {
        backgroundColor: "#102a43",
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingBottom: 24,
    },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginTop: Platform.OS === "android" ? 40 : 10,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },

    headerTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "800",
    },

    scrollContent: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 20,
    },

    inputGroup: {
        marginBottom: 16,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 8,
        marginLeft: 4,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: "transparent",
    },

    inputIcon: {
        marginRight: 12,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: "#0f172a",
        fontWeight: "500",
    },

    primaryButton: {
        backgroundColor: "#2F7E8D",
        borderRadius: 16,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        shadowColor: "#2F7E8D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    primaryButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
    },
});