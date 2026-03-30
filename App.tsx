import "react-native-gesture-handler";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { GroupProvider } from "./src/context/GroupContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <GroupProvider>
                    <RootNavigator />
                </GroupProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}