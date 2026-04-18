import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";


export function getApiErrorMessage(error: any): string {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong."
    );
}

export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log("Invalid JWT format - expected 3 parts");
      return null;
    }

    let payload = parts[1];
    
    // Base64 URL decode
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padding = payload.length % 4;
    if (padding) {
      payload += '='.repeat(4 - padding);
    }

    try {
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      console.log("Failed to use atob, trying alternative method");
      // Fallback
      return null;
    }
  } catch (error) {
    console.log("Failed to decode JWT:", error);
    return null;
  }
}

let configured = false;

export function configureGoogleSignin() {
  if (configured) return;

  const extra = Constants.expoConfig?.extra as {
    googleWebClientId?: string;
    googleIosClientId?: string;
  };

  GoogleSignin.configure({
    webClientId: extra?.googleWebClientId,
    iosClientId: extra?.googleIosClientId,
  });

  configured = true;
}