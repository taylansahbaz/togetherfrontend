import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
// 1. Kütüphaneyi buraya ekledik
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
                tabBarActiveTintColor: "#2F7E8D",
                tabBarInactiveTintColor: "#8aa0b2",
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    borderTopWidth: 0,
                    
                    // 3. İŞTE SİHİRLİ KISIM BURASI:
                    // Temel yüksekliğimiz 55, üzerine telefonun sanal tuş yüksekliğini (insets.bottom) ekliyoruz.
                    height: 55 + insets.bottom, 
                    // Alt boşluğu da sadece sanal tuş varsa veriyoruz, yoksa (eski telefonlarda) 5px veriyoruz.
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 5, 
                    
                    paddingTop: 5, 
                    paddingHorizontal: 8,
                    elevation: 0,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
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
            <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Ana Sayfa" }} />
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