import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { GroupselectedIconsJson } from "../../types/group";

interface Props {
  size?: number;
  photoUrl?: string | null;
  iconKey?: GroupselectedIconsJson | null;
  backgroundColor?: string;
}

export default function GroupAvatar({
  size = 54,
  photoUrl,
  iconKey,
  backgroundColor = "#DCC7C1",
}: Props) {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Ionicons
        name={mapGroupIcon(iconKey)}
        size={size * 0.46}
        color="#FFFFFF"
      />
    </View>
  );
}

export function mapGroupIcon(iconKey?: GroupselectedIconsJson | null): any {
  switch (iconKey) {
    case "planet":
      return "planet";
    case "people":
      return "people";
    case "heart":
      return "heart";
    case "camera":
      return "camera";
    case "restaurant":
      return "restaurant";
    case "airplane":
      return "airplane";
    case "music":
      return "musical-notes";
    case "paw":
      return "paw";
    default:
      return "planet";
  }
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});