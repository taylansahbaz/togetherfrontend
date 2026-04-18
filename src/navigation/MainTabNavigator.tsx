import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
// 1. Kütüphaneyi buraya ekledik
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Platform } from "react-native";
import CalendarScreen from '../screens/home/CalendarScreen';
import MapScreen from "../screens/map/MapScreen";
import HomeStackNavigator from "./HomeStackNavigator";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import WishlistStackNavigator from "./WishlistStackNavigator";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    // 2. Telefonun alt boşluğunu (sanal tuş yüksekliğini) alıyoruz
    const insets = useSafeAreaInsets(); 

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,

                // İKON AYARLARI
                tabBarIcon: ({ focused, color }) => {
                let iconName;
                    if (route.name === "HomeTab") {
                        iconName = focused ? "home" : "home-outline"; // İsteğe bağlı: Odaklanmadığında outline yapabilirsin
                    } else if (route.name === "CalendarTab") {
                        iconName = focused ? "calendar" : "calendar-outline";
                    } else if (route.name === "MapTab") {
                        iconName = focused ? "map" : "map-outline";
                    } else if (route.name === "WishlistTab") {
                        iconName = focused ? "heart" : "heart-outline";
                    } else if (route.name === "ProfileTab") {
                        iconName = focused ? "person" : "person-outline";
                    }

                    return <Ionicons name={iconName as any} size={25} color={color} style={{ marginBottom: 4 }} />;                },

                // RENK VE STİL AYARLARI
                tabBarActiveTintColor: "#ffffff",
                tabBarInactiveTintColor: "#d6cfcf",
                tabBarStyle: {
                    backgroundColor: '#001223da', 
                    borderTopWidth: 0, // Üstteki o ince gri çizgiyi siler, çok daha şık durur
                    elevation: 15, // Android için yukarı doğru hafif gölge
                    shadowColor: '#000', // iOS için gölge ayarları
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    height: Platform.OS === 'ios' ? 85 : 65, 
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 10, // iOS'ta güvenli alan boşluğu + ekstra 10, Android'de sadece 10
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                    marginBottom: -2, 
                }
            })}
        >
            <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ tabBarLabel: 'Takvim' }} />
            <Tab.Screen name="MapTab" component={MapScreen} options={{ title: "Harita" }} />
            <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Geçmiş" }} />
            <Tab.Screen name="WishlistTab" component={WishlistStackNavigator} options={{ title: "Planlar" }} />
            <Tab.Screen 
                name="ProfileTab" 
                component={ProfileStackNavigator} 
                options={{ tabBarLabel: "Profil" }} 
                listeners={({ navigation }) => ({
                    tabPress: () => {
                        navigation.navigate("ProfileTab", {screen: "ProfileHome"}); 
                    }, 
                })} 
            />
        </Tab.Navigator>
    );
}