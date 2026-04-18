import { GroupRole, GroupselectedIconsJson } from "@/src/types/group";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    cancelGroupInvitation,
    getGroupMembers,
    getPendingGroupInvitations,
    inviteGroupMember, // Eklenen API metodu
    leaveGroup,
    removeGroupMember,
    updateGroup,
    uploadGroupAvatar, // Eklenen API metodu
} from "../../api/groups";
import CustomAlert from "../../components/common/CustomAlert";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/helpers";

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

type Member = {
  id?: string;
  userId: string;
  name: string;
  email: string;
  role?: GroupRole;
};

type PendingInvitation = {
  id: string;
  email: string;
  invitedUserName?: string;
  status: string;
  createdAt?: string;
};

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

export default function GroupMembersScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  // Listeden gelen mevcut veriler (Grup Listesi sayfasından bunları passladığını varsayıyoruz)
  const { 
    groupId, 
    groupName, 
    currentColor, 
    photoUrl: initialPhotoUrl, 
    selectedIconsJson: initialIconKey 
  } = route.params;

  // Üye ve Davet State'leri
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  // Güncelleme Form State'leri
  const [editName, setEditName] = useState(groupName);
  const [colorCode, setColorCode] = useState(currentColor || GROUP_COLORS[0]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl || null);
  const [iconKey, setIconKey] = useState<GroupselectedIconsJson | null>(initialIconKey || "planet");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isIconModalVisible, setIsIconModalVisible] = useState(false);

  // Davet Form State'leri
  const [emailInput, setEmailInput] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Alert State
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "Tamam",
    cancelText: "İptal",
    showCancelButton: false,
  });

  const selectedIconName = useMemo(() => {
    return GROUP_ICONS.find((item) => item.key === iconKey)?.iconName ?? "planet";
  }, [iconKey]);

  // Current user'ın role'ünü belirle
  const currentUserRole = useMemo(() => {
    if (!user?.id) return null;
    const currentMember = members.find(m => m.userId === user.id);
    return currentMember?.role as GroupRole | undefined;
  }, [user?.id, members]);

  const isCurrentUserOwner = currentUserRole === "Owner";
  const isCurrentUserMember = currentUserRole === "Member";

  const hideAlert = () => setAlertState((prev) => ({ ...prev, visible: false }));

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
    setAlertState({ visible: true, title, message, type, confirmText, cancelText, showCancelButton, onConfirm, onCancel });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, pendingData] = await Promise.all([
        getGroupMembers(groupId),
        getPendingGroupInvitations(groupId),
      ]);
      setMembers(membersData || []);
      setPendingInvitations(pendingData || []);
    } catch (error) {
      showAlert({ title: "Hata", message: "Grup verileri yüklenemedi.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [groupId])
  );

  // -- AVATAR FONKSİYONLARI --
  const pickGroupPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert({ title: "İzin Gerekli", message: "Grup fotoğrafı seçebilmek için galeri izni vermen gerekiyor.", type: "info" });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUrl(result.assets[0].uri);
        setIconKey(null);
      }
    } catch (error) {
      showAlert({ title: "Hata", message: getApiErrorMessage(error), type: "danger" });
    }
  };

  const handleSelectIcon = (selectedKey: GroupselectedIconsJson) => {
    setIconKey(selectedKey);
    setPhotoUrl(null);
    setIsIconModalVisible(false);
  };

  const handleClearAvatar = () => {
    setPhotoUrl(null);
    setIconKey("planet");
  };

  // -- GRUP GÜNCELLEME --
  const handleUpdateGroup = async () => {
    if (!editName.trim()) {
      showAlert({ title: "Hata", message: "Grup adı boş olamaz.", type: "danger" });
      return;
    }

    try {
      setIsUpdating(true);
      let finalPhotoUrl: string | null = null;

      const isLocalPhoto = !!photoUrl && (photoUrl.startsWith("file://") || photoUrl.startsWith("content://"));
      if (isLocalPhoto) {
        finalPhotoUrl = await uploadGroupAvatar(photoUrl);
      } else {
        finalPhotoUrl = photoUrl;
      }

      await updateGroup(groupId, {
        name: editName.trim(),
        colorcode: colorCode,
        photoUrl: finalPhotoUrl,
        selectedIconsJson: finalPhotoUrl ? null : iconKey,
      });

      showAlert({ title: "Başarılı", message: "Grup bilgileri başarıyla güncellendi.", type: "success" });
    } catch (error) {
      showAlert({ title: "Hata", message: "Grup güncellenirken bir sorun oluştu.", type: "danger" });
    } finally {
      setIsUpdating(false);
    }
  };

  // -- DAVET & ÜYE FONKSİYONLARI --
  const handleInviteMember = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      showAlert({ title: "Hata", message: "Lütfen bir e-posta adresi gir.", type: "danger" });
      return;
    }

    try {
      setIsInviting(true);
      await inviteGroupMember(groupId, email);
      setEmailInput("");
      showAlert({ title: "Başarılı", message: "Davet gönderildi. Karşı tarafa bildirim ve e-posta iletildi.", type: "success" });
      await loadData();
    } catch (error: any) {
      showAlert({ title: "Hata", message: error?.response?.data?.message || error?.message || "Davet gönderilemedi.", type: "danger" });
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    showAlert({
      title: "Daveti İptal Et",
      message: `"${email}" için gönderilen daveti iptal etmek istiyor musun?`,
      type: "danger",
      confirmText: "İptal Et",
      cancelText: "Vazgeç",
      showCancelButton: true,
      onConfirm: async () => {
        try {
          await cancelGroupInvitation(invitationId);
          await loadData();
        } catch (error) {
          showAlert({ title: "Hata", message: "Davet iptal edilemedi.", type: "danger" });
        }
      },
    });
  };

  const handleRemoveMember = (memberUserId: string, memberName: string) => {
    showAlert({
      title: "Üyeyi Çıkar",
      message: `"${memberName}" adlı kullanıcıyı gruptan çıkarmak istediğine emin misin?`,
      type: "danger",
      confirmText: "Çıkar",
      cancelText: "Vazgeç",
      showCancelButton: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          await removeGroupMember(groupId, memberUserId);
          await loadData();
        } catch (error) {
          setLoading(false);
          showAlert({ title: "Hata", message: "Üye gruptan çıkarılamadı.", type: "danger" });
        }
      },
    });
  };

  const handleLeaveGroup = () => {
    showAlert({
      title: "Gruptan Çık",
      message: "Bu gruptan ayrılmak istediğine emin misin? Gruba tekrar katılmak için davet almanız gerekecek.",
      type: "danger",
      confirmText: "Çık",
      cancelText: "Vazgeç",
      showCancelButton: true,
      onConfirm: async () => {
        try {
          setIsLeavingGroup(true);
          await leaveGroup(groupId);
          showAlert({ 
            title: "Başarılı", 
            message: "Gruptan başarıyla çıktınız.",
            type: "success",
            onConfirm: () => navigation.goBack()
          });
        } catch (error) {
          setIsLeavingGroup(false);
          showAlert({ title: "Hata", message: getApiErrorMessage(error), type: "danger" });
        }
      },
    });
  };

  const renderPendingInvitations = () => {
    if (!pendingInvitations.length) {
      return (
        <View style={styles.emptyPendingBox}>
          <Ionicons name="mail-open-outline" size={24} color="#cbd5e1" />
          <Text style={styles.emptyPendingText}>Bekleyen davet yok.</Text>
        </View>
      );
    }

    return (
      <View style={styles.pendingList}>
        {pendingInvitations.map((item) => (
          <View key={item.id} style={styles.pendingCard}>
            <View style={[styles.pendingIconBox, { backgroundColor: `${colorCode}18` }]}>
              <Ionicons name="time-outline" size={20} color={colorCode} />
            </View>
            <View style={styles.pendingInfo}>
              <View style={styles.pendingTopRow}>
                <Text style={styles.pendingEmail} numberOfLines={1}>{item.email}</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.pendingHint}>Kullanıcı kabul edince gruba eklenecek.</Text>
            </View>
            <TouchableOpacity style={styles.cancelInviteButton} onPress={() => handleCancelInvitation(item.id, item.email)}>
              <Ionicons name="close-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => {
    const isCurrentUser = item.userId === user?.id;
    const showRemoveButton = isCurrentUserOwner && !isCurrentUser;

    return (
      <View style={styles.memberCard}>
        <View style={[styles.memberAvatar, { backgroundColor: `${colorCode}20` }]}>
          <Text style={[styles.memberAvatarText, { color: colorCode }]}>
            {item.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.name}</Text>
            {isCurrentUser && <View style={styles.youBadge}><Text style={styles.youBadgeText}>Sen</Text></View>}
          </View>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
        {showRemoveButton && (
          <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveMember(item.userId, item.name)}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // FlatList Header: Ayarlar ve Davet Formları
  const headerContent = useMemo(() => (
    <View>
      {/* KART 1: GRUP BİLGİLERİNİ DÜZENLE */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Grup Bilgileri</Text>

        {/* Avatar Bölümü */}
        <View style={styles.avatarPreviewContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={[styles.avatarImage, { borderColor: colorCode }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colorCode }]}>
              <Ionicons name={selectedIconName} size={44} color="#ffffff" />
            </View>
          )}
        </View>

        <View style={styles.actionButtonsRow}>
          <Pressable onPress={pickGroupPhoto} style={styles.actionButton}>
            <Ionicons name="camera-outline" size={18} color="#486581" />
            <Text style={styles.actionButtonText}>Fotoğraf</Text>
          </Pressable>
          <Pressable onPress={() => setIsIconModalVisible(true)} style={styles.actionButton}>
            <Ionicons name="apps-outline" size={18} color="#486581" />
            <Text style={styles.actionButtonText}>İkon Seç</Text>
          </Pressable>
        </View>

        {(photoUrl || iconKey !== "planet") && (
          <Pressable onPress={handleClearAvatar} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={14} color="#ef4444" />
            <Text style={styles.resetButtonText}>Avatarı Sıfırla</Text>
          </Pressable>
        )}

        <View style={styles.divider} />

        {/* Grup Adı */}
        <Text style={styles.inputLabel}>Grup Adı</Text>
        <TextInput
          style={styles.customInput}
          value={editName}
          onChangeText={setEditName}
          placeholder="Grup adı"
          placeholderTextColor="#94a3b8"
          selectionColor="#102a43"
        />

        <View style={styles.divider} />

        {/* Grup Rengi */}
        <Text style={styles.inputLabel}>Grup Rengi</Text>
        <View style={styles.colorGrid}>
          {GROUP_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => setColorCode(color)}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                colorCode === color && styles.colorCircleSelected,
                colorCode === color && { shadowColor: color }
              ]}
            >
              {colorCode === color && <Ionicons name="checkmark-sharp" size={20} color="white" />}
            </Pressable>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: colorCode }]}
          onPress={handleUpdateGroup}
          disabled={isUpdating}
        >
          {isUpdating ? <ActivityIndicator color="white" /> : <Text style={styles.updateButtonText}>Değişiklikleri Kaydet</Text>}
        </TouchableOpacity>
      </View>

      {/* KART 2: GRUBA DAVET ET */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Yeni Üye Davet Et</Text>
        <Text style={styles.inviteDescription}>
          Arkadaşının e-posta adresini yaz. Kabul ettiğinde gruba eklenecektir.
        </Text>

        <View style={styles.inputRow}>
          <View style={[styles.customInput, { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }]}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: "#0f172a" }}
              placeholder="E-posta adresi"
              placeholderTextColor="#94a3b8"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colorCode }]}
            onPress={handleInviteMember}
            disabled={isInviting}
          >
            {isInviting ? <ActivityIndicator color="white" /> : <Ionicons name="paper-plane-outline" size={20} color="white" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* KART 3: BEKLEYEN DAVETLER */}
      <View style={styles.card}>
        <View style={styles.sectionRow}>
          <Text style={styles.cardHeaderTitle}>Bekleyen Davetler</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{pendingInvitations.length}</Text>
          </View>
        </View>
        {renderPendingInvitations()}
      </View>

      {/* KART 4: GRUPTAN ÇIK (Sadece Member ise göster) */}
      {isCurrentUserMember && (
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Grup Ayarları</Text>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
            disabled={isLeavingGroup}
          >
            {isLeavingGroup ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="exit-outline" size={20} color="white" style={styles.leaveButtonIcon} />
                <Text style={styles.leaveButtonText}>Gruptan Çık</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Üyeler Listesi Başlığı */}
      <View style={styles.membersSectionHeader}>
        <Text style={styles.cardHeaderTitle}>Mevcut Üyeler</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{members.length}</Text>
        </View>
      </View>
    </View>
  ), [
    editName, colorCode, isUpdating, emailInput, isInviting, pendingInvitations, members.length, photoUrl, iconKey, selectedIconName, isCurrentUserMember, isCurrentUserOwner, isLeavingGroup
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={colorCode} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#102a43" />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Grubu Yönet</Text>
          <Text style={styles.headerSubtitle}>{editName}</Text>
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId || item.id || Math.random().toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={renderMemberItem}
        ListHeaderComponent={headerContent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Bu grupta henüz üye yok.</Text>}
        showsVerticalScrollIndicator={false}
      />

      {/* İKON SEÇİM MODALI */}
      <Modal visible={isIconModalVisible} transparent animationType="fade" onRequestClose={() => setIsIconModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grup İkonu Seç</Text>
              <Text style={styles.modalSubtitle}>Grubunu en iyi yansıtan ikonu belirle.</Text>
            </View>
            <View style={styles.iconGrid}>
              {GROUP_ICONS.map((item) => {
                const isSelected = iconKey === item.key && !photoUrl;
                return (
                  <Pressable key={item.key} onPress={() => handleSelectIcon(item.key)} style={styles.iconItem}>
                    <View style={[styles.iconCircle, isSelected && { backgroundColor: colorCode, borderColor: colorCode }]}>
                      <Ionicons name={item.iconName} size={26} color={isSelected ? "#ffffff" : "#64748b"} />
                    </View>
                    <Text style={[styles.iconLabel, isSelected && { color: "#102a43", fontWeight: "700" }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => setIsIconModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Vazgeç</Text>
            </Pressable>
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
        onConfirm={() => { const cb = alertState.onConfirm; hideAlert(); cb?.(); }}
        onCancel={() => { const cb = alertState.onCancel; hideAlert(); cb?.(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f6",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: "#ffffff",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#102a43",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    marginLeft: 4,
  },
  customInput: {
    backgroundColor: "#f8fafc",
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorCircleSelected: {
    borderColor: "#102a43",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarPreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f1f5f9",
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4,
    paddingVertical: 6,
  },
  resetButtonText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
  },
  updateButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  inviteDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748b",
    marginBottom: 16,
    marginTop: -8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  pendingList: {
    marginTop: 8,
    gap: 10,
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  pendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingEmail: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 8,
  },
  pendingBadge: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#c2410c",
  },
  pendingHint: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  cancelInviteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  emptyPendingBox: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyPendingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  membersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 24,
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#102a43",
  },
  youBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },
  memberEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  leaveButtonIcon: {
    marginRight: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#94a3b8",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  iconItem: {
    width: "23%",
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  modalCloseButton: {
    marginTop: 28,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },
});