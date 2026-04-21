import { ImageSourcePropType } from "react-native";
import { GroupselectedIconsJson } from "../types/group";

export const API_BASE_URL = "http://192.168.1.12:5183/api";
export const SUPPORT_EMAIL = "togetherappinfo@gmail.com";
export const STORAGE_KEYS = {
    token: "token",
    refreshToken: "refreshToken",
    selectedGroupId: "selectedGroupId",
} as const;

export const EN_PLACE_CATEGORIES = [
  { label: "Cafe", value: "cafe", icon: "cafe-outline" },
  { label: "Coffee", value: "coffee", icon: "cafe-outline" },
  { label: "Dessert", value: "dessert", icon: "ice-cream-outline" },
  { label: "Bakery", value: "bakery", icon: "ice-cream-outline" },
  { label: "Breakfast", value: "breakfast", icon: "restaurant-outline" },
  { label: "Brunch", value: "brunch", icon: "restaurant-outline" },
  { label: "Restaurant", value: "restaurant", icon: "restaurant-outline" },
  { label: "Fast Food", value: "fast_food", icon: "fast-food-outline" },
  { label: "Bar", value: "bar", icon: "wine-outline" },
  { label: "Pub", value: "pub", icon: "wine-outline" },
  { label: "Museum", value: "museum", icon: "library-outline" },
  { label: "Gallery", value: "gallery", icon: "library-outline" },
  { label: "Cinema", value: "cinema", icon: "film-outline" },
  { label: "Theatre", value: "theatre", icon: "musical-notes-outline" },
  { label: "Concert", value: "concert", icon: "musical-notes-outline" },
  { label: "Shopping", value: "shopping", icon: "bag-outline" },
  { label: "Market", value: "market", icon: "bag-outline" },
  { label: "Beach", value: "beach", icon: "sunny-outline" },
  { label: "Park", value: "park", icon: "leaf-outline" },
  { label: "Nature", value: "nature", icon: "leaf-outline" },
  { label: "Forest", value: "forest", icon: "leaf-outline" },
  { label: "Picnic", value: "picnic", icon: "leaf-outline" },
  { label: "View Point", value: "view_point", icon: "image-outline" },
  { label: "Sunset Spot", value: "sunset_spot", icon: "image-outline" },
  { label: "Trip", value: "trip", icon: "airplane-outline" },
  { label: "Holiday", value: "holiday", icon: "airplane-outline" },
  { label: "Hotel", value: "hotel", icon: "bed-outline" },
  { label: "Spa", value: "spa", icon: "flower-outline" },
  { label: "Fitness", value: "fitness", icon: "fitness-outline" },
  { label: "Walk", value: "walk", icon: "fitness-outline" },
  { label: "Hiking", value: "hiking", icon: "fitness-outline" },
  { label: "Swimming", value: "swimming", icon: "water-outline" },
  { label: "Game", value: "game", icon: "game-controller-outline" },
  { label: "Arcade", value: "arcade", icon: "game-controller-outline" },
  { label: "Photo Spot", value: "photo_spot", icon: "camera-outline" },
  { label: "Romantic Date", value: "romantic_date", icon: "heart-outline" },
  { label: "Bookstore", value: "bookstore", icon: "book-outline" },
  { label: "Study Place", value: "study_place", icon: "laptop-outline" },
  { label: "Home", value: "home", icon: "home-outline" },
  { label: "Pet Friendly", value: "pet_friendly", icon: "paw-outline" },
];
export type PlaceCategoryItem = {
  label: string;
  value: string;
  image: ImageSourcePropType;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
};

