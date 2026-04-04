import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";


export function getApiErrorMessage(error: any): string {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong."
    );
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