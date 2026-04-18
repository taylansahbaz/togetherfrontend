import React, { useState } from "react";
import {
    Alert,
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
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/helpers";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();

  const { height, width } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError("E-posta boş bırakılamaz.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Lütfen geçerli bir email adresi girin.");
      return false;
    }

    if (!password) {
      setError("Şifre boş bırakılamaz.");
      return false;
    }

    return true;
  };

  const onLogin = async () => {
    if (!validate()) return;

    try {
      setError("");
      setLoading(true);

      await login({
        email: email.trim(),
        password,
      });
    } catch (err) {
      const message = getApiErrorMessage(err);

      if (message === "Please verify your email address before logging in.") {
        Alert.alert(
          "Doğrulama Gerekli",
          "Hesabınız henüz doğrulanmamış. Size yeni bir onay kodu gönderiyoruz...",
          [
            {
              text: "Kodu Gir",
              onPress: async () => {
                navigation.navigate("VerifyEmail", { email: email.trim() });
                resendVerification(email.trim()).catch((err) => {
                  console.log("Mail gönderilemedi:", err);
                  Alert.alert("Uyarı", "Yeni kod gönderilirken bir sorun oluştu, lütfen tekrar deneyin.");
                });
              }
            },
            {
              text: "İptal",
              style: "cancel"
            }
          ]
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

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
                      width: 280,
                      height: 280,
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
                  >
                    Paylaşılan Anılarına Devam Et
                  </Text>

                  <ErrorMessage message={error} />

                  <View style={{ width: "100%" }}>
                    <AppInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholder="E-posta"
                    />

                    <AppInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholder="Şifre"
                      showPasswordToggle
                      onPasswordToggle={() => setShowPassword(!showPassword)}
                      isPasswordVisible={showPassword}
                    />
                  <View style={{ marginTop: 4 }}>
                  <AppButton
                    title="Devam Et"
                    onPress={onLogin}
                    loading={loading}
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