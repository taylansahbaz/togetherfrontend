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


export const getPlaceCategoryItem = (category?: string) => {
  if (!category) return undefined;

  const normalized = category.toLowerCase().trim();

  return PLACE_CATEGORIES.find(
    (item) =>
      item.value.toLowerCase() === normalized ||
      item.label.toLowerCase() === normalized
  );
};

export const getPlaceCategoryImage = (category?: string) => {
  return getPlaceCategoryItem(category)?.image;
};