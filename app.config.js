import 'dotenv/config';

export default {
  expo: {
    name: "socialmemory-mobile-clean",
    slug: "socialmemory-mobile-clean",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/applogo.png",
    scheme: "socialmemorymobileclean",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.taylansahbaz.together",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.taylansahbaz.together",
      config: {
        googleMaps: {
          apiKey: "AIzaSyCk0XzUBX1U2R7neSR2sJ0TI1TdjcOdx8U",
        },
      },
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/applogo.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.82196337840-6osckeja7f0n5g1lvra2ptqc2jvo7bio",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "@react-native-community/datetimepicker",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      googleWebClientId:
        "82196337840-dmpc6abrsc65io689tpk20rr9vu434r5.apps.googleusercontent.com",
      googleIosClientId:
        "82196337840-6osckeja7f0n5g1lvra2ptqc2jvo7bio.apps.googleusercontent.com",
      eas: {
        projectId: "3ba6b276-8e4c-4c4d-b7d0-4bc0301a4a3b",
      },
    },

    owner: "taylansahbaz02",
  },
};