export const PLACE_CATEGORIES: PlaceCategoryItem[] = [
  
{
  label: "Alışveriş",
  value: "shopping",
  image: require("../../assets/images/category-icons/shopping.png"),
  bgColor: "rgba(232, 243, 252, 0.48)",
  borderColor: "#C4DCEF",
  textColor: "#5B8FB8",
  iconBg: "#DCECF8",
},
{
  label: "Bar",
  value: "bar",
  image: require("../../assets/images/category-icons/beer.png"),
  bgColor: "rgba(231, 247, 246, 0.48)",
  borderColor: "#BFE1DD",
  textColor: "#5B9D95",
  iconBg: "#D9F0EE",
},
{
  label: "Çalışma Alanı",
  value: "study_place",
  image: require("../../assets/images/category-icons/study.png"),
  bgColor: "rgba(234, 248, 240, 0.48)",
  borderColor: "#C8E3D2",
  textColor: "#619176",
  iconBg: "#DDF1E4",
},
{
  label: "Doğa",
  value: "nature",
  image: require("../../assets/images/category-icons/nature.png"),
  bgColor: "rgba(242, 249, 232, 0.48)",
  borderColor: "#D7E6BF",
  textColor: "#879B53",
  iconBg: "#E9F2D8",
},
{
  label: "Kafe",
  value: "cafe",
  image: require("../../assets/images/category-icons/cafe.png"),
  bgColor: "rgba(251, 247, 230, 0.48)",
  borderColor: "#E9DDAF",
  textColor: "#A88D45",
  iconBg: "#F4EBCB",
},
{
  label: "Kahvaltı",
  value: "breakfast",
  image: require("../../assets/images/category-icons/breakfast.png"),
  bgColor: "rgba(252, 242, 231, 0.48)",
  borderColor: "#EDCFB6",
  textColor: "#BC8458",
  iconBg: "#F7E2D1",
},
{
  label: "Müze",
  value: "museum",
  image: require("../../assets/images/category-icons/museum.png"),
  bgColor: "rgba(252, 238, 230, 0.48)",
  borderColor: "#ECC6B4",
  textColor: "#C17C5F",
  iconBg: "#F7DBD0",
},
{
  label: "Otel",
  value: "hotel",
  image: require("../../assets/images/category-icons/bed.png"),
  bgColor: "rgba(251, 234, 229, 0.48)",
  borderColor: "#E9BCB2",
  textColor: "#BC7265",
  iconBg: "#F5D5CF",
},
{
  label: "Restoran",
  value: "restaurant",
  image: require("../../assets/images/category-icons/restaurant.png"),
  bgColor: "rgba(251, 230, 234, 0.48)",
  borderColor: "#EAB7C1",
  textColor: "#BE687B",
  iconBg: "#F4D2DA",
},
{
  label: "Sahil",
  value: "beach",
  image: require("../../assets/images/category-icons/vacations.png"),
  bgColor: "rgba(250, 229, 239, 0.48)",
  borderColor: "#E8BCD0",
  textColor: "#B86F92",
  iconBg: "#F3D5E3",
},
{
  label: "Sanat",
  value: "art",
  image: require("../../assets/images/category-icons/art.png"),
  bgColor: "rgba(248, 230, 243, 0.48)",
  borderColor: "#E3BED8",
  textColor: "#A96F98",
  iconBg: "#F0D7E8",
},
{
  label: "Sinema",
  value: "cinema",
  image: require("../../assets/images/category-icons/cinema.png"),
  bgColor: "rgba(243, 232, 247, 0.48)",
  borderColor: "#D8C5E6",
  textColor: "#8D75A8",
  iconBg: "#E8DCF1",
},
{
  label: "Spa",
  value: "spa",
  image: require("../../assets/images/category-icons/spa.png"),
  bgColor: "rgba(238, 235, 248, 0.48)",
  borderColor: "#CECBE7",
  textColor: "#7D79A6",
  iconBg: "#E2E0F2",
},
{
  label: "Spor",
  value: "spor",
  image: require("../../assets/images/category-icons/fitness.png"),
  bgColor: "rgba(234, 238, 250, 0.48)",
  borderColor: "#C5D0EA",
  textColor: "#667FAE",
  iconBg: "#DBE3F4",
},
{
  label: "Tatlı",
  value: "dessert",
  image: require("../../assets/images/category-icons/dessert.png"),
  bgColor: "rgba(242, 232, 249, 0.48)",
  borderColor: "#D5C4E8",
  textColor: "#8F71B3",
  iconBg: "#E6DBF2",
},
];

export const GROUP_AVATAR_ICONS: {
  key: GroupselectedIconsJson;
  iconName: string;
  label: string;
}[] = [
  { key: "planet", iconName: "planet", label: "Gezegen" },
  { key: "people", iconName: "people", label: "Grup" },
  { key: "heart", iconName: "heart", label: "Kalp" },
  { key: "camera", iconName: "camera", label: "Kamera" },
  { key: "restaurant", iconName: "restaurant", label: "Yemek" },
  { key: "airplane", iconName: "airplane", label: "Seyahat" },
  { key: "music", iconName: "musical-notes", label: "Müzik" },
  { key: "paw", iconName: "paw", label: "Dostlar" },
];