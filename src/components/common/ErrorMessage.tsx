import React from "react";
import { Text, View } from "react-native";

export default function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <View
      style={{
        backgroundColor: "rgba(220, 38, 38, 0.38)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {message}
      </Text>
    </View>
  );
}