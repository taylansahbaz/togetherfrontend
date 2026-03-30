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
    View,
    useWindowDimensions
} from "react-native";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/helpers";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  
  // Ekran boyutlarını alıyoruz
  const { height, width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // YENİ EKLENDİ: Kayıt işlemi için boş alan ve format kontrolü
  const validate = () => {
    if (!name.trim()) {
      setError("Name cannot be empty."); // İsim boş olamaz
      return false;
    }

    if (!email.trim()) {
      setError("Email cannot be empty."); // Email boş olamaz
      return false;
    }
    
    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address."); // Geçerli email giriniz
      return false;
    }

    if (!password) {
      setError("Password cannot be empty."); // Şifre boş olamaz
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters."); // Şifre çok kısaysa uyar (C# backend genelde bunu ister)
      return false;
    }

    return true; // Hiçbir sorun yoksa devam et
  };

  const onRegister = async () => {
    // Doğrulama başarısızsa backend'e istek atmasını engelle
    if (!validate()) return;

    try {
      setError("");
      setLoading(true);
     // 1. AuthContext üzerinden backend'e kayıt isteğini atıyoruz
      await register({ name: name.trim(), email: email.trim(), password });
      // İşlem hata vermeden buraya kadar geldiyse kayıt başarılı demektir. Doğrulama ekranına yönlendiriyoruz:
      navigation.navigate("VerifyEmail", { email: email.trim() });
    } catch (err) {
      // Backend'den (helpers.ts üzerinden) gelen hatayı yakala ve ekranda göster
      const message = getApiErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, width, height }}>
      {/* BACKGROUND */}
      <ImageBackground
        source={require("../../../assets/images/login-bg.png")}
        resizeMode="cover"
        style={{ flex: 1, width: "100%", height: "100%" }}
      >
        {/* OVERLAY */}
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
                  paddingBottom: height * 0.25, // Formu karakterlerin yüzünden yukarı it
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
                                    source={require("../../../assets/images/logoyazisiz.png")} // Logonun ismini klasöründekiyle eşleşecek şekilde değiştir
                                    style={{
                                      
                                      width: 350, // Logonun genişliği
                                      height: 350, // Logonun yüksekliği
                                      resizeMode: "contain", // Logonun oranlarını bozmadan sığdırır
                                      marginTop: -60, // Logoyu yukarı kaydırarak başlığa daha yakın hale getiri
                                      marginBottom: 30,
                                      opacity: 0.8,
                                    }}
                                  />

                  {/* ALT BAŞLIK */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500", 
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: 40,
                      letterSpacing: 0.5,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    Create your account
                  </Text>

                  {/* HATA MESAJI KUTUSU */}
                  <ErrorMessage message={error} />

                  {/* INPUTLAR */}
                  <View style={{ width: "100%" }}>
                    <AppInput
                      label="Name"
                      value={name}
                      onChangeText={setName}
                      placeholder="Name"
                    />

                    <AppInput
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholder="Email"
                    />

                    <AppInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholder="Password"
                    />

                    <View style={{ marginTop: 10 }}>
                      <AppButton
                        title="Continue" 
                        onPress={onRegister}
                        loading={loading}
                      />
                    </View>

                    {/* LOGIN'E DÖNÜŞ LİNKİ */}
                    <Pressable
                      onPress={() => navigation.navigate("Login")}
                      style={{ marginTop: 30, alignSelf: "center", padding: 10 }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "200",
                          color: "rgba(255, 255, 255, 0.9)",
                          textAlign: "center",
                        }}
                      >
                        Already have an account? Login
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