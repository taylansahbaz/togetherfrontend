import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { GroupselectedIconsJson } from "../../types/group";
import { GROUP_AVATAR_ICONS } from "../../utils/constants";
import GroupAvatar from "./GroupAvatar";

interface Props {
  photoUrl?: string | null;
  iconKey?: GroupselectedIconsJson | null;
  colorCode?: string;
  onChangePhotoUrl: (value: string | null) => void;
  onChangeIconKey: (value: GroupselectedIconsJson | null) => void;
}

export default function GroupAvatarPicker({
  photoUrl,
  iconKey,
  colorCode = "#C9A7EB",
  onChangePhotoUrl,
  onChangeIconKey,
}: Props) {
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "İzin Gerekli",
        "Fotoğraf seçebilmek için galeri izni vermen gerekiyor."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) {
      return;
    }

    const selectedAsset = result.assets?.[0];
    if (!selectedAsset?.uri) {
      return;
    }

    onChangePhotoUrl(selectedAsset.uri);
    onChangeIconKey(null);
  };

  const handleSelectIcon = (selectedKey: GroupselectedIconsJson) => {
    onChangeIconKey(selectedKey);
    onChangePhotoUrl(null);
  };

  const handleClearAvatar = () => {
    onChangePhotoUrl(null);
    onChangeIconKey(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grup Avatarı</Text>
      <Text style={styles.subtitle}>
        Fotoğraf ekleyebilir veya aşağıdaki ikonlardan birini seçebilirsin.
      </Text>

      <View style={styles.previewWrapper}>
        <GroupAvatar
          size={86}
          photoUrl={photoUrl}
          iconKey={iconKey}
          backgroundColor={colorCode}
        />
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.mainButton} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={18} color="#6B4FA1" />
          <Text style={styles.mainButtonText}>
            {photoUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleClearAvatar}>
          <Ionicons name="trash-outline" size={18} color="#8B8B8B" />
          <Text style={styles.secondaryButtonText}>Kaldır</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal={false}
        contentContainerStyle={styles.iconGrid}
        showsVerticalScrollIndicator={false}
      >
        {GROUP_AVATAR_ICONS.map((item) => {
          const isSelected = iconKey === item.key && !photoUrl;

          return (
            <Pressable
              key={item.key}
              style={[
                styles.iconItem,
                isSelected && styles.iconItemSelected,
              ]}
              onPress={() => handleSelectIcon(item.key)}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isSelected ? colorCode : "#EDE7F6",
                  },
                ]}
              >
                <Ionicons
                  name={item.iconName as any}
                  size={24}
                  color={isSelected ? "#FFFFFF" : "#8D6BC6"}
                />
              </View>

              <Text
                style={[
                  styles.iconLabel,
                  isSelected && styles.iconLabelSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5D4A73",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#8B8394",
    lineHeight: 18,
    marginBottom: 16,
  },
  previewWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  mainButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F3ECFB",
    borderWidth: 1,
    borderColor: "#E2D2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mainButtonText: {
    color: "#6B4FA1",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    width: 110,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryButtonText: {
    color: "#8B8B8B",
    fontSize: 14,
    fontWeight: "600",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconItem: {
    width: "22%",
    alignItems: "center",
  },
  iconItemSelected: {},
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 12,
    color: "#857C90",
    textAlign: "center",
    fontWeight: "500",
  },
  iconLabelSelected: {
    color: "#6B4FA1",
    fontWeight: "700",
  },
});