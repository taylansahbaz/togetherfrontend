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
import { resetPassword } from "../../api/auth";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import CustomAlert from "../../components/common/CustomAlert";
import ErrorMessage from "../../components/common/ErrorMessage";
import { getApiErrorMessage } from "../../utils/helpers";

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { height, width } = useWindowDimensions();
  const email = route?.params?.email ?? "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError("E-posta eksik.");
      return false;
    }

    if (!code.trim()) {
      setError("Sıfırlama kodu boş bırakılamaz.");
      return false;
    }

    if (!newPassword) {
      setError("Yeni şifre boş bırakılamaz.");
      return false;
    }

    if (newPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return false;
    }

    if (!confirmPassword) {
      setError("Lütfen şifrenizi onaylayınız.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return false;
    }

    return true;
  };

  const onResetPassword = async () => {
    if (!validate()) return;

    try {
      setError("");
      setLoading(true);

      await resetPassword(email.trim(), code.trim(), newPassword);
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

                  <ErrorMessage message={error} />

                  <View style={{ width: "100%" }}>

                    <AppInput
                      label="Code"
                      value={code}
                      onChangeText={setCode}
                      placeholder="6 Haneli Kod"
                      keyboardType="numeric"
                    />

                    <AppInput
                      label="Yeni Şifre"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder="Yeni Şifre"
                    />

                    <AppInput
                      label="Şifre Doğrula"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      placeholder="Şifre Doğrula"
                    />

                    <View style={{ marginTop: 12 }}>
                      <AppButton
                        title="Şifreyi Güncelle"
                        onPress={onResetPassword}
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
          title="Başarılı"
          message="Şifreniz başarıyla değiştirildi."
          type="success"
          confirmText="Giriş Yap"
          showCancelButton={false}
          onConfirm={() => {
            setSuccessVisible(false);
            navigation.navigate("Login");
          }}
        />
      </ImageBackground>
    </View>
  );
}