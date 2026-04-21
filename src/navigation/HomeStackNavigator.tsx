import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import BillSplitScreen from "../screens/bill/BillSplitScreen";
import GroupMembersScreen from "../screens/groups/GroupMembersScreen";
import CreatePlaceScreen from "../screens/home/CreatePlaceScreen";
import EditReviewScreen from "../screens/home/EditReviewScreen";
import HomeScreen from "../screens/home/HomeScreen";
import PlaceDetailScreen from "../screens/home/PlaceDetailScreen";
import UploadPhotoScreen from "../screens/home/UploadPhotoScreen";

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
    return (
        <Stack.Navigator>
     
            <Stack.Screen 
                name="Anılar" 
                component={HomeScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen name="CreatePlace" component={CreatePlaceScreen} options={{headerShown: false  }} />
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{  headerShown: false }} />
            <Stack.Screen name="EditReview" component={EditReviewScreen} options={{  headerShown: false }} />
            <Stack.Screen name="UploadPhoto" component={UploadPhotoScreen} options={{  headerShown: false}} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BillSplit" component={BillSplitScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}