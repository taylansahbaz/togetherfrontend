import React from "react";
import { TextInput, View } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
}

export default function AppInput(props: Props) {
  const { label, multiline, ...rest } = props;

  return (
    <View style={{ marginBottom: 16 }}>

      <TextInput
        {...rest}
        multiline={multiline}
        autoCapitalize="none"
        placeholderTextColor="rgba(255,255,255,1)"
        style={{
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.28)",
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 16 : 15,
          minHeight: multiline ? 110 : 56,
          textAlignVertical: multiline ? "top" : "center",
          backgroundColor: "rgba(215, 214, 214, 0.50)",
          fontSize: 16,
          color: "#ffffff",
          backdropFilter: "blur(8px)",
        }}
      />
    </View>
  );
}