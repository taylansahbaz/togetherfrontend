import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { api } from "../../api/client";
import CustomAlert from "../../components/common/CustomAlert";
import { useAuth } from "../../hooks/useAuth";
import { storage } from "../../utils/storage";

type AlertType = "info" | "success" | "danger";

type AlertState = {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    confirmText: string;
    cancelText: string;
    showCancelButton: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
};

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();

    const [stats, setStats] = useState({
        visited: 0,
        wishlist: 0,
        photos: 0,
        reviews: 0,
    });

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
        onConfirm?: () => void | Promise<void>;
        onCancel?: () => void | Promise<void>;
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

    useFocusEffect(
        useCallback(() => {
            const fetchStats = async () => {
                try {
                    const response = await api.get("/auth/my-stats");
                    if (response.data?.data) {
                        setStats(response.data.data);
                    }
                } catch (error) {
                }
            };

            fetchStats();
        }, [])
    );

    const handleLogoutConfirmed = async () => {
        if (logout) {
            await logout();
        } else {
            if (storage.removeToken) {
                await storage.removeToken();
            }
        }
    };

    const handleLogout = () => {
        showAlert({
            title: "Çıkış Yap",
            message: "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
            type: "danger",
            confirmText: "Çıkış Yap",
            cancelText: "İptal",
            showCancelButton: true,
            onConfirm: handleLogoutConfirmed,
        });
    };

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    return (
        <View style={styles.container}>
            <View style={styles.navyHeader}>
                <SafeAreaView>
                    <Text style={styles.headerTitle}>Profil</Text>
                </SafeAreaView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>

                    <Text style={styles.userName}>
                        {user?.name || "Kullanıcı Adı"}
                    </Text>
                    <Text style={styles.userEmail}>
                        {user?.email || "email@example.com"}
                    </Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: "#2F7E8D" }]}>
                                {stats.visited}
                            </Text>
                            <Text style={styles.statLabel}>Gezilenler</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: "#fcbebe" }]}>
                                {stats.wishlist}
                            </Text>
                            <Text style={styles.statLabel}>Planlar</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: "#0284c7" }]}>
                                {stats.photos}
                            </Text>
                            <Text style={styles.statLabel}>Fotoğraflar</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: "#8b5cf6" }]}>
                                {stats.reviews}
                            </Text>
                            <Text style={styles.statLabel}>Yorumlar</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate("Groups")}
                    >
                        <View
                            style={[styles.menuIconBox, { backgroundColor: "#e2e8f0" }]}
                        >
                            <Ionicons name="people" size={20} color="#334155" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Gruplarım ve Partnerlerim</Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate("AccountSettings")}
                    >
                        <View
                            style={[styles.menuIconBox, { backgroundColor: "#e2e8f0" }]}
                        >
                            <Ionicons name="settings" size={20} color="#334155" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Hesap Ayarları</Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity 
                        onPress={() => navigation.navigate("Notifications")}
                        style={styles.menuItem}>
                        <View
                            style={[styles.menuIconBox, { backgroundColor: "#e2e8f0" }]}
                        >
                            <Ionicons
                                name="notifications"
                                size={20}
                                color="#334155"
                            />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Bildirimler</Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View
                            style={[styles.menuIconBox, { backgroundColor: "#e2e8f0" }]}
                        >
                            <Ionicons name="help-buoy" size={20} color="#334155" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Yardım ve Destek</Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>
                    
                    <View style={styles.menuDivider} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View
                            style={[styles.menuIconBox, { backgroundColor: "#fef2f2" }]}
                        >
                            <Ionicons name="log-out" size={20} color="#ef4444" />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={[styles.menuTitle, { color: "#ef4444" }]}>
                                Çıkış Yap
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>Lets Together App v1.0.0</Text>
            </ScrollView>

            <CustomAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                confirmText={alertState.confirmText}
                cancelText={alertState.cancelText}
                showCancelButton={alertState.showCancelButton}
                onConfirm={async () => {
                    const callback = alertState.onConfirm;
                    hideAlert();
                    await callback?.();
                }}
                onCancel={async () => {
                    const callback = alertState.onCancel;
                    hideAlert();
                    await callback?.();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },

    navyHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 240,
        backgroundColor: "#102a43",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingTop: Platform.OS === "android" ? 40 : 0,
    },
    headerTitle: {
        color: "white",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
        marginTop: 20,
    },

    scrollContent: { padding: 20, paddingBottom: 40 },

    profileCard: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        marginTop: 60,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "#2F7E8D",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -50,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: "white",
    },
    avatarText: { fontSize: 32, fontWeight: "bold", color: "white" },
    userName: {
        fontSize: 22,
        fontWeight: "900",
        color: "#0f172a",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 24,
    },

    statsContainer: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    statItem: { flex: 1, alignItems: "center" },
    statNumber: { fontSize: 20, fontWeight: "900", marginBottom: 0 },
    statLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8" },
    statDivider: { width: 3, height: 26, backgroundColor: "#f1f5f9" },

    menuCard: {
        backgroundColor: "white",
        borderRadius: 24,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
    menuSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 76 },

    versionText: {
        textAlign: "center",
        marginTop: 24,
        fontSize: 12,
        fontWeight: "600",
        color: "#cbd5e1",
    },
});