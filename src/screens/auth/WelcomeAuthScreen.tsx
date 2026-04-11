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

  const [error, setError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const logoWidth = Math.min(width * 0.72, 340);
  const logoHeight = logoWidth;

  useEffect(() => {
    configureGoogleSignin();
  }, []);

  const validate = () => {
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return false;
    }

    if (!email.trim()) {
      setError("Email cannot be empty.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Password cannot be empty.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const onRegister = async () => {
    if (!validate()) return;

    try {
      setError("");
      setRegisterLoading(true);

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigation.navigate("VerifyEmail", { email: email.trim() });
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
    } finally {
      setRegisterLoading(false);
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
      Alert.alert("Not available", "Apple sign in is only available on iOS.");
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

      await loginWithApple({
        idToken,
        fullName: fullName || null,
      });
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") return;
      setError(error?.message || "Apple sign in failed.");
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
                      marginTop: 20,
                      marginBottom: -10,
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
                                          placeholder="Email"
                                          keyboardType="email-address"
                                          autoCapitalize="none"
                                          autoCorrect={false}
                                        />
                    
                                        <AppInput
                                          value={password}
                                          onChangeText={setPassword}
                                          placeholder="Şifre"
                                          secureTextEntry
                                          keyboardType="default"
                                          autoCapitalize="none"
                                          autoCorrect={false}
                                        />

                    <View style={{ marginTop: 10 }}>
                      <AppButton
                        title="Hesap Oluştur"
                        onPress={onRegister}
                        loading={registerLoading}
                      />
                    </View>

                    <View style={styles.dividerWrapper}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                      style={styles.socialButton}
                      onPress={onGooglePress}
                      disabled={googleLoading}
                    >
                      <Ionicons name="logo-google" size={22} color="#fff" />
                      <Text style={styles.socialButtonText}>
                        {googleLoading ? "Please wait..." : "Google ile Kayıt Ol"}
                      </Text>
                    </Pressable>

                    {Platform.OS === "ios" && (
                      <Pressable
                        style={styles.socialButton}
                        onPress={onApplePress}
                        disabled={appleLoading}
                      >
                        <Ionicons name="logo-apple" size={24} color="#fff" />
                        <Text style={styles.socialButtonText}>
                          {appleLoading ? "Please wait..." : "Apple ile Kayıt Ol"}
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => navigation.navigate("Login")}
                      style={styles.loginLink}
                    >
                      <Text style={styles.loginText}>
                        Bir hesabın var mı {" "}
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
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    width: "100%",
    maxWidth: 470,
    alignItems: "center",
  },
  form: {
    width: "100%",
    marginTop: 6,
  },
  dividerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  socialButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: 8,
    alignSelf: "center",
    padding: 10,
  },
  loginText: {
    fontSize: 18,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  loginHighlight: {
    color: "#F4E7A1",
    fontWeight: "700",
  },
});