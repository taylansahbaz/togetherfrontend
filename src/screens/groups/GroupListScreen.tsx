import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image // Image importu eklendi
    ,


















    ImageBackground,
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

import { deleteGroup, getMyGroups, updateGroup } from "../../api/groups";
import CustomAlert from "../../components/common/CustomAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { Group, GroupselectedIconsJson } from "../../types/group"; // GroupselectedIconsJson eklendi

const GROUP_COLORS = [
    "#6E97A3",
    "#E6CFC7",
    "#A8B6D9",
    "#E7C98B",
    "#C7A6B8",
    "#8FBFD2",
    "#9FAF9C",
    "#B7A7D6",
    "#D98F8F",
    "#8FAED9",
    "#8FCFA9",
    "#D9C18F",
    "#C28FD9",
    "#8FD9D1",
];

// İkonların doğru renderlanması için eşleştirme listesi buraya da eklendi
const GROUP_ICONS: {
  key: GroupselectedIconsJson;
  iconName: any;
  label: string;
}[] = [
  { key: "planet", iconName: "planet", label: "Gezegen" },
  { key: "people", iconName: "people", label: "Grup" },
  { key: "heart", iconName: "heart", label: "Kalp" },
  { key: "camera", iconName: "camera", label: "Kamera" },
  { key: "restaurant", iconName: "restaurant", label: "Yemek" },
  { key: "airplane", iconName: "airplane", label: "Seyahat" },
  { key: "music", iconName: "musical-notes", label: "Müzik" },
  { key: "paw", iconName: "paw", label: "Dostlar" },
];

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

