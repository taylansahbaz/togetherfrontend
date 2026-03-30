import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import CreatePlaceScreen from "../screens/home/CreatePlaceScreen"; // Ortak kullanım
import PlaceDetailScreen from "../screens/home/PlaceDetailScreen"; // Ortak kullanım
import WishlistScreen from "../screens/home/WishlistScreen";

const Stack = createNativeStackNavigator();

export default function WishlistStackNavigator() {
    return (
        <Stack.Navigator>
            {/* Ana Liste Ekranı */}
            <Stack.Screen name="WishlistTab" component={WishlistScreen} options={{ title: "Wishlist" }} />
            {/* ÖNEMLİ: CreatePlace ve PlaceDetail ekranlarını buraya da ekliyoruz. 
                Böylece Wishlist içinden yönlendirme yapınca navigatör bunları bulabilecek.
            */}
           <Stack.Screen name="CreatePlace" component={CreatePlaceScreen} options={{ title: "Create Place" }} />
            
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: "Place Detail" }} />
        </Stack.Navigator>
    );
}