import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  editable?: boolean;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  isPasswordVisible?: boolean;
}

export default function AppInput(props: Props) {
  const {
    label,
    multiline,
    showPasswordToggle,
    onPasswordToggle,
    isPasswordVisible,
    autoCapitalize = "sentences",
    autoCorrect = true,
    editable = true,
    ...rest
  } = props;

  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
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
      )}

      <View style={{ position: "relative" }}>
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
            paddingRight: showPasswordToggle ? 50 : 16,
            minHeight: multiline ? 100 : 56,
            fontSize: 16,
          }}
        />
        
        {showPasswordToggle && (
          <Pressable
            onPress={onPasswordToggle}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              marginTop: -12,
            }}
          >
            <Ionicons
              name={isPasswordVisible ? "eye" : "eye-off"}
              size={20}
              color="rgba(255,255,255,0.7)"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}