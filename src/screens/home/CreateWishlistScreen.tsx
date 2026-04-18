import CustomAlert from "@/src/components/common/CustomAlert";
import CategoryPicker from "@/src/components/place/CategoryPicker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useSelectedGroup } from "../../hooks/useSelectedGroup";
import { getApiErrorMessage } from "../../utils/helpers";
import { mapGoogleTypeToCategoryValue } from "../../utils/placeCategories";

const colors = {
  overlay: "rgba(255, 248, 246, 0.78)",
  text: "#24324A",
  muted: "#525a67",
  white: "#FFFFFF",
  primary: "#aa7b7b",
  primaryDark: "#D96C8B",
  secondary: "#F6C7B6",
  secondaryDark: "#D78668",
  card: "rgba(255,255,255,0.72)",
  cardBorder: "rgba(255,255,255,0.68)",
  input: "rgba(255, 244, 246, 0.95)",
  inputBorder: "rgba(245,140,168,0.15)",
  softPink: "rgba(245,140,168,0.14)",
  softPeach: "rgba(246,199,182,0.20)",
  chipPinkBg: "#FFE4EA",
  chipPinkText: "#C85E7C",
  chipPeachBg: "#FFF1E8",
  chipPeachText: "#D17B5F",
  shadow: "#E7A1B5",
};

const sectionCardStyle = {
  backgroundColor: colors.card,
  borderRadius: 28,
  paddingHorizontal: 12,
  paddingTop: 10,
  paddingBottom: 10,
  marginBottom: 10,
  marginTop: 0,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 4,
};

type AlertType = "info" | "success" | "danger";

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  confirmText: string;
  cancelText: string;
  showCancelButton: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
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
          backgroundColor: colors.softPink,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: "#525a67",
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              marginTop: 3,
              fontSize: 12,
              color: "#525a67",
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
      paddingHorizontal: 12,
      paddingVertical: multiline ? 14 : 8,
      marginBottom: 10,
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.softPink,
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
      placeholderTextColor="#525a67"
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
        backgroundColor: colors.softPink,
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
        Planladığın Tarih
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: value ? "#3a4049" : "#A0AABD",
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

    <Ionicons name="chevron-forward" size={18} color="#B7C1CD" />
  </Pressable>
);

