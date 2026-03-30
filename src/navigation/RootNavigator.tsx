import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import AppStackNavigator from "./AppStackNavigator";
import AuthNavigator from "./AuthNavigator";

export default function RootNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AppStackNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}