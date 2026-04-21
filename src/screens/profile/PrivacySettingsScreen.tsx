import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { deleteAccount, exportMyData } from "../../api/auth";
import CustomAlert from "../../components/common/CustomAlert";
import { useAuth } from "../../hooks/useAuth";
import { SUPPORT_EMAIL } from "../../utils/constants";
import { getApiErrorMessage } from "../../utils/helpers";

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

const initialAlertState: AlertState = {
    visible: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "Tamam",
    cancelText: "İptal",
    showCancelButton: false,
};

export default function PrivacySettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout } = useAuth();

    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [alertState, setAlertState] = useState<AlertState>(initialAlertState);

    const hideAlert = () => setAlertState((prev) => ({ ...prev, visible: false }));

    const showAlert = (next: Omit<AlertState, "visible">) => {
        setAlertState({ ...next, visible: true });
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const data = await exportMyData();
            const jsonString = JSON.stringify(data, null, 2);

            await Share.share({
                title: "Lets Together - Verilerim",
                message: jsonString,
            });
        } catch (err) {
            showAlert({
                title: "Hata",
                message: getApiErrorMessage(err),
                type: "danger",
                confirmText: "Tamam",
                cancelText: "İptal",
                showCancelButton: false,
            });
        } finally {
            setExporting(false);
        }
    };

    const performDelete = async () => {
        try {
            setDeleting(true);
            await deleteAccount();

            showAlert({
                title: "Hesap Silindi",
                message:
                    "Hesabınız ve tüm verileriniz başarıyla silindi. Bizi tercih ettiğiniz için teşekkür ederiz.",
                type: "success",
                confirmText: "Tamam",
                cancelText: "İptal",
                showCancelButton: false,
                onConfirm: async () => {
                    await logout();
                },
            });
        } catch (err) {
            showAlert({
                title: "Hata",
                message: getApiErrorMessage(err),
                type: "danger",
                confirmText: "Tamam",
                cancelText: "İptal",
                showCancelButton: false,
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleDeletePress = () => {
        showAlert({
            title: "Hesabını Silmek İstiyor Musun?",
            message:
                "Bu işlem geri alınamaz. Tüm mekanlarınız, planlarınız, yorumlarınız, fotoğraflarınız ve grup üyelikleriniz kalıcı olarak silinecektir.",
            type: "danger",
            confirmText: "Devam Et",
            cancelText: "Vazgeç",
            showCancelButton: true,
            onConfirm: () => {
                showAlert({
                    title: "Son Onay",
                    message:
                        "Emin misiniz? Bu adımdan sonra hesabınız ve verileriniz kalıcı olarak silinir ve geri getirilemez.",
                    type: "danger",
                    confirmText: "Evet, Hesabımı Sil",
                    cancelText: "Vazgeç",
                    showCancelButton: true,
                    onConfirm: performDelete,
                });
            },
        });
    };

    const handleSupportPress = async () => {
        try {
            const subject = encodeURIComponent("Lets Together Destek Talebi");
            const body = encodeURIComponent(
                "Merhaba,\n\nSorunumu aşağıda paylaşıyorum:\n\n- "
            );
            const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
            const canOpen = await Linking.canOpenURL(mailtoUrl);

            if (!canOpen) {
                showAlert({
                    title: "Hata",
                    message: "Bu cihazda e-posta uygulaması açılamadı.",
                    type: "danger",
                    confirmText: "Tamam",
                    cancelText: "İptal",
                    showCancelButton: false,
                });
                return;
            }

            await Linking.openURL(mailtoUrl);
        } catch {
            showAlert({
                title: "Hata",
                message: "Destek e-postası başlatılırken bir sorun oluştu.",
                type: "danger",
                confirmText: "Tamam",
                cancelText: "İptal",
                showCancelButton: false,
            });
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
                        <Text style={styles.headerTitle}>Gizlilik ve Güvenlik</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Yasal bilgilendirme */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Yasal Bilgiler</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate("PrivacyPolicy")}
                    >
                        <View
                            style={[
                                styles.menuIconBox,
                                { backgroundColor: "#dbeafe" },
                            ]}
                        >
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={20}
                                color="#2563eb"
                            />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Gizlilik Politikası</Text>
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
                        onPress={() => navigation.navigate("TermsOfService")}
                    >
                        <View
                            style={[
                                styles.menuIconBox,
                                { backgroundColor: "#ede9fe" },
                            ]}
                        >
                            <Ionicons
                                name="document-text-outline"
                                size={20}
                                color="#7c3aed"
                            />
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Kullanım Şartları</Text>
                           
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleSupportPress}>
                        <View
                            style={[
                                styles.menuIconBox,
                                { backgroundColor: "#e0f2fe" },
                            ]}
                        >
                            <Ionicons name="help-buoy-outline" size={20} color="#0284c7" />
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
                </View>

                {/* Veri yönetimi */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Verileriniz</Text>
                    <Text style={styles.sectionDescription}>
                        KVKK kapsamında verilerinize istediğiniz zaman ulaşabilir,
                        indirebilir ve silebilirsiniz.
                    </Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleExport}
                        disabled={exporting}
                    >
                        <View
                            style={[
                                styles.menuIconBox,
                                { backgroundColor: "#d1fae5" },
                            ]}
                        >
                            {exporting ? (
                                <ActivityIndicator size="small" color="#059669" />
                            ) : (
                                <Ionicons
                                    name="download-outline"
                                    size={20}
                                    color="#059669"
                                />
                            )}
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>Verilerimi İndir</Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>

                </View>

                {/* Tehlikeli bölge */}
                <View style={[styles.card, styles.dangerCard]}>
                    <Text style={[styles.sectionTitle, { color: "#b91c1c" }]}>
                        Tehlikeli Bölge
                    </Text>
                    <Text style={styles.sectionDescription}>
                        Sildiğinizde tüm verileriniz kalıcı olarak
                        kaldırılır.
                    </Text>

                    <TouchableOpacity
                        style={[styles.dangerButton, deleting && { opacity: 0.6 }]}
                        onPress={handleDeletePress}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color="white"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.dangerButtonText}>
                                    Hesabımı Sil
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
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
        paddingBottom: 40,
    },

    card: {
        backgroundColor: "white",
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 6,
    },
    sectionDescription: {
        fontSize: 13,
        lineHeight: 18,
        color: "#64748b",
        marginBottom: 8,
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
    menuSubtitle: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 2,
        lineHeight: 16,
    },
    menuDivider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginLeft: 54,
    },

    dangerCard: {
        borderWidth: 1,
        borderColor: "#fecaca",
    },
    dangerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ef4444",
        borderRadius: 16,
        height: 52,
        marginTop: 12,
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    dangerButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
    },
});
