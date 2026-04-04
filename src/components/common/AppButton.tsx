import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        backgroundColor: disabled
          ? "rgba(255,255,255,0.22)"
          : "rgba(201, 120, 120, 0.9)",
        paddingVertical: 17,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.40)",
      }}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: 17,
            fontWeight: "400",
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}