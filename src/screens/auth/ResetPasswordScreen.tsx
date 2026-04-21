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
    View,
} from "react-native";
import { resetPassword } from "../../api/auth";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useAlert } from "../../context/AlertContext";
import { getApiErrorMessage } from "../../utils/helpers";
import {
    ResetPasswordFormData,
    resetPasswordSchema,
} from "../../utils/validationSchemas";

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { height, width } = useWindowDimensions();
  const email = route?.params?.email ?? "";
  const { showAlert } = useAlert();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const [submitError, setSubmitError] = useState("");

  const onResetPassword = handleSubmit(async (values) => {
    if (!email.trim()) {
      setSubmitError("E-posta eksik.");
      return;
    }

    try {
      setSubmitError("");
      await resetPassword(email.trim(), values.code.trim(), values.password);

      showAlert({
        title: "Başarılı",
        message: "Şifreniz başarıyla değiştirildi.",
        type: "success",
        confirmText: "Giriş Yap",
        onConfirm: () => navigation.navigate("Login"),
      });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  });

  const firstFieldError =
    errors.code?.message ||
    errors.password?.message ||
    errors.confirmPassword?.message ||
    "";
  const combinedError = submitError || firstFieldError;

  return (
    <View style={{ flex: 1, width, height }}>
      <ImageBackground
        source={require("../../../assets/images/bg-blur.jpg")}
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
                  paddingHorizontal: 30,
                  paddingBottom: height * 0.14,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  style={{
                    width: "100%",
                    maxWidth: 470,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../assets/images/logoyazisiz.png")}
                    style={{
                      width: 350,
                      height: 350,
                      resizeMode: "contain",
                      marginBottom: 14,
                      opacity: 0.85,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginBottom: 10,
                      textAlign: "center",
                    }}
                  >
                    Yeni Şifre Belirle
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: 28,
                      textAlign: "center",
                      lineHeight: 22,
                    }}
                  >
                    E-postanıza gelen kodu girin ve yeni şifrenizi oluşturun.
                  </Text>

                  <ErrorMessage message={combinedError} />

                  <View style={{ width: "100%" }}>
                    <Controller
                      control={control}
                      name="code"
                      render={({ field: { onChange, value } }) => (
                        <AppInput
                          label="Code"
                          value={value}
                          onChangeText={onChange}
                          placeholder="6 Haneli Kod"
                          keyboardType="numeric"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, value } }) => (
                        <AppInput
                          label="Yeni Şifre"
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry
                          autoCapitalize="none"
                          placeholder="Yeni Şifre"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, value } }) => (
                        <AppInput
                          label="Şifre Doğrula"
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry
                          autoCapitalize="none"
                          placeholder="Şifre Doğrula"
                        />
                      )}
                    />

                    <View style={{ marginTop: 12 }}>
                      <AppButton
                        title="Şifreyi Güncelle"
                        onPress={onResetPassword}
                        loading={isSubmitting}
                      />
                    </View>

                    <Pressable
                      onPress={() => navigation.goBack()}
                      style={{
                        marginTop: 14,
                        height: 54,
                        borderRadius: 16,
                        backgroundColor: "rgba(255,255,255,0.10)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.16)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#FFFFFF",
                        }}
                      >
                        Geri Dön
                      </Text>
                    </Pressable>
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
