import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    SafeAreaView, ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { changePassword, deleteAccount, getMe, updateProfile } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import { storage } from "../../utils/storage";

export default function AccountSettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const { updateUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingProfile(true);
                const user = await getMe();
                setName(user?.name || "");
                setEmail(user?.email || "");
            } catch (error) {
                console.log("Kullanıcı bilgileri yüklenemedi", error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchUserData();
    }, []);

  const handleUpdateProfile = async () => {
        if (!name.trim() || !email.trim()) {
            Alert.alert("Uyarı", "İsim ve E-posta alanları boş bırakılamaz.");
            return;
        }

        try {
            setSavingProfile(true);
            
            // 1. Veritabanını güncelle
            await updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
            
            // 2. YENİ: Token yenilemeye veya API beklemeye gerek kalmadan anında UI'ı güncelle!
            updateUser({ name: name.trim(), email: email.trim().toLowerCase() });
            
            Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
        } catch (error: any) {
            Alert.alert("Hata", error?.response?.data?.message || "Profil güncellenemedi.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert("Uyarı", "Lütfen mevcut ve yeni şifrenizi girin.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Uyarı", "Yeni şifreniz en az 6 karakter olmalıdır.");
            return;
        }

        try {
            setSavingPassword(true);
            await changePassword({ currentPassword, newPassword });
            Alert.alert("Başarılı", "Şifreniz başarıyla değiştirildi.");
            setCurrentPassword("");
            setNewPassword("");
        } catch (error: any) {
            Alert.alert("Hata", error?.response?.data?.message || "Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Hesabı Sil",
            "Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Evet, Hesabımı Sil",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            await deleteAccount();
                            if (storage.removeToken) await storage.removeToken();
                            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                        } catch (error: any) {
                            Alert.alert("Hata", error?.response?.data?.message || "Hesap silinemedi.");
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* DÜZELTİLDİ: Absolute yerine normal akışta duran Header */}
            <View style={styles.navyHeader}>
                <SafeAreaView>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Account Settings</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Profile Information</Text>
                        
                        {loadingProfile ? (
                            <ActivityIndicator size="small" color="#2F7E8D" style={{ marginVertical: 20 }} />
                        ) : (
                            <View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="Enter your name"
                                            placeholderTextColor="#cbd5e1"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="Enter your email"
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
                                    {savingProfile ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Save Profile</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Current Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                    placeholderTextColor="#cbd5e1"
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
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
                            {savingPassword ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Update Password</Text>}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, styles.dangerCard]}>
                        <View style={styles.dangerHeader}>
                            <Ionicons name="warning" size={24} color="#ef4444" />
                            <Text style={styles.dangerTitle}>Danger Zone</Text>
                        </View>
                        <Text style={styles.dangerDesc}>
                            Once you delete your account, there is no going back. Please be certain.
                        </Text>
                        
                        <TouchableOpacity 
                            style={styles.dangerButton} 
                            onPress={handleDeleteAccount}
                            disabled={deleting}
                        >
                            {deleting ? <ActivityIndicator color="#ef4444" /> : <Text style={styles.dangerButtonText}>Delete Account</Text>}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    
    // DÜZELTİLDİ: Absolute özelliği silindi, padding ayarlandı
    navyHeader: {
        backgroundColor: "#102a43", 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        paddingBottom: 24, // Başlığın altındaki boşluk
    },
    headerRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between", 
        paddingHorizontal: 20, 
        marginTop: Platform.OS === "android" ? 40 : 10 
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
    headerTitle: { color: "white", fontSize: 20, fontWeight: "800" },

    // DÜZELTİLDİ: Yüksek paddingTop silindi
    scrollContent: { padding: 20, paddingTop: 24, paddingBottom: 40 },

    card: {
        backgroundColor: "white", borderRadius: 24, padding: 24, marginBottom: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4,
    },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 20 },

    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: "700", color: "#64748b", marginBottom: 8, marginLeft: 4 },
    inputContainer: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9",
        borderRadius: 16, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: "transparent"
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "500" },

    primaryButton: {
        backgroundColor: "#2F7E8D", borderRadius: 16, height: 52, justifyContent: "center", alignItems: "center", marginTop: 8,
        shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
    },
    primaryButtonText: { color: "white", fontSize: 15, fontWeight: "700" },

    dangerCard: { borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff5f5" },
    dangerHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    dangerTitle: { fontSize: 18, fontWeight: "800", color: "#ef4444", marginLeft: 8 },
    dangerDesc: { fontSize: 14, color: "#991b1b", marginBottom: 20, lineHeight: 20 },
    dangerButton: {
        backgroundColor: "white", borderWidth: 1, borderColor: "#ef4444", borderRadius: 16, height: 52,
        justifyContent: "center", alignItems: "center"
    },
    dangerButtonText: { color: "#ef4444", fontSize: 15, fontWeight: "700" }
});