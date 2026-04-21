import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { resendVerification } from "../../api/auth";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/helpers";
import { LoginFormData, loginSchema } from "../../utils/validationSchemas";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const { showAlert } = useAlert();

  const { height, width } = useWindowDimensions();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onLogin = handleSubmit(async (values) => {
    const trimmedEmail = values.email.trim();
    try {
      setSubmitError("");

      await login({ email: trimmedEmail, password: values.password });
    } catch (err) {
      const message = getApiErrorMessage(err);

      if (
        message === "Please verify your email address before logging in." ||
        message === "Giriş yapmadan önce lütfen e-posta adresinizi doğrulayın."
      ) {
        showAlert({
          title: "Doğrulama Gerekli",
          message:
            "Hesabınız henüz doğrulanmamış. Size yeni bir onay kodu gönderiyoruz...",
          type: "info",
          showCancelButton: true,
          confirmText: "Kodu Gir",
          cancelText: "İptal",
          onConfirm: async () => {
            navigation.navigate("VerifyEmail", { email: trimmedEmail });
            resendVerification(trimmedEmail).catch((resendErr) => {
              console.log("Mail gönderilemedi:", resendErr);
              showAlert({
                title: "Uyarı",
                message:
                  "Yeni kod gönderilirken bir sorun oluştu, lütfen tekrar deneyin.",
                type: "danger",
              });
            });
          },
        });
      } else {
        setSubmitError(message);
      }
    }
  });

  const firstFieldError =
    errors.email?.message || errors.password?.message || "";
  const combinedError = submitError || firstFieldError;

  return (
    <View style={{ flex: 1, width, height }}>
      <ImageBackground
        source={require("../../../assets/images/blur50.png")}
        resizeMode="cover"
        style={{ flex: 1, width: "100%", height: "100%" }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.25)",
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                style={{ flex: 1, width: "100%" }}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../assets/images/logoyazisiz.png")}
                    style={{
                      width: 300,
                      height: 300,
                      resizeMode: "contain",
                      marginTop: -92,
                      marginBottom: 10,
                      opacity: 0.8,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: 16,
                      letterSpacing: 0.5,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  > Paylaşılan Anılarınıza Devam Edin
                  </Text>

                  <ErrorMessage message={combinedError} />

                  <View style={{ width: "100%" }}>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, value } }) => (
                        <AppInput
                          value={value}
                          onChangeText={onChange}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="E-posta"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, value } }) => (
                        <AppInput
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="Şifre"
                          showPasswordToggle
                          onPasswordToggle={() => setShowPassword(!showPassword)}
                          isPasswordVisible={showPassword}
                        />
                      )}
                    />
                  <View style={{ marginTop: 4 }}>
                  <AppButton
                    title="Devam Et"
                    onPress={onLogin}
                    loading={isSubmitting}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Pressable
                    onPress={() => navigation.navigate("ForgotPassword")}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: "rgba(149, 215, 209, 0.65)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.18)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#FFFFFF",
                      }}
                    >
                      Şifremi Unuttum
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate("Register")}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: "rgba(244,231,161,0.65)",
                      borderWidth: 1,
                      borderColor: "rgba(244,231,161,0.35)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#fffbe3",
                      }}
                    >
                      Kayıt Ol
                    </Text>
                  </Pressable>
                </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}