export default function GroupsScreen({ navigation }: any) {
    const {
            selectedGroup,
            selectedGroupId,
            setSelectedGroup,
            clearSelectedGroup,
            initializeSelectedGroup,
            } = useSelectedGroup();

    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [activeGroupOptions, setActiveGroupOptions] = useState<Group | null>(null);
    const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editGroupName, setEditGroupName] = useState("");
    const [editing, setEditing] = useState(false);

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

    const fetchGroups = async () => {
        try {
            const response = await getMyGroups();
            const groups = response.data.groups ?? [];

            const lastSelectedGroupId = response.data.lastSelectedGroupId ?? null;
            setGroups(groups);
            await initializeSelectedGroup(groups, lastSelectedGroupId);
        } catch (error) {
            console.log("Fetch groups error:", error);
            showAlert({
                title: "Hata",
                message: "Gruplar yüklenemedi.",
                type: "danger",
            });
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

    const openEditModal = () => {
        if (activeGroupOptions) {
            setEditGroupName(
                activeGroupOptions.name || (activeGroupOptions as any).title || ""
            );
            setIsOptionsModalVisible(false);
            setTimeout(() => setIsEditModalVisible(true), 300);
        }
    };

    const handleEditGroup = async () => {
        if (!editGroupName.trim() || !activeGroupOptions) return;

        try {
            setEditing(true);
            
            await updateGroup(activeGroupOptions.id, {
                name: editGroupName.trim(),
                colorcode: activeGroupOptions.colorCode || "#6E97A3",
                photoUrl: activeGroupOptions.photoUrl,
                selectedIconsJson: activeGroupOptions.selectedIconsJson
            });

            setIsEditModalVisible(false);

            if (selectedGroupId === activeGroupOptions.id && setSelectedGroup) {
                setSelectedGroup({
                    ...activeGroupOptions,
                    name: editGroupName.trim(),
                });
            }

            fetchGroups(); // Listeyi yenile

            showAlert({
                title: "Başarılı",
                message: "Grup adı güncellendi.",
                type: "success",
            });
        } catch (error) {
            showAlert({
                title: "Hata",
                message: "Grup adı güncellenemedi.",
                type: "danger",
            });
        } finally {
            setEditing(false);
        }
    };

    const handleDeleteGroupConfirmed = async () => {
        if (!activeGroupOptions) return;

        try {
            setLoading(true);
            await deleteGroup(activeGroupOptions.id);

            if (selectedGroupId === activeGroupOptions.id && setSelectedGroup) {
                setSelectedGroup(null);
            }

            fetchGroups();
        } catch (error) {
            showAlert({
                title: "Hata",
                message: "Grup silinemedi.",
                type: "danger",
            });
            setLoading(false);
        }
    };

    const confirmDeleteGroup = () => {
        if (!activeGroupOptions) return;

        setIsOptionsModalVisible(false);

        setTimeout(() => {
            showAlert({
                title: "Grubu Sil",
                message: `"${activeGroupOptions.name}" grubunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                type: "danger",
                confirmText: "Sil",
                cancelText: "İptal",
                showCancelButton: true,
                onConfirm: handleDeleteGroupConfirmed,
            });
        }, 300);
    };

    // İkon ismini eşleştiren yardımcı fonksiyon
    const getGroupIconName = (key: string | null | undefined) => {
        const found = GROUP_ICONS.find((icon) => icon.key === key);
        return found ? found.iconName : "planet"; // Bulamazsa varsayılan planet
    };

    const renderGroupCard = ({ item }: { item: Group }) => {
        const isSelected = item.id === selectedGroupId;
        const groupColor = item.colorCode || "#2F7E8D";

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedGroup && setSelectedGroup(item)}
                style={[
                    styles.groupCard,
                    {
                        borderColor: isSelected ? groupColor : `${groupColor}55`,
                        backgroundColor: isSelected ? `${groupColor}20` : `${groupColor}12`,
                    },
                ]}
            >
                {/* DİNAMİK AVATAR / İKON ALANI */}
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor: groupColor,
                            overflow: "hidden", // Fotoğrafın dışarı taşmasını önlemek için
                        },
                    ]}
                >
                    {item.photoUrl ? (
                        <Image
                            source={{ uri: item.photoUrl }}
                            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                        />
                    ) : (
                        <Ionicons 
                            name={getGroupIconName(item.selectedIconsJson)} 
                            size={28} 
                            color="#ffffff" 
                        />
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text
                        style={[
                            styles.groupTitle,
                            { color: groupColor },
                        ]}
                        numberOfLines={1}
                    >
                        {item.name || "İsimsiz Grup"}
                    </Text>

                    <Text style={styles.groupSubtitle}>
                        Oluşturulma: {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.cardRightActions}>
                    {isSelected && (
                        <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={groupColor}
                            style={{ marginRight: 8 }}
                        />
                    )}

                    <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={(e) => {
                            e.stopPropagation();
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
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={require("../../../assets/images/home-bg.png")}
                resizeMode="cover"
                style={{ flex: 1, width: "100%", height: "100%" }}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(245, 249, 250, 0.85)",
                    }}
                >
                    <SafeAreaView style={{ flex: 1 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 24,
                                paddingTop: 20,
                                paddingBottom: 16,
                            }}
                        >
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={{
                                    backgroundColor: "#ffffff",
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={20}
                                    color="#102a43"
                                />
                            </Pressable>

                            <View style={{ marginLeft: 16 }}>
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: "800",
                                        color: "#102a43",
                                    }}
                                >
                                    Gruplarım
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        color: "#64748b",
                                        fontWeight: "500",
                                    }}
                                >
                                    Ortak anılarınızı yönetin
                                </Text>
                            </View>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.headerSubtitle}>
                                Haritada görmek istediğiniz grubu seçin
                            </Text>
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
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        tintColor="#2F7E8D"
                                    />
                                }
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Ionicons
                                            name="folder-open-outline"
                                            size={64}
                                            color="#cbd5e1"
                                        />
                                        <Text style={styles.emptyStateTitle}>
                                            Henüz Grup Yok
                                        </Text>
                                        <Text style={styles.emptyStateDesc}>
                                            Planlarınızı organize etmek için ilk grubunuzu oluşturun.
                                        </Text>
                                    </View>
                                }
                            />
                        )}

                        <TouchableOpacity
                            style={styles.fab}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate("CreateGroupScreen")}
                        >
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>

                        <Modal
                            visible={isOptionsModalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setIsOptionsModalVisible(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setIsOptionsModalVisible(false)}
                            >
                                <View style={styles.optionsMenu}>
                                    <Text style={styles.optionsMenuTitle}>
                                        {activeGroupOptions?.name}
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={openEditModal}
                                    >
                                        <Ionicons name="pencil" size={20} color="#3b82f6" />
                                        <Text style={styles.optionText}>Adını Düzenle</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setIsOptionsModalVisible(false);
                                            
                                            // BURAYA DİKKAT: Artık edit ekranına giderken fotoğraf ve ikon verisini de yolluyoruz!
                                            navigation.navigate("GroupMembers", {
                                                groupId: activeGroupOptions?.id,
                                                groupName: activeGroupOptions?.name,
                                                currentColor: activeGroupOptions?.colorCode,
                                                photoUrl: activeGroupOptions?.photoUrl,
                                                selectedIconsJson: activeGroupOptions?.selectedIconsJson,
                                            });
                                        }}
                                    >
                                        <Ionicons name="people" size={20} color="#F59E0B" />
                                        <Text style={styles.optionText}>Grubu Yönet</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.optionItem, { borderBottomWidth: 0 }]}
                                        onPress={confirmDeleteGroup}
                                    >
                                        <Ionicons name="trash" size={20} color="#ef4444" />
                                        <Text
                                            style={[styles.optionText, { color: "#ef4444" }]}
                                        >
                                            Grubu Sil
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        {/* HIZLI İSİM DÜZENLEME MODALI */}
                        <Modal
                            visible={isEditModalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setIsEditModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Grubu Düzenle</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Yeni grup adı..."
                                        placeholderTextColor="#94a3b8"
                                        value={editGroupName}
                                        onChangeText={setEditGroupName}
                                        autoFocus={true}
                                    />
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.modalCancelBtn}
                                            onPress={() => setIsEditModalVisible(false)}
                                        >
                                            <Text style={styles.modalCancelText}>İptal</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalCreateBtn}
                                            onPress={handleEditGroup}
                                            disabled={editing}
                                        >
                                            {editing ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="white"
                                                />
                                            ) : (
                                                <Text style={styles.modalCreateText}>
                                                    Kaydet
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>

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
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 32, fontWeight: "900", color: "#0f172a" },
    headerSubtitle: { fontSize: 15, color: "#64748b", marginTop: 4 },
    listContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },

    groupCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "transparent",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    groupCardSelected: { borderColor: "#2F7E8D", backgroundColor: "#f0f9fa" },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    groupTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#102a43",
        marginBottom: 4,
    },
    groupSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "500" },

    cardRightActions: { flexDirection: "row", alignItems: "center" },
    optionsButton: {
        padding: 6,
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
    },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 80,
        paddingHorizontal: 20,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#102a43",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateDesc: {
        fontSize: 15,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 22,
    },

    fab: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 40 : 30,
        right: 24,
        backgroundColor: "#2F7E8D",
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2F7E8D",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        justifyContent: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: "#f1f5f9",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#0f172a",
        fontWeight: "600",
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    modalCancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#64748b",
    },
    modalCreateBtn: {
        backgroundColor: "#2F7E8D",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 100,
    },
    modalCreateText: {
        fontSize: 15,
        fontWeight: "700",
        color: "white",
    },

    optionsMenu: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 16,
        width: "100%",
        alignSelf: "center",
        marginTop: "auto",
        marginBottom: 20,
    },
    optionsMenuTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#94a3b8",
        textAlign: "center",
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        marginBottom: 8,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    optionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#102a43",
        marginLeft: 12,
    },
});