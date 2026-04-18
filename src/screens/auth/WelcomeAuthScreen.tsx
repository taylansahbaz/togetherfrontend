import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import {
    Alert,
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
import { useAuth } from "../../hooks/useAuth";
import { configureGoogleSignin, getApiErrorMessage } from "../../utils/helpers";

export default function WelcomeAuthScreen({ navigation }: any) {
  
  const { height, width } = useWindowDimensions();
  const { register, loginWithGoogle, loginWithApple } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const logoWidth = Math.min(width, 250);
  const logoHeight = logoWidth;

  useEffect(() => {
    configureGoogleSignin();
  }, []);

const validate = () => {
  // 1. İsim Kontrolü
  if (!name.trim()) {
    setError("İsim alanı boş bırakılamaz.");
    return false;
  }

  // 2. E-posta Boşluk Kontrolü
  if (!email.trim()) {
    setError("E-posta alanı boş bırakılamaz.");
    return false;
  }

  // 3. E-posta Geçerlilik Kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return false;
    }

    // 4. Şifre Boşluk Kontrolü
    if (!password) {
      setError("Şifre alanı boş bırakılamaz.");
      return false;
    }

    // 5. Şifre Güç (Regex) Kontrolü
    // Kural: En az 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter ve minimum 6 karakter
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,#]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError("Şifreniz en az 6 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter (., !, vs.) içermelidir.");
      return false;
    }

    // Tüm kontrollerden geçerse sunucuya gitmeye hazır!
    return true;
  };

  const onRegister = async () => {
  // 1. Önce frontend'deki o güçlü kurallarımız (şifre, e-posta formatı) çalışacak
  if (!validate()) return; // Eğer validate false dönerse, fonksiyon burada durur ve sunucuya gitmez.

  try {
    setError(""); // Ekranda kalmış eski hata mesajları varsa temizle
    setRegisterLoading(true); // Yükleniyor (Loading) animasyonunu başlat

    // 2. Sunucuya verileri sağındaki solundaki boşlukları temizleyerek gönder
    await register({
      name: name.trim(),
      email: email.trim(),
      password, // Şifreyi trimlemiyoruz, kullanıcı şifresinde bilerek boşluk kullanmış olabilir.
    });

    // 3. İşlem başarılı! Kullanıcıyı e-posta doğrulama ekranına yönlendir
    navigation.navigate("VerifyEmail", { email: email.trim() });

  } catch (err: any) {
    // 4. Eğer validate'i geçip sunucudan 400 aldıysak (Büyük ihtimalle mail zaten kayıtlı demektir)
    if (err?.response?.status === 400) {
      setError("Bu e-posta adresi zaten kullanımda olabilir. Lütfen başka bir e-posta deneyin veya giriş yapın.");
    } else {
      // Sunucu çökmesi (500) veya internet kopması gibi diğer hatalar
      const message = getApiErrorMessage(err);
      setError(message);
    }
  } finally {
    setRegisterLoading(false); // Başarılı da olsa hata da verse loading'i durdur
  }
};

  const onGooglePress = async () => {
    try {
      setError("");
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();

      const idToken =
        "data" in result ? result.data?.idToken : (result as any)?.idToken;

      if (!idToken) {
        Alert.alert("Error", "Google id token could not be retrieved.");
        return;
      }

      await loginWithGoogle(idToken);
    } catch (error: any) {
      setError(error?.message || "Google sign in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onApplePress = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Kullanılamıyor", "Apple oturum açma yalnızca iOS'ta kullanılabilir.");
      return;
    }

    try {
      setError("");
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
        Alert.alert("Error", "Apple identity token could not be retrieved.");
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
      console.error("Apple login error details:", {
        status: error?.response?.status,
        message: error?.response?.data?.message,
        fullError: error?.message,
      });
      const errorMessage = error?.response?.data?.message || error?.message || "Apple sign in failed.";
      setError(errorMessage);
    } finally {
      setAppleLoading(false);
    }
  };

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

                  <ErrorMessage message={error} />

                  <View style={styles.form}>
                    <AppInput
                      value={name}
                      onChangeText={setName}
                      placeholder="İsminizi girin"
                      keyboardType="default"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />

                    <AppInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="E-posta"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    
                    <AppInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Şifre"
                      secureTextEntry={!showPassword}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      showPasswordToggle
                      onPasswordToggle={() => setShowPassword(!showPassword)}
                      isPasswordVisible={showPassword}
                    />

                    <View style={{ marginTop: 8 }}>
                      <AppButton
                        title="Hesap Oluştur"
                        onPress={onRegister}
                        loading={registerLoading}
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