import React from "react";
import { Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  editable?: boolean;
}

export default function AppInput(props: Props) {
  const {
    label,
    multiline,
    autoCapitalize = "sentences",
    autoCorrect = true,
    editable = true,
    ...rest
  } = props;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: 14,
          fontWeight: "600",
          marginBottom: -20,
        }}
      >
        {label}
      </Text>

      <TextInput
        {...rest}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        placeholderTextColor="rgba(255,255,255,0.75)"
        style={{
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.08)",
          color: "#fff",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 14 : 16,
          minHeight: multiline ? 100 : 56,
          fontSize: 16,
        }}
      />
    </View>
  );
}