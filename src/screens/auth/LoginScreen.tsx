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
  Text, // YENİ: Image bileşeni eklendi
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
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
      // 3. HATA MESAJI O SPESİFİK MESAJ İSE:
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
                              // Sadece arka planda bir hata olursa kullanıcıyı uyar
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
        source={require("../../../assets/images/login-bg.png")} 
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
                  paddingBottom: height * 0.25, 
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
                  {/* LOGO */}
                  <Image 
                    source={require("../../../assets/images/logoyazisiz.png")} // Logonun ismini klasöründekiyle eşleşecek şekilde değiştir
                    style={{
                      
                      width: 350, // Logonun genişliği
                      height: 350, // Logonun yüksekliği
                      resizeMode: "contain", // Logonun oranlarını bozmadan sığdırır
                      marginTop: -40, // Logoyu yukarı kaydırarak başlığa daha yakın hale getiri
                      marginBottom: 80,
                      opacity: 0.8,
                    }}
                  />

                  {/* ALT BAŞLIK */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500", 
                      color: "rgba(255, 255, 255, 0.8)",
                      marginTop: -75,
                      marginBottom: 100,
                      letterSpacing: 0.5,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    Continue to your shared memories
                  </Text>

                  <ErrorMessage message={error} />

                  {/* INPUTLAR */}
                  <View style={{ width: "100%" }}>
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
                        onPress={onLogin}
                        loading={loading}
                      />
                    </View>

                    {/* REGISTER LİNKİ */}
                    <Pressable
                      onPress={() => navigation.navigate("Register")}
                      style={{ marginTop: 30, alignSelf: "center", padding: 10 }}
                    >
                      <Text
                        style={{
                          fontSize: 21,
                          fontWeight: "400",
                          color: "rgba(255, 255, 255, 0.9)",
                          textAlign: "center",
                        }}
                      >
                        Don't have an account?{" "}
                         <Text style={{ color: "#F4E7A1" }}>Sign Up</Text>
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