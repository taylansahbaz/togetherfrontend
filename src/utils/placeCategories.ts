import { PLACE_CATEGORIES } from "../utils/constants";

export const getPlaceCategoryByValue = (value?: string) => {
  if (!value) return null;

  const normalized = value.trim().toLocaleLowerCase("tr-TR");

  return (
    PLACE_CATEGORIES.find((item) => item.value === normalized) ||
    PLACE_CATEGORIES.find(
      (item) => item.label.toLocaleLowerCase("tr-TR") === normalized
    ) ||
    null
  );
};

export const getPlaceCategoryLabel = (value?: string) => {
  const found = getPlaceCategoryByValue(value);
  return found?.label || value || "Genel";
};

export const mapGoogleTypeToCategoryValue = (rawType?: string) => {
  const value = (rawType || "").trim().toLocaleLowerCase("tr-TR");

  if (
    value.includes("cafe") ||
    value.includes("coffee")
  ) {
    return "cafe";
  }

  if (
    value.includes("bakery") ||
    value.includes("dessert") ||
    value.includes("ice_cream")
  ) {
    return "dessert";
  }

  if (
    value.includes("restaurant") ||
    value.includes("meal_takeaway") ||
    value.includes("meal_delivery")
  ) {
    return "restaurant";
  }

  if (value.includes("bar") || value.includes("night_club")) {
    return "bar";
  }

  if (value.includes("museum")) {
    return "museum";
  }

  if (value.includes("movie_theater")) {
    return "cinema";
  }

  if (value.includes("shopping_mall") || value.includes("store")) {
    return "shopping";
  }

  if (value.includes("park")) {
    return "park";
  }

  if (value.includes("tourist_attraction")) {
    return "view_point";
  }

  if (value.includes("spa")) {
    return "spa";
  }

  if (value.includes("gym")) {
    return "fitness";
  }

  if (value.includes("book_store")) {
    return "bookstore";
  }

  if (value.includes("hospital")) {
    return "hospital";
  }

  if (value.includes("pharmacy")) {
    return "pharmacy";
  }

  if (value.includes("airport")) {
    return "airport";
  }

  return "cafe";
};