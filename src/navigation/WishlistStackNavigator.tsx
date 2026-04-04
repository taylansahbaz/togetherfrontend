import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import CreateWishlistScreen from "../screens/home/CreateWishlistScreen";
import PlaceDetailScreen from "../screens/home/PlaceDetailScreen"; // Ortak kullanım
import WishlistScreen from "../screens/home/WishlistScreen";

const Stack = createNativeStackNavigator();

export default function WishlistStackNavigator() {
    return (
        <Stack.Navigator> 
            {/* Ana Liste Ekranı */}
            <Stack.Screen name="WishlistScreen" component={WishlistScreen} options={{  headerShown: false }} />
            {/* ÖNEMLİ: CreatePlace ve PlaceDetail ekranlarını buraya da ekliyoruz. 
                Böylece Wishlist içinden yönlendirme yapınca navigatör bunları bulabilecek.
            */}

            <Stack.Screen name="CreateWishlist" component={CreateWishlistScreen} options={{ headerShown: false }} />
            
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: "Place Detail" }} />
        </Stack.Navigator>
    );
}