import "react-native-gesture-handler";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider } from "./src/context/AlertContext";
import { AuthProvider } from "./src/context/AuthContext";
import { GroupProvider } from "./src/context/GroupContext";
import RootNavigator from "./src/navigation/RootNavigator";

function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AlertProvider>
                    <AuthProvider>
                        <GroupProvider>
                            <RootNavigator />
                        </GroupProvider>
                    </AuthProvider>
                </AlertProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

export default App;