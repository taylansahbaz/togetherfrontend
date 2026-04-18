import React, { useState } from "react";
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
import { forgotPassword } from "../../api/auth";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import CustomAlert from "../../components/common/CustomAlert";
import ErrorMessage from "../../components/common/ErrorMessage";
import { getApiErrorMessage } from "../../utils/helpers";

export default function ForgotPasswordScreen({ navigation }: any) {
  const { height, width } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError("E-posta boş bırakılamaz.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return false;
    }

    return true;
  };

  const onSendCode = async () => {
    if (!validate()) return;

    try {
      setError("");
      setLoading(true);

      await forgotPassword(email.trim());
      setSuccessVisible(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
                  paddingBottom: height * 0.18,
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
                      marginBottom: 20,
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
                    Şifremi Unuttum
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: 32,
                      textAlign: "center",
                      lineHeight: 22,
                    }}
                  >
                    E-posta adresinizi girin, size şifre sıfırlama kodu gönderelim.
                  </Text>

                  <ErrorMessage message={error} />

                  <View style={{ width: "100%" }}>
                    <AppInput
                      label="E-posta"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholder="E-posta"
                    />

                    <View style={{ marginTop: 12 }}>
                      <AppButton
                        title="Kodu Gönder"
                        onPress={onSendCode}
                        loading={loading}
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

        <CustomAlert
          visible={successVisible}
          title="Kod Gönderildi"
          message="E-posta adresinize şifre sıfırlama kodu gönderildi."
          type="success"
          confirmText="Devam Et"
          showCancelButton={false}
          onConfirm={() => {
            setSuccessVisible(false);
            navigation.navigate("ResetPassword", {
              email: email.trim(),
            });
          }}
        />
      </ImageBackground>
    </View>
  );
}