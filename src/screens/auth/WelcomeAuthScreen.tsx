import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../hooks/useAuth";
import { configureGoogleSignin, getApiErrorMessage } from "../../utils/helpers";
import {
    RegisterFormData,
    registerSchema,
} from "../../utils/validationSchemas";

export default function WelcomeAuthScreen({ navigation }: any) {
  const { height, width } = useWindowDimensions();
  const { register, loginWithGoogle, loginWithApple } = useAuth();
  const { showAlert } = useAlert();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const logoWidth = Math.min(width, 250);
  const logoHeight = logoWidth;

  useEffect(() => {
    configureGoogleSignin();
  }, []);

  const onRegister = handleSubmit(async (values) => {
    try {
      setSubmitError("");

      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      navigation.navigate("VerifyEmail", { email: values.email.trim() });
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setFormError("email", {
          type: "manual",
          message:
            "Bu e-posta adresi zaten kullanımda olabilir. Lütfen başka bir e-posta deneyin veya giriş yapın.",
        });
      } else {
        setSubmitError(getApiErrorMessage(err));
      }
    }
  });

  const onGooglePress = async () => {
    try {
      setSubmitError("");
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();

      const idToken =
        "data" in result ? result.data?.idToken : (result as any)?.idToken;

      if (!idToken) {
        showAlert({
          title: "Hata",
          message: "Google oturum bilgisi alınamadı.",
          type: "danger",
        });
        return;
      }

      await loginWithGoogle(idToken);
    } catch (error: any) {
      setSubmitError(error?.message || "Google ile giriş başarısız oldu.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onApplePress = async () => {
    if (Platform.OS !== "ios") {
      showAlert({
        title: "Kullanılamıyor",
        message: "Apple oturum açma yalnızca iOS'ta kullanılabilir.",
        type: "info",
      });
      return;
    }

    try {
      setSubmitError("");
      setAppleLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const idToken = credential.identityToken;
      const authorizationCode = (credential as any).authorizationCode;

      if (!idToken) {
        showAlert({
          title: "Hata",
          message: "Apple kimlik bilgisi alınamadı.",
          type: "danger",
        });
        return;
      }

      const fullName = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const applePayload: any = {
        idToken,
        fullName: fullName || null,
      };

      if (authorizationCode) {
        applePayload.authorizationCode = authorizationCode;
      }

      await loginWithApple(applePayload);
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") return;
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Apple ile giriş başarısız oldu.";
      setSubmitError(errorMessage);
    } finally {
      setAppleLoading(false);
    }
  };

  const firstFieldError =
    errors.name?.message ||
    errors.email?.message ||
    errors.password?.message ||
    "";
  const combinedError = submitError || firstFieldError;

  return (
    <View style={{ flex: 1, width, height }}>
      <ImageBackground
       source={require("../../../assets/images/blur50.png")}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                style={{ flex: 1, width: "100%" }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.content}>
                  <Image
                    source={require("../../../assets/images/welcometo.png")}
                    style={{
                      width: logoWidth,
                      height: logoHeight,
                      resizeMode: "contain",
                      marginTop: 0,
                      marginBottom: -8,
                      opacity: 0.85,
                    }}
                  />

                  <ErrorMessage message={combinedError} />

                  <View style={styles.form}>
                    <Controller
                      control={control}
                      name="name"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <AppInput
                          value={value}
                          onChangeText={onChange}
                          placeholder="İsminizi girin"
                          keyboardType="default"
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <AppInput
                          value={value}
                          onChangeText={onChange}
                          placeholder="E-posta"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <AppInput
                          value={value}
                          onChangeText={onChange}
                          placeholder="Şifre"
                          secureTextEntry={!showPassword}
                          keyboardType="default"
                          autoCapitalize="none"
                          autoCorrect={false}
                          showPasswordToggle
                          onPasswordToggle={() => setShowPassword(!showPassword)}
                          isPasswordVisible={showPassword}
                        />
                      )}
                    />

                    <View style={{ marginTop: 8 }}>
                      <AppButton
                        title="Hesap Oluştur"
                        onPress={onRegister}
                        loading={isSubmitting}
                      />
                    </View>

                    <View style={styles.dividerWrapper}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>Veya </Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                      style={styles.socialButton}
                      onPress={onGooglePress}
                      disabled={googleLoading}
                    >
                      <Ionicons name="logo-google" size={18} color="#fff" />
                      <Text style={styles.socialButtonText}>
                        {googleLoading ? "Bekleyin..." : "Google ile Giriş"}
                      </Text>
                    </Pressable>

                    {Platform.OS === "ios" && (
                      <Pressable
                        style={styles.socialButton}
                        onPress={onApplePress}
                        disabled={appleLoading}
                      >
                        <Ionicons name="logo-apple" size={20} color="#fff" />
                        <Text style={styles.socialButtonText}>
                          {appleLoading ? "Bekleyin..." : "Apple ile Giriş"}
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => navigation.navigate("Login")}
                      style={styles.loginLink}
                    >
                      <Text style={styles.loginText}>
                        Hesabın var mı {" "}
                        <Text style={styles.loginHighlight}>Giriş Yap</Text>
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  form: {
    width: "100%",
    marginTop: 4,
  },
  dividerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  socialButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 6,
    alignSelf: "center",
    padding: 6,
  },
  loginText: {
    fontSize: 17,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  loginHighlight: {
    color: "#F4E7A1",
    fontWeight: "700",
  },
});
