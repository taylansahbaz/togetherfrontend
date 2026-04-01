import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ImageBackground, // YENİ: ImageBackground import edildi
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// API'den update ve delete fonksiyonlarını da import ettik
import { createGroup, deleteGroup, getGroups, updateGroup } from "../../api/groups";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Group } from "../../types/group";
const GROUP_COLORS = ["#2F7E8D", "#fcbebe", "#a78bfa", "#fbbf24", "#34d399", "#f472b6", "#38bdf8"];
export default function GroupsScreen({ navigation }: any) {
    const { selectedGroupId, setSelectedGroup } = useSelectedGroup();

    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Create Modal States
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [creating, setCreating] = useState(false);
    const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
    // Options & Edit States
    const [activeGroupOptions, setActiveGroupOptions] = useState<Group | null>(null);
    const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editGroupName, setEditGroupName] = useState("");
    const [editing, setEditing] = useState(false);

    const fetchGroups = async () => {
        try {
            const data = await getGroups();
            setGroups(data);

            if (!selectedGroupId && data.length > 0 && setSelectedGroup) {
                setSelectedGroup(data[0]);
            }
        } catch (error) {
            console.log("Fetch groups error:", error);
            Alert.alert("Hata", "Gruplar yüklenemedi.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchGroups();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchGroups();
    };

    // --- GRUP OLUŞTURMA ---
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            Alert.alert("Uyarı", "Lütfen bir grup adı girin.");
            return;
        }
        try {
            setCreating(true);
            const newGroup = await createGroup({ name: newGroupName.trim(), color: newGroupColor });
            setNewGroupName("");
            setIsCreateModalVisible(false);
            if (setSelectedGroup) setSelectedGroup(newGroup);
            fetchGroups();
        } catch (error) {
            Alert.alert("Hata", "Grup oluşturulamadı.");
        } finally {
            setCreating(false);
        }
    };

    // --- GRUP DÜZENLEME ---
    const openEditModal = () => {
        if (activeGroupOptions) {
            setEditGroupName(activeGroupOptions.name || (activeGroupOptions as any).title || "");
            setIsOptionsModalVisible(false);
            setTimeout(() => setIsEditModalVisible(true), 300); // iOS modal geçişi için ufak gecikme
        }
    };

    const handleEditGroup = async () => {
        if (!editGroupName.trim() || !activeGroupOptions) return;
        try {
            setEditing(true);
            await updateGroup(activeGroupOptions.id, editGroupName.trim(), activeGroupOptions.color);
            setIsEditModalVisible(false);

            // Eğer düzenlenen grup şu an seçili olansa, Context'i de güncelle
            if (selectedGroupId === activeGroupOptions.id && setSelectedGroup) {
                setSelectedGroup({ ...activeGroupOptions, name: editGroupName.trim() });
            }

            fetchGroups();
            Alert.alert("Başarılı", "Grup adı güncellendi.");
        } catch (error) {
            Alert.alert("Hata", "Grup adı güncellenemedi.");
        } finally {
            setEditing(false);
        }
    };

    // --- GRUP SİLME ---
    const confirmDeleteGroup = () => {
        if (!activeGroupOptions) return;
        setIsOptionsModalVisible(false);

        setTimeout(() => {
            Alert.alert(
                "Grubu Sil",
                `"${activeGroupOptions.name}" grubunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                [
                    { text: "İptal", style: "cancel" },
                    {
                        text: "Sil",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                setLoading(true);
                                await deleteGroup(activeGroupOptions.id);

                                // Silinen grup seçiliyse seçimi kaldır
                                if (selectedGroupId === activeGroupOptions.id && setSelectedGroup) {
                                    setSelectedGroup(null);
                                }
                                fetchGroups();
                            } catch (error) {
                                Alert.alert("Hata", "Grup silinemedi.");
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
        }, 300);
    };

const renderGroupCard = ({ item }: { item: Group }) => {
        const isSelected = item.id === selectedGroupId;
        // YENİ: Grubun kendi rengini alıyoruz, yoksa varsayılan turkuaz yapıyoruz
        const groupColor = (item as any).colorCode || "#2F7E8D"; 

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedGroup && setSelectedGroup(item)}
                style={[
                    styles.groupCard,
                    // YENİ: Seçiliyse kenarlığı grubun rengi yap, arkaplanı da o rengin çok hafif saydam hali yap (Sonundaki 15 hex saydamlık kodudur)
                    isSelected && { borderColor: groupColor, backgroundColor:  "#f1f5f9" }
                ]}
            >
                <View style={[
                    styles.iconContainer,
                    // YENİ: Seçiliyse ikon arkaplanı grubun kendi rengi olsun
                    isSelected ? { backgroundColor: groupColor } : { backgroundColor: "#f1f5f9" }
                ]}>
                    <Ionicons name={isSelected ? "planet" : "planet-outline"} size={24} color={isSelected ? "white" : "#64748b"} />
                </View>

                <View style={styles.cardContent}>
                    {/* YENİ: Seçiliyse başlık yazısı grubun renginde olsun */}
                    <Text style={[styles.groupTitle, isSelected && { color: groupColor }]} numberOfLines={1}>
                        {item.name || (item as any).title || "İsimsiz Grup"}
                    </Text>
                    <Text style={styles.groupSubtitle}>
                        Oluşturulma: {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                </View>

                {/* Sağ Taraf: Seçim İkonu ve Seçenekler (3 Nokta) Butonu */}
                <View style={styles.cardRightActions}>
                    {isSelected && (
                        // YENİ: Onay tiki de grubun kendi renginde!
                        <Ionicons name="checkmark-circle" size={24} color={groupColor} style={{ marginRight: 8 }} />
                    )}
                    <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={(e) => {
                            e.stopPropagation(); // Kartın seçilmesini engelle
                            setActiveGroupOptions(item);
                            setIsOptionsModalVisible(true);
                        }}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        // YENİ: Arka plan yapısı eklendi
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../assets/images/home-bg.png")}
                resizeMode="cover"
                style={{ flex: 1, width: "100%", height: "100%" }}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(245, 249, 250, 0.85)" }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                <Pressable 
                    onPress={() => navigation.goBack()} 
                    style={{ 
                        backgroundColor: "#ffffff", 
                        width: 40, height: 40, borderRadius: 20, 
                        justifyContent: "center", alignItems: "center", 
                        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color="#102a43" />
                </Pressable>
                
                <View style={{ marginLeft: 16 }}>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#102a43" }}>
                        Gruplarım
                    </Text>
                    <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500" }}>
                        Ortak anılarınızı yönetin
                    </Text>
                </View>
            </View>
                        <View style={styles.header}>
                            <Text style={styles.headerSubtitle}>Haritada görmek istediğiniz grubu seçin</Text>
                        </View>

                        {loading && !refreshing ? (
                            <View style={styles.centerContainer}>
                                <LoadingSpinner />
                            </View>
                        ) : (
                            <FlatList
                                data={groups}
                                keyExtractor={(item) => item.id}
                                renderItem={renderGroupCard}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2F7E8D" />}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Ionicons name="folder-open-outline" size={64} color="#cbd5e1" />
                                        <Text style={styles.emptyStateTitle}>Henüz Grup Yok</Text>
                                        <Text style={styles.emptyStateDesc}>Planlarınızı organize etmek için ilk grubunuzu oluşturun.</Text>
                                    </View>
                                }
                            />
                        )}

                        {/* YÜZEN EKLEME BUTONU (FAB) */}
                        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setIsCreateModalVisible(true)}>
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>

                        {/* --- MODALLAR --- */}

                        {/* 1. SEÇENEKLER MODALI (Bottom Sheet tarzı) */}
                        <Modal visible={isOptionsModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsOptionsModalVisible(false)}>
                            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOptionsModalVisible(false)}>
                                <View style={styles.optionsMenu}>
                                    <Text style={styles.optionsMenuTitle}>{activeGroupOptions?.name}</Text>

                                    <TouchableOpacity style={styles.optionItem} onPress={openEditModal}>
                                        <Ionicons name="pencil" size={20} color="#3b82f6" />
                                        <Text style={styles.optionText}>Adını Düzenle</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setIsOptionsModalVisible(false);
                                            // Üyeleri Yönet Ekranına Yönlendirme
                                            navigation.navigate("GroupMembers", { groupId: activeGroupOptions?.id, groupName: activeGroupOptions?.name , currentColor: (activeGroupOptions as any)?.colorCode   });
                                        }}
                                    >
                                        <Ionicons name="people" size={20} color="#F59E0B" />
                                        <Text style={styles.optionText}>Grubu Yönet</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} onPress={confirmDeleteGroup}>
                                        <Ionicons name="trash" size={20} color="#ef4444" />
                                        <Text style={[styles.optionText, { color: "#ef4444" }]}>Grubu Sil</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        {/* 2. GRUP OLUŞTURMA MODALI */}
                        <Modal visible={isCreateModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsCreateModalVisible(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Yeni Grup</Text>
                                    
                                    <TextInput
                                        style={styles.modalInput} 
                                        placeholder="Grup adı..." 
                                        placeholderTextColor="#94a3b8"
                                        value={newGroupName} 
                                        onChangeText={setNewGroupName} 
                                        autoFocus={true}
                                    />

                                    {/* YENİ: RENK PALETİ */}
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748b", marginBottom: 8, marginTop: -10 }}>Grup Rengi</Text>
                                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
                                        {GROUP_COLORS.map((color) => (
                                            <Pressable
                                                key={color}
                                                onPress={() => setNewGroupColor(color)}
                                                style={[
                                                    styles.colorDot,
                                                    { backgroundColor: color },
                                                    newGroupColor === color && styles.selectedColorDot
                                                ]}
                                            >
                                                {newGroupColor === color && <Ionicons name="checkmark" size={16} color="white" />}
                                            </Pressable>
                                        ))}
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setIsCreateModalVisible(false); setNewGroupName(""); setNewGroupColor(GROUP_COLORS[0]); }}>
                                            <Text style={styles.modalCancelText}>İptal</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalCreateBtn} onPress={handleCreateGroup} disabled={creating}>
                                            {creating ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.modalCreateText}>Oluştur</Text>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {/* 3. GRUP DÜZENLEME MODALI */}
                        <Modal visible={isEditModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsEditModalVisible(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Grubu Düzenle</Text>
                                    <TextInput
                                        style={styles.modalInput} placeholder="Yeni grup adı..." placeholderTextColor="#94a3b8"
                                        value={editGroupName} onChangeText={setEditGroupName} autoFocus={true}
                                    />
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)}>
                                            <Text style={styles.modalCancelText}>İptal</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalCreateBtn} onPress={handleEditGroup} disabled={editing}>
                                            {editing ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.modalCreateText}>Kaydet</Text>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    // YENİ: container arka planını kaldırdık ki ImageBackground görünsün
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 32, fontWeight: "900", color: "#0f172a" },
    headerSubtitle: { fontSize: 15, color: "#64748b", marginTop: 4 },
    listContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },

    groupCard: {
        flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", // Cam efekti hissi için hafif opak
        padding: 16, borderRadius: 20, marginBottom: 16,
        borderWidth: 2, borderColor: "transparent",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
    },
    groupCardSelected: { borderColor: "#2F7E8D", backgroundColor: "#f0f9fa" },
    iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 16 },
    cardContent: { flex: 1 },
    groupTitle: { fontSize: 18, fontWeight: "800", color: "#102a43", marginBottom: 4 },
    groupSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "500" },

    cardRightActions: { flexDirection: "row", alignItems: "center" },
    optionsButton: { padding: 6, backgroundColor: "#f1f5f9", borderRadius: 12 },

    emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: 20 },
    emptyStateTitle: { fontSize: 20, fontWeight: "800", color: "#102a43", marginTop: 16, marginBottom: 8 },
    emptyStateDesc: { fontSize: 15, color: "#64748b", textAlign: "center", lineHeight: 22 },

    fab: {
        position: "absolute", bottom: Platform.OS === "ios" ? 40 : 30, right: 24,
        backgroundColor: "#2F7E8D", width: 64, height: 64, borderRadius: 32,
        justifyContent: "center", alignItems: "center",
        shadowColor: "#2F7E8D", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8
    },

    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", padding: 20 },
    modalContent: { backgroundColor: "white", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    modalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 20 },
    modalInput: { backgroundColor: "#f1f5f9", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#0f172a", fontWeight: "600", marginBottom: 24 },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
    modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    modalCancelText: { fontSize: 15, fontWeight: "700", color: "#64748b" },
    modalCreateBtn: { backgroundColor: "#2F7E8D", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", minWidth: 100 },
    modalCreateText: { fontSize: 15, fontWeight: "700", color: "white" },

    colorDot: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
    selectedColorDot: { borderWidth: 2, borderColor: "#102a43" },
    // OPTIONS MENU (Action Sheet)
    optionsMenu: { backgroundColor: "white", borderRadius: 24, padding: 16, width: "100%", alignSelf: "center", marginTop: "auto", marginBottom: 20 },
    optionsMenuTitle: { fontSize: 16, fontWeight: "700", color: "#94a3b8", textAlign: "center", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", marginBottom: 8 },
    optionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    optionText: { fontSize: 16, fontWeight: "600", color: "#102a43", marginLeft: 12 }
});