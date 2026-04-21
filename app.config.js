import 'dotenv/config';

export default {
  expo: {
    name: "Lets Together",
    slug: "lets-together",
    version: "1.0.13",
    orientation: "portrait",
    icon: "./assets/images/applogo.png",
    scheme: "lets-together",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      buildNumber: "1.0.13",
      bundleIdentifier: "com.taylansahbaz.letstogether",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: ["comgooglemaps", "waze"],
        NSPhotoLibraryAddUsageDescription:
          "Fotoğrafları galerinize kaydetmek için izin gerekir.",
      },
    },

    android: {
      package: "com.taylansahbaz.letstogether",
      versionCode: 13,
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
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          icon: "./assets/images/applogo.png",
          color: "#2F7E8D",
          defaultChannel: "default",
          sounds: [],
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission:
            "Uygulamanın fotoğraflarınıza erişmesine izin verin.",
          savePhotosPermission:
            "Uygulamanın fotoğrafları cihazınıza kaydetmesine izin verin.",
          isAccessMediaLocationEnabled: false,
        },
      ],
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
        projectId: "48ceb32d-e3a4-42da-842a-9491623ac78e"
      },
    },

    owner: "taylansahbaz02",
  },
};