import React from "react";
import { Image, View } from "react-native";

interface HeaderLogoProps {
    size?: number;
    lightMode?: boolean; // Profil ekranı gibi koyu arka planlarda logoyu daha açık göstermek istersen diye
}

export default function HeaderLogo({ size = 45, lightMode = false }: HeaderLogoProps) {
    return (
        <View style={{ 
            width: size, 
            height: size, 
            justifyContent: "center", 
            alignItems: "center",
            opacity: lightMode ? 0.9 : 1
        }}>
            <Image 
                source={require("../../../assets/images/logo.png")} 
                style={{ 
                    width: "100%", 
                    height: "100%", 
                    resizeMode: "contain",
                    // Eğer logonun siyah versiyonu koyu arka planda kayboluyorsa tintColor ile beyaza boyayabilirsin:
                    // tintColor: lightMode ? "#ffffff" : undefined 
                }} 
            />
        </View>
    );
}