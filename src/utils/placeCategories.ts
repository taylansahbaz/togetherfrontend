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
    hamburger_restaurant: "restaurant",
    pizza_restaurant: "restaurant",
    fast_food: "restaurant",
    chinese_restaurant: "restaurant",
    indian_restaurant: "restaurant",
    japanese_restaurant: "restaurant",
    thai_restaurant: "restaurant",
    mexican_restaurant: "restaurant",
    seafood_restaurant: "restaurant",
    steak_house: "restaurant",
    sushi_restaurant: "restaurant",
    ramen_restaurant: "restaurant",
    korean_restaurant: "restaurant",
    french_restaurant: "restaurant",
    italian_restaurant: "restaurant",
    spanish_restaurant: "restaurant",
    vietnamese_restaurant: "restaurant",
    turkish_restaurant: "restaurant",
    middle_eastern_restaurant: "restaurant",
    vegetarian_restaurant: "restaurant",
    tapas_restaurant: "restaurant",
    meal_delivery: "restaurant",
    banquet_hall: "restaurant",
    bakery: "dessert",       // Fırınları tatlıya bağladık
    
    // Eğlence & Gece
    bar: "bar",
    night_club: "bar",
    pub: "bar",

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
    national_park: "nature",
    hiking_area: "nature",

    // Spor
    gym: "spor",
    stadium: "spor",

    // Eğlence
    movie_theater: "cinema",

    // Çalışma Alanları
    library: "study_place",
    book_store: "study_place",
  };

  // Eğer listede eşleşme bulursa senin 'value' değerini döner
  if (typeMap[type]) {
    return typeMap[type];
  }

  // Eğer "restaurant" kelimesi içeriyorsa restaurant kategorisine at
  if (type.includes("restaurant")) {
    return "restaurant";
  }

  if (type.includes("park")) {
    return "nature";
  }
  if (type.includes("gym")) {
    return "spor";
  }
  if (type.includes("cinema")) {
    return "cinema";
  }
  if (type.includes("library")) {
    return "study_place";
  }
  // Aksi halde "cafe" olarak işaretle
  return "cafe";
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

export const getPlaceCategoryImage = (category?: string ) => {
  return getPlaceCategoryItem(category)?.image;
};