export default function CreateWishlistScreen({ navigation, route }: any) {
  const { selectedGroupId } = useSelectedGroup();

  const editPlaceId = route.params?.editPlaceId;
  const placeData = route.params?.placeData;

  const defaultDate = route.params?.defaultDate || "";
  const formattedInitialDate = placeData?.visitDate
    ? new Date(placeData.visitDate).toISOString().split("T")[0]
    : defaultDate;

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

  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "Tamam",
    cancelText: "İptal",
    showCancelButton: false,
  });

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const hideAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const showAlert = ({
    title,
    message,
    type = "info",
    confirmText = "Tamam",
    cancelText = "İptal",
    showCancelButton = false,
    onConfirm,
    onCancel,
  }: {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    showCancelButton?: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
  }) => {
    setAlertState({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancelButton,
      onConfirm,
      onCancel,
    });
  };

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

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      fetchPredictions(text);
    }, 500);
  };

  const handleSelectPrediction = async (placeId: string, mainText: string) => {
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
        showAlert({
          title: "Hata",
          message:
            rawText ||
            `Google Place detayları alınamadı. (${response.status})`,
          type: "danger",
        });
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
    } catch (error: any) {
      showAlert({
        title: "Hata",
        message:
          error?.message || "Mekan bilgileri alınırken bir sorun oluştu.",
        type: "danger",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setVisitDate(formatDateToInput(selectedDate));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert({
        title: "Hata",
        message: "Lütfen bir mekan seçin veya başlık girin.",
        type: "danger",
      });
      return;
    }

    const formattedTitle = toTitleCase(title);
    const formattedCity = toTitleCase(city);
    const formattedCategory = toTitleCase(category);

    let finalVisitDate = null;

    if (visitDate.trim() !== "") {
      const dateObj = new Date(visitDate.trim());

      if (!isNaN(dateObj.getTime())) {
        finalVisitDate = dateObj.toISOString();
      } else {
        showAlert({
          title: "Uyarı",
          message: "Geçerli bir tarih seçin ya da tarihi boş bırakın.",
          type: "info",
        });
        return;
      }
    }

    try {
      setIsSaving(true);

      if (editPlaceId) {
        await updatePlace(editPlaceId, {
          title: formattedTitle,
          category: formattedCategory,
          city: formattedCity,
          address,
          latitude: latitude ? parseFloat(latitude) : 0,
          longitude: longitude ? parseFloat(longitude) : 0,
          visitDate: finalVisitDate,
          description,
        });
      } else {
        if (!selectedGroupId) {
          setIsSaving(false);
          showAlert({
              title: "Grup Seçilmedi",
              message: "Lütfen bir grup seçin.",
              type: "info",
              confirmText: "Tamam",
              onConfirm: () => {
                navigation.navigate("GroupListScreen"); 
              }
            });
          return;
        }

        const payload: any = {
          groupId: selectedGroupId,
          title: formattedTitle,
          category: formattedCategory,
          city: formattedCity,
          address,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          status: 1,
          visitDate: finalVisitDate,
          description,
        };

        await api.post("/Places/CreatePlace", payload);
      }

      showAlert({
        title: "Harika!",
        message: editPlaceId
          ? "Wish Day planı başarıyla güncellendi."
          : "Wish Day planı başarıyla oluşturuldu.",
        type: "success",
        onConfirm: () => {
          navigation.goBack();
        },
      });
    } catch (err) {
      showAlert({
        title: "Hata",
        message: getApiErrorMessage(err),
        type: "danger",
      });
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
                  colors={["rgba(255,255,255,0.72)", "rgba(255,239,242,0.92)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 30,
                    paddingBottom: 10,
                    paddingHorizontal: 15,
                    paddingTop: 10,
                    marginBottom: 0,
                    marginTop: 12,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.70)",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: -35,
                      right: -20,
                      width: 140,
                      height: 140,
                      borderRadius: 50,
                      backgroundColor: "rgba(140, 245, 180, 0.34)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: -25,
                      left: -10,
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: "rgba(246,199,182,0.24)",
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
                        backgroundColor: "rgba(140, 205, 245, 0.29)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 14,
                      }}
                    >
                      <Ionicons
                        name="sparkles"
                        size={26}
                        color={"rgba(51, 120, 164, 0.45)"}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: "900",
                          color: "#aa7b7b",
                          lineHeight: 32,
                        }}
                      >
                        {editPlaceId ? "Wish Day Düzenle" : "Wish Day Planla"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {!editPlaceId && (
                  <View style={{ zIndex: 9999, marginTop: 8, marginBottom: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.input,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: "rgba(245,140,168,0.18)",
                        paddingHorizontal: 14,
                        minHeight: 58,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: colors.softPink,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="search"
                          size={17}
                          color={colors.primary}
                        />
                      </View>

                      <TextInput
                        placeholder="Gitmek istediğin yeri yaz, biz bulalım..."
                        placeholderTextColor="#8E9AA5"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        style={{
                          flex: 1,
                          height: 50,
                          fontSize: 14,
                          color: colors.text,
                          fontWeight: title ? "700" : "500",
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
                              borderBottomColor: "#F3F4F6",
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "rgba(245,140,168,0.12)",
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
                              color="#BDC6D1"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <View style={sectionCardStyle}>
                  <SectionTitle
                    icon="bookmark-outline"
                    title="Kategori Seç"
                  />

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ marginBottom: 14 }}>
                      <CategoryPicker
                        value={category}
                        onChange={setCategory}
                      />
                    </View>
                  </View>
                </View>

                <View style={sectionCardStyle}>
                  <DatePickerField
                    value={visitDate}
                    onPress={openDatePicker}
                    onClear={() => setVisitDate("")}
                  />

                  <FormField
                    icon="document-text-outline"
                    placeholder="Eklemek istediğin bir not..."
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                  />
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={isSaving}
                  style={{
                    borderRadius: 22,
                    overflow: "hidden",
                    marginTop: 0,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.28,
                    shadowRadius: 16,
                    elevation: 7,
                    opacity: isSaving ? 0.72 : 1,
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, "#E97D9C"]}
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
                        <Ionicons name="heart" size={18} color={colors.white} />
                        <Text
                          style={{
                            marginLeft: 8,
                            color: colors.white,
                            fontSize: 16,
                            fontWeight: "900",
                          }}
                        >
                          {editPlaceId ? "Değişiklikleri Kaydet" : "Wish Day Oluştur"}
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
                            İptal
                          </Text>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 15,
                            fontWeight: "800",
                          }}
                        >
                          Tarih Seçin
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
                            Tamam
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <DateTimePicker
                        value={parseInputDate(visitDate)}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        themeVariant="light"
                        textColor="#1F2937"
                        style={{
                          backgroundColor: "#fff",
                          height: 180,
                        }}
                      />
                    </View>
                  </View>
                </Modal>
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </ImageBackground>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancelButton={alertState.showCancelButton}
        onConfirm={async () => {
          const callback = alertState.onConfirm;
          hideAlert();
          await callback?.();
        }}
        onCancel={async () => {
          const callback = alertState.onCancel;
          hideAlert();
          await callback?.();
        }}
      />
    </View>
  );
}