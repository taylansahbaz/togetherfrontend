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
                        iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "CalendarTab") {
                        iconName = focused ? "calendar" : "calendar-outline";
                    } else if (route.name === "MapTab") {
                        iconName = focused ? "map" : "map-outline";
                    } else if (route.name === "WishlistTab") {
                        iconName = focused ? "heart" : "heart-outline";
                    } else if (route.name === "ProfileTab") {
                        iconName = focused ? "person" : "person-outline";
                    }

                    return <Ionicons name={iconName as any} size={26} color={color} style={{ marginBottom: 4 }} />;
                },

                // RENK VE STİL AYARLARI
                tabBarActiveTintColor: "#2F7E8D",
                tabBarInactiveTintColor: "#8aa0b2",
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    borderTopWidth: 0,

                    height: 60, // Toplam yüksekliği 60 yaptık
                    paddingBottom: 0, // Alt boşluğu azalttık ki yazılar rahatça sığsın
                    paddingTop: 8, // Üstten hafif boşluk

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
            <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ tabBarLabel: 'Calendar' }} />
            <Tab.Screen name="MapTab" component={MapScreen} options={{ title: "Map" }} />
            <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Home" }} />
            <Tab.Screen name="WishlistTab" component={WishlistStackNavigator} options={{ title: "Wishlist" }} />
           <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ tabBarLabel: 'Profil' }} />
        </Tab.Navigator>
    );
}