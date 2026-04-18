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
export const mapGoogleTypeToCategoryValue = (googleType?: string) => {
  if (!googleType) return "cafe"; // Eğer Google'dan tip gelmezse çökmemesi için varsayılan bir 'value'

  const type = googleType.toLowerCase();

  // Google API Tipleri (Sol taraf) -> Senin Kategorilerindeki 'value' değerleri (Sağ taraf)
  const typeMap: Record<string, string> = {
    // Yeme & İçme
    cafe: "cafe",
    restaurant: "restaurant",
    food: "restaurant",
    bakery: "dessert",       // Fırınları tatlıya bağladık
    meal_delivery: "restaurant",
    
    // Eğlence & Gece
    bar: "bar",
    night_club: "bar",

    // Konaklama
    lodging: "hotel",
    hotel: "hotel",

    // Alışveriş
    shopping_mall: "shopping",
    store: "shopping",
    clothing_store: "shopping",
    supermarket: "shopping",

    // Sanat & Kültür
    art_gallery: "art",
    museum: "museum",
    tourist_attraction: "art",

    // Güzellik & Dinlenme
    spa: "spa",
    beauty_salon: "spa",
    hair_care: "spa",

    // Doğa & Dış Mekan
    park: "nature",
    campground: "nature",
    natural_feature: "nature",

    // Spor
    gym: "spor",
    stadium: "spor",

    // Eğlence
    movie_theater: "cinema",

    // Çalışma Alanları
    library: "study_place",
    book_store: "study_place",
  };

  // Eğer listede eşleşme bulursa senin 'value' değerini döner, bulamazsa "cafe" olarak işaretler
  return typeMap[type] || "cafe";
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