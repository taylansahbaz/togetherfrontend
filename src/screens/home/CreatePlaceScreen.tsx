import CategoryPicker from "@/src/components/place/CategoryPicker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { api } from "../../api/client";
import { updatePlace } from "../../api/places";
import { createReview } from "../../api/reviews";
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { PLACE_CATEGORIES } from "../../utils/constants";
import { getApiErrorMessage } from "../../utils/helpers";
import {
    mapCategoryValueToLabel,
    mapGoogleTypeToCategoryValue,
} from "../../utils/placeCategories";

const colors = {
  overlay: "rgba(255, 255, 227, 0.46)",
  text: "#4A4A4A",
  muted: "#7B7B7B",
  white: "#FFFFFF",

  primary: "#6D8196",
  primaryDark: "#5E7082",

  secondary: "#FFFFE3",
  secondaryDark: "#ECECCD",

  card: "rgba(255,255,255,0.78)",
  cardBorder: "rgba(203,203,203,0.52)",

  input: "rgba(109,129,150,0.08)",
  inputBorder: "rgba(109,129,150,0.14)",

  softBlue: "rgba(109,129,150,0.12)",
  softGray: "rgba(203,203,203,0.16)",
  softCream: "rgba(255,255,227,0.88)",

  chipBlueBg: "rgba(109,129,150,0.12)",
  chipBlueText: "#5E7082",

  chipCreamBg: "#FFFFE3",
  chipCreamText: "#7C7C5D",

  shadow: "rgba(74,74,74,0.14)",
  warning: "#D09A2D",
  danger: "#D66D6D",
};

const sectionCardStyle = {
  backgroundColor: colors.card,
  borderRadius: 28,
  paddingHorizontal: 12,
  paddingTop: 12,
  paddingBottom: 12,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .trim()
    .split(" ")
    .map((word) => {
      if (!word.length) return "";
      return (
        word.charAt(0).toLocaleUpperCase("tr-TR") +
        word.slice(1).toLocaleLowerCase("tr-TR")
      );
    })
    .join(" ");
};

const formatDateToInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string) => {
  if (!value) return new Date();
  const parts = value.split("-");
  if (parts.length !== 3) return new Date();
  const [year, month, day] = parts.map(Number);
  const parsed = new Date(year, month - 1, day);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const SectionTitle = ({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.softBlue,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: colors.text,
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              marginTop: 3,
              fontSize: 12,
              color: colors.muted,
              lineHeight: 17,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  </View>
);

const FormField = ({
  icon,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
  flex,
}: any) => (
  <View
    style={{
      flex,
      flexDirection: "row",
      alignItems: multiline ? "flex-start" : "center",
      backgroundColor: colors.input,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: 14,
      paddingVertical: multiline ? 14 : 8,
      marginBottom: 14,
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.softBlue,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        marginTop: multiline ? 2 : 0,
      }}
    >
      <Ionicons name={icon} size={17} color={colors.primaryDark} />
    </View>

    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#8E9AA5"
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      style={{
        flex: 1,
        color: colors.text,
        fontSize: 15,
        height: multiline ? 96 : 42,
        textAlignVertical: multiline ? "top" : "center",
      }}
    />
  </View>
);

const InfoChip = ({
  text,
  variant = "blue",
}: {
  text: string;
  variant?: "blue" | "cream";
}) => (
  <View
    style={{
      backgroundColor:
        variant === "blue" ? colors.chipBlueBg : colors.chipCreamBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        color:
          variant === "blue" ? colors.chipBlueText : colors.chipCreamText,
      }}
    >
      {text}
    </Text>
  </View>
);

const DatePickerField = ({
  value,
  onPress,
  onClear,
}: {
  value: string;
  onPress: () => void;
  onClear: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.input,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.softBlue,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
      }}
    >
      <Ionicons name="calendar-outline" size={17} color={colors.primaryDark} />
    </View>

    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 11,
          color: colors.muted,
          marginBottom: 3,
          fontWeight: "700",
        }}
      >
        Visit Date
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: value ? colors.text : "#8E9AA5",
          fontWeight: value ? "700" : "500",
        }}
      >
        {value || "Select a date"}
      </Text>
    </View>

    {value ? (
      <TouchableOpacity
        onPress={onClear}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.8)",
          marginRight: 6,
        }}
      >
        <Ionicons name="close" size={16} color={colors.primaryDark} />
      </TouchableOpacity>
    ) : null}

    <Ionicons name="chevron-forward" size={18} color="#A8B3BD" />
  </Pressable>
);

