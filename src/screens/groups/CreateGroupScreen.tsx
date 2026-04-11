import { GroupselectedIconsJson } from "@/src/types/group";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { createGroup, uploadGroupAvatar } from "../../api/groups";
import AppButton from "../../components/common/AppButton";
import CustomAlert from "../../components/common/CustomAlert";
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

export default function CreateGroupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [colorCode, setColorCode] = useState(GROUP_COLORS[0]);
  const [iconKey, setIconKey] = useState<GroupselectedIconsJson | null>("planet");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isIconModalVisible, setIsIconModalVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"danger" | "success" | "info">("info");

  const selectedIconName = useMemo(() => {
    return GROUP_ICONS.find((item) => item.key === iconKey)?.iconName ?? "planet";
  }, [iconKey]);

  const showAlert = (
    title: string,
    message: string,
    type: "danger" | "success" | "info" = "info"
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  const pickGroupPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          "İzin Gerekli",
          "Grup fotoğrafı seçebilmek için galeri izni vermen gerekiyor.",
          "info"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        showAlert("Hata", "Fotoğraf seçilemedi.", "danger");
        return;
      }

      setPhotoUrl(asset.uri);
      setIconKey(null);
    } catch (error) {
      showAlert("Hata", getApiErrorMessage(error), "danger");
    }
  };

  const handleOpenIconPicker = () => {
    setIsIconModalVisible(true);
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

  const onCreate = async () => {
    if (!name.trim()) {
      showAlert("Eksik Bilgi", "Lütfen grup adını gir.", "info");
      return;
    }

    try {
      setLoading(true);

      let finalPhotoUrl: string | null = null;

      const isLocalPhoto =
        !!photoUrl &&
        (photoUrl.startsWith("file://") || photoUrl.startsWith("content://"));

      if (isLocalPhoto) {
        finalPhotoUrl = await uploadGroupAvatar(photoUrl);
      } else if (photoUrl) {
        finalPhotoUrl = photoUrl;
      }

      await createGroup({
        name: name.trim(),
        colorcode: colorCode,
        photoUrl: finalPhotoUrl,
        selectedIconsJson: finalPhotoUrl ? null : iconKey,
      });

      showAlert("Başarılı", "Grup başarıyla oluşturuldu.", "success");

      setTimeout(() => {
        setAlertVisible(false);
        navigation.goBack();
      }, 700);
    } catch (err) {
      showAlert("Hata", getApiErrorMessage(err), "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* SABİT ÜST BİLGİ VE GERİ BUTONU */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="#102a43" />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Yeni Grup</Text>
          <Text style={styles.headerSubtitle}>Harika anılar biriktirmeye başla</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. KART GİBİ DURAN GİRİŞ ALANI (AppInput yerine kendi TextInput'umuz) */}
        <View style={styles.inputContainer}>
          <View style={styles.sectionHeader}>
             <Ionicons name="enter-outline" size={20} color="#64748b" />
             <Text style={styles.sectionTitle}>Grup Adı</Text>
          </View>
          <TextInput
            style={styles.customInput}
            value={name}
            onChangeText={setName}
            placeholder="Harika bir isim düşün..."
            placeholderTextColor="#94a3b8"
            selectionColor="#102a43"
          />
        </View>

        {/* 2. KART: RENK SEÇİMİ */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Grup Rengi</Text>
          </View>

          <View style={styles.colorGrid}>
            {GROUP_COLORS.map((color) => {
              const isSelected = colorCode === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setColorCode(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    isSelected && styles.colorCircleSelected,
                    isSelected && { shadowColor: color }
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark-sharp" size={22} color="#ffffff" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. KART: AVATAR SEÇİMİ */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Grup Avatarı</Text>
          </View>

          <View style={styles.avatarPreviewContainer}>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={[styles.avatarImage, { borderColor: colorCode }]}
              />
            ) : (
              <View
                style={[styles.avatarPlaceholder, { backgroundColor: colorCode }]}
              >
                <Ionicons name={selectedIconName} size={44} color="#ffffff" />
              </View>
            )}
          </View>

          <View style={styles.actionButtonsRow}>
            <Pressable onPress={pickGroupPhoto} style={styles.actionButton}>
              <Ionicons name="camera-outline" size={20} color="#486581" />
              <Text style={styles.actionButtonText}>Fotoğraf</Text>
            </Pressable>

            <Pressable onPress={handleOpenIconPicker} style={styles.actionButton}>
              <Ionicons name="apps-outline" size={20} color="#486581" />
              <Text style={styles.actionButtonText}>İkon Seç</Text>
            </Pressable>
          </View>

          {(photoUrl || iconKey !== "planet") && (
            <Pressable onPress={handleClearAvatar} style={styles.resetButton}>
              <Ionicons name="refresh-outline" size={16} color="#ef4444" />
              <Text style={styles.resetButtonText}>Avatarı Sıfırla</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.submitButtonContainer}>
          <AppButton title="Grubu Oluştur" onPress={onCreate} loading={loading} />
        </View>
      </ScrollView>

      {/* İKON SEÇİM MODALI */}
      <Modal
        visible={isIconModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsIconModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grup İkonu Seç</Text>
              <Text style={styles.modalSubtitle}>
                Grubunu en iyi yansıtan ikonu belirle.
              </Text>
            </View>

            <View style={styles.iconGrid}>
              {GROUP_ICONS.map((item) => {
                const isSelected = iconKey === item.key && !photoUrl;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handleSelectIcon(item.key)}
                    style={styles.iconItem}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        isSelected ? { backgroundColor: colorCode, borderColor: colorCode } : null
                      ]}
                    >
                      <Ionicons
                        name={item.iconName}
                        size={26}
                        color={isSelected ? "#ffffff" : "#64748b"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.iconLabel,
                        isSelected && { color: "#102a43", fontWeight: "700" }
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setIsIconModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Vazgeç</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onConfirm={closeAlert}
        confirmText="Tamam"
        type={alertType}
        showCancelButton={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#cfe7fecf",
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
    paddingHorizontal: 4, 
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  customInput: {
    backgroundColor: "#ffffff",
    height: 56, 
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0f172a",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  colorCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    marginBottom: 20,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    borderWidth: 4,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
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
    height: 50,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
  },
  submitButtonContainer: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
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
    height: 50,
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