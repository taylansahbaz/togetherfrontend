import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator, Alert,
    FlatList,
    KeyboardAvoidingView, Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// transferOwnership API'sini import listemize ekledik
import { addGroupMember, getGroupMembers, removeGroupMember, transferOwnership } from "../../api/groups";

export default function GroupMembersScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { groupId, groupName } = route.params;

    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [emailInput, setEmailInput] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await getGroupMembers(groupId);
            setMembers(data);
        } catch (error) {
            console.log("Fetch members error:", error);
            Alert.alert("Hata", "Üyeler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMembers();
        }, [groupId])
    );

    const handleAddMember = async () => {
        if (!emailInput.trim()) {
            Alert.alert("Uyarı", "Lütfen bir e-posta adresi girin.");
            return;
        }

        try {
            setIsAdding(true);
            await addGroupMember(groupId, emailInput.trim());
            setEmailInput(""); // Inputu temizle
            Alert.alert("Başarılı", "Üye gruba eklendi.");
            loadMembers(); // Listeyi yenile
        } catch (error) {
            console.log("Add member error:", error);
            Alert.alert("Hata", "Üye eklenemedi. E-posta adresini kontrol edin.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveMember = (memberUserId: string, memberName: string) => {
        Alert.alert(
            "Üyeyi Çıkar",
            `"${memberName}" adlı kullanıcıyı gruptan çıkarmak istediğinize emin misiniz?`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Çıkar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await removeGroupMember(groupId, memberUserId);
                            loadMembers(); // Listeyi yenile
                        } catch (error) {
                            Alert.alert("Hata", "Üye gruptan çıkarılamadı.");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // --- YENİ: YETKİ DEVRİ (ADMIN YAPMA) İŞLEMİ ---
    const handleTransferOwnership = (memberUserId: string, memberName: string) => {
        Alert.alert(
            "Yöneticiliği Devret",
            `Bu grubun tüm yönetim yetkisini "${memberName}" adlı kullanıcıya devretmek istediğinize emin misiniz?\n\nBu işlemi onaylarsanız artık bu grubu silemez veya üye çıkaramazsınız.`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Devret",
                    style: "default",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await transferOwnership(groupId, memberUserId);
                            Alert.alert("Başarılı", `Grup yöneticiliği ${memberName} kullanıcısına devredildi.`);
                            
                            // Yetkiyi devrettikten sonra genellikle ana ekrana atılır veya liste güncellenir
                            navigation.goBack(); 
                        } catch (error) {
                            Alert.alert("Hata", "Yöneticilik devredilemedi.");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderMember = ({ item }: { item: any }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                    {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                </Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name || "İsimsiz Kullanıcı"}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
            </View>
            
            {/* SAĞ TARAF: AKSİYON BUTONLARI */}
            <View style={styles.memberActions}>
                {/* Admin Yap Butonu (Sarı/Turuncu Yıldız) */}
                <TouchableOpacity 
                    style={styles.adminButton}
                    onPress={() => handleTransferOwnership(item.userId || item.id, item.name || "Kullanıcı")}
                >
                    <Ionicons name="star" size={18} color="#d97706" />
                </TouchableOpacity>

                {/* Üyeyi Çıkar Butonu (Kırmızı) */}
                <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(item.userId || item.id, item.name || "Kullanıcı")}
                >
                    <Ionicons name="person-remove" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* ÜST BAŞLIK (Header) */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#102a43" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.headerTitle}>Üyeleri Yönet</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>{groupName}</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                
                {/* ÜYE EKLEME KISMI */}
                <View style={styles.addSection}>
                    <Text style={styles.sectionTitle}>Yeni Üye Ekle</Text>
                    <View style={styles.inputRow}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="E-posta adresi girin..."
                                placeholderTextColor="#94a3b8"
                                value={emailInput}
                                onChangeText={setEmailInput}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <TouchableOpacity 
                            style={[styles.addButton, !emailInput.trim() && { opacity: 0.6 }]} 
                            onPress={handleAddMember}
                            disabled={isAdding || !emailInput.trim()}
                        >
                            {isAdding ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={20} color="white" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* MEVCUT ÜYELER LİSTESİ */}
                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Mevcut Üyeler ({members.length})</Text>
                    
                    {loading ? (
                        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#2F7E8D" /></View>
                    ) : (
                        <FlatList
                            data={members}
                            keyExtractor={(item, index) => item.id || item.userId || index.toString()}
                            renderItem={renderMember}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                                    <Text style={styles.emptyText}>Grupta henüz başka üye yok.</Text>
                                </View>
                            }
                        />
                    )}
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    
    // HEADER
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, backgroundColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
    headerSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "500", marginTop: 2 },

    // YENİ ÜYE EKLEME
    addSection: { padding: 20, backgroundColor: "white", marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
    inputRow: { flexDirection: "row", alignItems: "center" },
    inputContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 16, paddingHorizontal: 16, height: 50, marginRight: 12 },
    input: { flex: 1, fontSize: 15, color: "#0f172a" },
    addButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#2F7E8D", justifyContent: "center", alignItems: "center", shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },

    // LİSTE
    listSection: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
    memberCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    memberAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#e0f2fe", justifyContent: "center", alignItems: "center", marginRight: 12 },
    memberAvatarText: { fontSize: 18, fontWeight: "700", color: "#0284c7" },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: "700", color: "#102a43", marginBottom: 2 },
    memberEmail: { fontSize: 13, color: "#64748b" },
    
    // AKSİYON BUTONLARI (YAN YANA)
    memberActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    adminButton: { padding: 10, backgroundColor: "#fef3c7", borderRadius: 12 },
    removeButton: { padding: 10, backgroundColor: "#fef2f2", borderRadius: 12 },

    emptyState: { alignItems: "center", marginTop: 40 },
    emptyText: { marginTop: 12, color: "#94a3b8", fontSize: 15, fontWeight: "500" }
});