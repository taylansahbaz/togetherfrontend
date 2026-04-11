import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";
import WelcomeAuthScreen from "../screens/auth/WelcomeAuthScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WelcomeAuth" component={WelcomeAuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} /> 
      <Stack.Screen name="Register" component={WelcomeAuthScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

    </Stack.Navigator>
  );
}