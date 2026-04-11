import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import CalendarScreen from '../screens/home/CalendarScreen';
import MapScreen from "../screens/map/MapScreen";
import HomeStackNavigator from "./HomeStackNavigator";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import WishlistStackNavigator from "./WishlistStackNavigator";
const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,

                // İKON AYARLARI
                tabBarIcon: ({ focused, color }) => {
                    let iconName;

                    if (route.name === "HomeTab") {
                        iconName = focused ? "home" : "home";
                    } else if (route.name === "CalendarTab") {
                        iconName = focused ? "calendar" : "calendar";
                    } else if (route.name === "MapTab") {
                        iconName = focused ? "map" : "map";
                    } else if (route.name === "WishlistTab") {
                        iconName = focused ? "heart" : "heart";
                    } else if (route.name === "ProfileTab") {
                        iconName = focused ? "person" : "person";
                    }

                    return <Ionicons name={iconName as any} size={25} color={color} style={{ marginBottom: 4 }} />;
                },

                // RENK VE STİL AYARLARI
                tabBarActiveTintColor: "#2F7E8D",
                tabBarInactiveTintColor: "#8aa0b2",
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    borderTopWidth: 0,

                    height: 55, // Toplam yüksekliği 60 yaptık
                    paddingBottom: 0, // Alt boşluğu azalttık ki yazılar rahatça sığsın
                    paddingTop: 2, // Üstten hafif boşluk
                    paddingHorizontal: 8, // Yatayda biraz boşluk
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
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ tabBarLabel: "Profil" }} listeners={({ navigation }) => ({tabPress: () => {navigation.navigate("ProfileTab", {screen: "ProfileHome", }); }, })} />
        </Tab.Navigator>
    );
}