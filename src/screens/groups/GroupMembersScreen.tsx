import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator, Alert,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// API'den updateGroup fonksiyonunu da import listesine eklemeyi unutma
import { addGroupMember, getGroupMembers, removeGroupMember, updateGroup } from "../../api/groups";

// Renk paletimiz
const GROUP_COLORS = ["#2F7E8D", "#fcbebe", "#a78bfa", "#fbbf24", "#34d399", "#f472b6", "#38bdf8"];

export default function GroupMembersScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { groupId, groupName, currentColor } = route.params; // currentColor'ı route'dan alıyoruz

    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // GRUP DÜZENLEME STATE'LERİ
    const [editName, setEditName] = useState(groupName);
    const [colorCode, setColorCode] = useState(currentColor || GROUP_COLORS[0]);
    const [isUpdating, setIsUpdating] = useState(false);

    // ÜYE EKLEME STATE'LERİ
    const [emailInput, setEmailInput] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await getGroupMembers(groupId);
            setMembers(data);
        } catch (error) {
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

    // --- GRUP BİLGİLERİNİ GÜNCELLEME (İsim ve Renk) ---
    const handleUpdateGroup = async () => {
        if (!editName.trim()) {
            Alert.alert("Hata", "Grup adı boş olamaz.");
            return;
        }

        try {
            setIsUpdating(true);
            await updateGroup(groupId, editName.trim(), colorCode);            
            Alert.alert("Başarılı", "Grup bilgileri güncellendi.");
            // İstersen burada navigation.setOptions ile başlığı da güncelleyebilirsin
        } catch (error) {
            Alert.alert("Hata", "Grup güncellenirken bir sorun oluştu.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddMember = async () => {
        if (!emailInput.trim()) return;
        try {
            setIsAdding(true);
            await addGroupMember(groupId, emailInput.trim());
            setEmailInput("");
            Alert.alert("Başarılı", "Üye gruba eklendi.");
            loadMembers();
        } catch (error) {
            Alert.alert("Hata", "Üye eklenemedi.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveMember = (memberUserId: string, memberName: string) => {
        Alert.alert("Üyeyi Çıkar", `"${memberName}" adlı kullanıcıyı gruptan çıkarmak istediğinize emin misiniz?`, [
            { text: "İptal", style: "cancel" },
            {
                text: "Çıkar", style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await removeGroupMember(groupId, memberUserId);
                        loadMembers();
                    } catch (error) {
                        Alert.alert("Hata", "Üye gruptan çıkarılamadı.");
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const renderHeader = () => (
        <View>
            {/* GRUP BİLGİLERİ DÜZENLEME KARTI */}
            <View style={styles.editSection}>
                <Text style={styles.sectionTitle}>Grup Bilgilerini Düzenle</Text>
                
                <View style={styles.inputContainer}>
                    <Ionicons name="pencil-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Grup Adı"
                    />
                </View>

                {/* RENK SEÇİCİ */}
                <View style={{ marginTop: 15 }}>
                    <Text style={[styles.sectionTitle, { fontSize: 12, marginBottom: 8 }]}>Grup Rengi</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        {GROUP_COLORS.map((color) => (
                            <Pressable
                                key={color}
                                onPress={() => setColorCode(color)}
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: color },
                                    colorCode === color && styles.selectedColorDot
                                ]}
                            >
                                {colorCode === color && <Ionicons name="checkmark" size={16} color="white" />}
                            </Pressable>
                        ))}
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.updateButton, { backgroundColor: colorCode }]} 
                    onPress={handleUpdateGroup}
                    disabled={isUpdating}
                >
                    {isUpdating ? <ActivityIndicator color="white" /> : <Text style={styles.updateButtonText}>Bilgileri Güncelle</Text>}
                </TouchableOpacity>
            </View>

            {/* ÜYE EKLEME KISMI */}
            <View style={styles.addSection}>
                <Text style={styles.sectionTitle}>Yeni Üye Ekle</Text>
                <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-posta adresi..."
                            value={emailInput}
                            onChangeText={setEmailInput}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddMember} disabled={isAdding}>
                        {isAdding ? <ActivityIndicator color="white" /> : <Ionicons name="person-add" size={20} color="white" />}
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 10 }]}>Mevcut Üyeler ({members.length})</Text>
        </View>
    );

    return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#102a43" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerTitle}>Grubu Düzenle</Text>
            <Text style={styles.headerSubtitle}>{editName}</Text>
        </View>
        </View>

        <FlatList
        data={members}
        keyExtractor={(item) => item.userId || item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
            <View style={styles.memberCard}>
            <View style={[styles.memberAvatar, { backgroundColor: `${colorCode}20` }]}>
                <Text style={[styles.memberAvatarText, { color: colorCode }]}>
                {item.name?.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMember(item.userId, item.name)}
            >
                <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
            </View>
        )}
        ListHeaderComponent={
            <View>
            <View style={styles.editSection}>
                <Text style={styles.sectionTitle}>Grup Bilgilerini Düzenle</Text>

                <View style={styles.inputContainer}>
                <Ionicons name="pencil-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Grup Adı"
                />
                </View>

                <View style={{ marginTop: 15 }}>
                <Text style={[styles.sectionTitle, { fontSize: 12, marginBottom: 8 }]}>Grup Rengi</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    {GROUP_COLORS.map((color) => (
                    <Pressable
                        key={color}
                        onPress={() => setColorCode(color)}
                        style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        colorCode === color && styles.selectedColorDot
                        ]}
                    >
                        {colorCode === color && <Ionicons name="checkmark" size={16} color="white" />}
                    </Pressable>
                    ))}
                </View>
                </View>

                <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: colorCode }]}
                onPress={handleUpdateGroup}
                disabled={isUpdating}
                >
                {isUpdating ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.updateButtonText}>Bilgileri Güncelle</Text>
                )}
                </TouchableOpacity>
            </View>

            <View style={styles.addSection}>
                <Text style={styles.sectionTitle}>Yeni Üye Ekle</Text>
                <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                    style={styles.input}
                    placeholder="E-posta adresi..."
                    value={emailInput}
                    onChangeText={setEmailInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    blurOnSubmit={false}
                    />
                    
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddMember} disabled={isAdding}>
                    {isAdding ? (
                    <ActivityIndicator color="white" />
                    ) : (
                    <Ionicons name="person-add" size={20} color="white" />
                    )}
                </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 10 }]}>
                Mevcut Üyeler ({members.length})
            </Text>
            </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Henüz başka üye yok.</Text> : null}
        />
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "white" },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
    headerSubtitle: { fontSize: 13, color: "#64748b" },

    editSection: { padding: 20, backgroundColor: "white", marginBottom: 10, borderRadius: 20, marginHorizontal: 15, marginTop: 15, elevation: 2 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 10 },
    
    inputContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 12, height: 45 },
    input: { flex: 1, fontSize: 15, color: "#0f172a" },
    
    colorDot: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
    selectedColorDot: { borderWidth: 2, borderColor: "#102a43" },

    updateButton: { marginTop: 20, height: 45, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    updateButtonText: { color: "white", fontWeight: "700", fontSize: 15 },

    addSection: { padding: 20, backgroundColor: "white", marginBottom: 10, marginHorizontal: 15, borderRadius: 20 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    addButton: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#2F7E8D", justifyContent: "center", alignItems: "center" },

    memberCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 12, marginHorizontal: 20, borderRadius: 16, marginBottom: 8 },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
    memberAvatarText: { fontSize: 16, fontWeight: "700" },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: "700", color: "#102a43" },
    memberEmail: { fontSize: 12, color: "#64748b" },
    removeButton: { padding: 5 },
    emptyText: { textAlign: "center", marginTop: 20, color: "#94a3b8" }
});