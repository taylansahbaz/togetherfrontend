import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AccountSettingsScreen from "../screens/auth/AccountSettingsScreen";
import PlaceDetailScreen from "../screens/home/PlaceDetailScreen";
import MainTabNavigator from "./MainTabNavigator";

const Stack = createNativeStackNavigator();
    
export default function AppStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
        </Stack.Navigator>
    );
}