const StarRating = ({
  score,
  setScore,
}: {
  score: number;
  setScore: (value: number) => void;
}) => {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: colors.text,
          }}
        >
          Quick Review
        </Text>

        {score > 0 && (
          <View
            style={{
              backgroundColor: "rgba(208,154,45,0.14)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                color: colors.warning,
                fontSize: 13,
                fontWeight: "900",
              }}
            >
              {score} / 10
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {[1, 2, 3, 4, 5].map((index) => {
          const starValue = index * 2;
          let iconName: any = "star-outline";

          if (score >= starValue) iconName = "star";
          else if (score === starValue - 1) iconName = "star-half";

          return (
            <View key={index} style={{ position: "relative" }}>
              <Ionicons
                name={iconName}
                size={34}
                color={score >= starValue - 1 ? colors.warning : "#D8DDE2"}
              />

              <TouchableOpacity
                style={{
                  position: "absolute",
                  left: 0,
                  width: "50%",
                  height: "100%",
                }}
                onPress={() => setScore(starValue - 1)}
                activeOpacity={1}
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 0,
                  width: "50%",
                  height: "100%",
                }}
                onPress={() => setScore(starValue)}
                activeOpacity={1}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default function CreatePlaceScreen({ navigation, route }: any) {
  const { selectedGroupId } = useSelectedGroup();

  const editPlaceId = route.params?.editPlaceId;
  const placeData = route.params?.placeData;
  const initialStatus = route.params?.initialStatus || 1;

  const isVisitedPlace = editPlaceId
    ? placeData?.status === 2 || !!placeData?.visitDate
    : initialStatus === 2;

  const formattedInitialDate = placeData?.visitDate
    ? new Date(placeData.visitDate).toISOString().split("T")[0]
    : "";

  const [title, setTitle] = useState(placeData?.title || "");
  const [category, setCategory] = useState(placeData?.category || "");
  const [city, setCity] = useState(placeData?.city || "");
  const [address, setAddress] = useState(placeData?.address || "");
  const [latitude, setLatitude] = useState(
    placeData?.latitude ? String(placeData.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    placeData?.longitude ? String(placeData.longitude) : ""
  );
  const [visitDate, setVisitDate] = useState(formattedInitialDate);
  const [description, setDescription] = useState(placeData?.description || "");

  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean>(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const selectedCategoryItem = PLACE_CATEGORIES.find(
    (item) => item.value === category
  );

  const previewTitle = useMemo(() => title?.trim(), [title]);

  const fetchPredictions = async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY || "",
          },
          body: JSON.stringify({
            input,
            languageCode: "tr",
          }),
        }
      );

      const data = await response.json();

      if (data.suggestions) {
        const formattedPredictions = data.suggestions
          .map((suggestionItem: any) => {
            const prediction = suggestionItem.placePrediction;
            if (!prediction) return null;

            return {
              placeId:
                prediction.placeId ||
                prediction.place?.replace("places/", "") ||
                "",
              text: prediction.text?.text || "",
              mainText:
                prediction.structuredFormat?.mainText?.text ||
                "Bilinmeyen Mekan",
              secondaryText:
                prediction.structuredFormat?.secondaryText?.text || "",
            };
          })
          .filter(Boolean);

        setPredictions(formattedPredictions);
        setShowDropdown(true);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Autocomplete Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      fetchPredictions(text);
    }, 500);
  };

  const handleSelectPrediction = async (
    placeId: string,
    mainText: string
  ) => {
    setSearchQuery(mainText);
    setShowDropdown(false);
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`,
        {
          method: "GET",
          headers: {
            "X-Goog-Api-Key": API_KEY || "",
            "X-Goog-FieldMask":
              "id,displayName,formattedAddress,location,addressComponents,types",
          },
        }
      );

      const rawText = await response.text();

      if (!response.ok) {
        Alert.alert("Hata", "Mekan detayları alınırken bir sorun oluştu.");
        setIsSearching(false);
        return;
      }

      const details = JSON.parse(rawText);

      setTitle(
        details.displayName?.text
          ? toTitleCase(details.displayName.text)
          : mainText
      );
      setAddress(details.formattedAddress || "");

      if (details.location) {
        setLatitude(String(details.location.latitude));
        setLongitude(String(details.location.longitude));
      }

      if (details.addressComponents) {
        const cityComponent = details.addressComponents.find(
          (c: any) =>
            c.types.includes("administrative_area_level_1") ||
            c.types.includes("locality")
        );

        if (cityComponent) {
          setCity(toTitleCase(cityComponent.longText));
        }
      }

      if (details.types && details.types.length > 0) {
        const mappedCategory = mapGoogleTypeToCategoryValue(details.types[0]);
        setCategory(mappedCategory);
      }
    } catch (error) {
      Alert.alert("Hata", "Mekan detayları okunamadı.");
    } finally {
      setIsSearching(false);
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: parseInputDate(visitDate),
        mode: "date",
        is24Hour: true,
        onChange: (_event, selectedDate) => {
          if (selectedDate) {
            setVisitDate(formatDateToInput(selectedDate));
          }
        },
      });
      return;
    }

    setShowDatePicker(true);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setVisitDate(formatDateToInput(selectedDate));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newUris].slice(0, 5));
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Hata", "Lütfen bir mekan seçin veya başlık girin.");
      return;
    }

    const formattedTitle = toTitleCase(title);
    const formattedCity = toTitleCase(city);

    const categoryLabel =
      mapCategoryValueToLabel?.(category) || toTitleCase(category);

    let finalVisitDate = null;

    if (isVisitedPlace) {
      if (visitDate.trim() !== "") {
        const dateObj = new Date(visitDate.trim());

        if (!isNaN(dateObj.getTime())) {
          finalVisitDate = dateObj.toISOString();
        } else {
          Alert.alert("Uyarı", "Geçerli bir tarih seçin.");
          return;
        }
      } else {
        finalVisitDate = new Date().toISOString();
      }
    }

    try {
      setIsSaving(true);
      let createdPlaceId = editPlaceId;

      if (editPlaceId) {
        await updatePlace(editPlaceId, {
          title: formattedTitle,
          category: categoryLabel,
          city: formattedCity,
          address,
          latitude: latitude ? parseFloat(latitude) : 0,
          longitude: longitude ? parseFloat(longitude) : 0,
          visitDate: finalVisitDate,
          description,
        });
      } else {
        if (!selectedGroupId) {
          Alert.alert("Hata", "Lütfen bir grup seçin.");
          return;
        }

        const payload: any = {
          groupId: selectedGroupId,
          title: formattedTitle,
          category: categoryLabel,
          city: formattedCity,
          address,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          status: initialStatus,
          description,
        };

        if (initialStatus === 2) {
          payload.visitDate = finalVisitDate;
        }

        const response = await api.post("/Places/CreatePlace", payload);
        createdPlaceId = response.data.data.id;
      }

      if (isVisitedPlace && score > 0 && createdPlaceId) {
        await createReview({
          placeId: createdPlaceId,
          rating: score,
          comment,
          wouldGoAgain,
        });
      }

      if (isVisitedPlace && selectedImages.length > 0 && createdPlaceId) {
        for (const uri of selectedImages) {
          const formData = new FormData();

          formData.append(
            "file",
            {
              uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
              name: `photo_${Date.now()}.jpg`,
              type: "image/jpeg",
            } as any
          );

          formData.append("placeId", createdPlaceId);

          await api.post("/PlacePhotos/Upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      Alert.alert("Başarılı", "Mekan kaydedildi.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Hata", getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../../assets/images/home-bg.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  paddingBottom: 120,
                }}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.84)", "rgba(255,255,227,0.94)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 30,
                    padding: 22,
                    marginBottom: 0,
                    marginTop: 12,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(203,203,203,0.46)",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: -32,
                      right: -18,
                      width: 130,
                      height: 130,
                      borderRadius: 65,
                      backgroundColor: "rgba(109,129,150,0.10)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: -18,
                      left: -8,
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      backgroundColor: "rgba(255,255,227,0.96)",
                    }}
                  />

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: "rgba(109,129,150,0.14)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 14,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={26}
                        color={colors.primaryDark}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: "900",
                          color: colors.text,
                          lineHeight: 32,
                        }}
                      >
                        {editPlaceId ? "Edit Memory" : "New Memory"}
                      </Text>
                      <Text
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: colors.muted,
                          lineHeight: 18,
                        }}
                      >
                        {isVisitedPlace
                          ? "Log your experience with details, photos and rating."
                          : "Save a place to remember later."}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {!editPlaceId && (
                  <View style={{ zIndex: 9999, marginTop: 10, marginBottom: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.input,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: colors.inputBorder,
                        paddingHorizontal: 14,
                        minHeight: 58,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: colors.softBlue,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="search"
                          size={17}
                          color={colors.primaryDark}
                        />
                      </View>

                      <TextInput
                        placeholder="Search a cafe, restaurant, park..."
                        placeholderTextColor="#8E9AA5"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        style={{
                          flex: 1,
                          height: 54,
                          fontSize: 15,
                          color: colors.text,
                        }}
                      />

                      {isSearching && (
                        <ActivityIndicator
                          size="small"
                          color={colors.primaryDark}
                        />
                      )}

                      {searchQuery.length > 0 && !isSearching && (
                        <TouchableOpacity
                          onPress={() => {
                            setSearchQuery("");
                            setPredictions([]);
                            setShowDropdown(false);
                          }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={colors.primaryDark}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {showDropdown && predictions.length > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: 66,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(255,255,255,0.98)",
                          borderRadius: 20,
                          padding: 8,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.14,
                          shadowRadius: 18,
                          elevation: 10,
                          zIndex: 10000,
                        }}
                      >
                        {predictions.map((item, index) => (
                          <TouchableOpacity
                            key={`${item.placeId}-${index}`}
                            onPress={() =>
                              handleSelectPrediction(item.placeId, item.mainText)
                            }
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 12,
                              paddingHorizontal: 12,
                              borderBottomWidth:
                                index === predictions.length - 1 ? 0 : 1,
                              borderBottomColor: "#EEF1F4",
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: colors.softBlue,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 12,
                              }}
                            >
                              <Ionicons
                                name="location"
                                size={18}
                                color={colors.primaryDark}
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "800",
                                  color: colors.text,
                                }}
                              >
                                {item.mainText}
                              </Text>

                              {item.secondaryText ? (
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    marginTop: 2,
                                    fontSize: 13,
                                    color: colors.muted,
                                  }}
                                >
                                  {item.secondaryText}
                                </Text>
                              ) : null}
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color="#A9B4BE"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <View style={sectionCardStyle}>
                  <SectionTitle
                    icon="grid-outline"
                    title="Kategori Seç"
                    subtitle="Mekana en uygun kategoriyi seç."
                  />

                  {previewTitle ? (
                    <View
                      style={{
                        backgroundColor: "rgba(109,129,150,0.08)",
                        borderRadius: 20,
                        padding: 15,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: "rgba(109,129,150,0.14)",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: "rgba(255,255,255,0.82)",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 12,
                          }}
                        >
                          {selectedCategoryItem ? (
                            <Image
                              source={selectedCategoryItem.image}
                              resizeMode="contain"
                              style={{ width: 24, height: 24 }}
                            />
                          ) : (
                            <Ionicons
                              name="location"
                              size={18}
                              color={colors.primaryDark}
                            />
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: "900",
                              color: colors.text,
                            }}
                          >
                            {title}
                          </Text>

                          {!!address && (
                            <Text
                              numberOfLines={2}
                              style={{
                                marginTop: 5,
                                fontSize: 13,
                                color: colors.muted,
                                lineHeight: 18,
                              }}
                            >
                              {address}
                            </Text>
                          )}

                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginTop: 10,
                            }}
                          >
                            {!!category && (
                              <InfoChip
                                text={
                                  mapCategoryValueToLabel?.(category) || category
                                }
                                variant="blue"
                              />
                            )}
                            {!!city && <InfoChip text={city} variant="cream" />}
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  <CategoryPicker value={category} onChange={setCategory} />
                </View>

                {isVisitedPlace && (
                  <>
                    <View style={sectionCardStyle}>
                      <SectionTitle
                        icon="calendar-outline"
                        title="Visit Date"
                        subtitle="Leave empty to use today."
                      />

                      <DatePickerField
                        value={visitDate}
                        onPress={openDatePicker}
                        onClear={() => setVisitDate("")}
                      />
                    </View>

                    <View style={sectionCardStyle}>
                      <SectionTitle
                        icon="images-outline"
                        title="Photos"
                        subtitle="You can add up to 5 photos."
                      />

                      <TouchableOpacity
                        onPress={pickImage}
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: colors.softBlue,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 999,
                          marginBottom: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primaryDark,
                            fontWeight: "800",
                            fontSize: 13,
                          }}
                        >
                          + Add Photos
                        </Text>
                      </TouchableOpacity>

                      {selectedImages.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: 10, paddingRight: 8 }}
                        >
                          {selectedImages.map((uri, index) => (
                            <View key={index} style={{ position: "relative" }}>
                              <Image
                                source={{ uri }}
                                style={{
                                  width: 84,
                                  height: 84,
                                  borderRadius: 18,
                                }}
                              />

                              <TouchableOpacity
                                onPress={() => removeImage(index)}
                                style={{
                                  position: "absolute",
                                  top: -5,
                                  right: -5,
                                  backgroundColor: colors.danger,
                                  borderRadius: 12,
                                  width: 24,
                                  height: 24,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  borderWidth: 2,
                                  borderColor: "white",
                                }}
                              >
                                <Ionicons
                                  name="close"
                                  size={14}
                                  color="white"
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <Text
                          style={{
                            color: "#8E9AA5",
                            fontSize: 13,
                            fontStyle: "italic",
                          }}
                        >
                          No photos selected yet.
                        </Text>
                      )}
                    </View>

                    {!editPlaceId && (
                      <View style={sectionCardStyle}>
                        <SectionTitle
                          icon="star-outline"
                          title="Quick Review"
                          subtitle="Optional rating and short comment."
                        />

                        <StarRating score={score} setScore={setScore} />

                        <FormField
                          icon="chatbubble-outline"
                          placeholder="Write your experience..."
                          value={comment}
                          onChangeText={setComment}
                          multiline={true}
                        />

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: colors.input,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: colors.inputBorder,
                            paddingHorizontal: 14,
                            paddingVertical: 14,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              flex: 1,
                            }}
                          >
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 17,
                                backgroundColor: colors.softBlue,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 10,
                              }}
                            >
                              <Ionicons
                                name="refresh-outline"
                                size={17}
                                color={colors.primaryDark}
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "800",
                                  color: colors.text,
                                }}
                              >
                                Would go again
                              </Text>
                              <Text
                                style={{
                                  marginTop: 2,
                                  fontSize: 12,
                                  color: colors.muted,
                                }}
                              >
                                Save your personal opinion.
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            onPress={() => setWouldGoAgain(!wouldGoAgain)}
                            style={{
                              width: 56,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: wouldGoAgain
                                ? colors.primary
                                : "#D4DADF",
                              padding: 3,
                              justifyContent: "center",
                            }}
                          >
                            <View
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: "#fff",
                                alignSelf: wouldGoAgain
                                  ? "flex-end"
                                  : "flex-start",
                              }}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}

                <Pressable
                  onPress={handleSave}
                  disabled={isSaving}
                  style={{
                    borderRadius: 22,
                    overflow: "hidden",
                    marginTop: 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    elevation: 7,
                    opacity: isSaving ? 0.72 : 1,
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                    }}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.white}
                        />
                        <Text
                          style={{
                            marginLeft: 8,
                            color: colors.white,
                            fontSize: 16,
                            fontWeight: "900",
                          }}
                        >
                          {editPlaceId ? "Save Changes" : "Create Memory"}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </ScrollView>

              {showDatePicker && Platform.OS === "ios" && (
                <Modal
                  transparent={true}
                  animationType="slide"
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.25)",
                      justifyContent: "flex-end",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 16,
                        paddingBottom: 28,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text
                            style={{
                              color: colors.primaryDark,
                              fontSize: 15,
                              fontWeight: "700",
                            }}
                          >
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 15,
                            fontWeight: "800",
                          }}
                        >
                          Select Date
                        </Text>

                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text
                            style={{
                              color: colors.primaryDark,
                              fontSize: 15,
                              fontWeight: "700",
                            }}
                          >
                            Done
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <DateTimePicker
                        value={parseInputDate(visitDate)}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                      />
                    </View>
                  </View>
                </Modal>
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}