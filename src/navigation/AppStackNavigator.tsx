import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AccountSettingsScreen from "../screens/auth/AccountSettingsScreen";
import BillSplitScreen from "../screens/bill/BillSplitScreen";
import MyBillsScreen from "../screens/bill/MyBillsScreen";
import CreateGroupScreen from "../screens/groups/CreateGroupScreen";
import GroupListScreen from "../screens/groups/GroupListScreen";
import GroupMembersScreen from "../screens/groups/GroupMembersScreen";
import CreatePlaceScreen from "../screens/home/CreatePlaceScreen";
import CreateWishlistScreen from "../screens/home/CreateWishlistScreen";
import EditReviewScreen from "../screens/home/EditReviewScreen";
import PlaceDetailScreen from "../screens/home/PlaceDetailScreen";
import UploadPhotoScreen from "../screens/home/UploadPhotoScreen";
import WishlistScreen from "../screens/home/WishlistScreen";
import NotificationsScreen from "../screens/notification/notification";
import ProfileScreen from "../screens/profile/ProfileScreen";
import MainTabNavigator from "./MainTabNavigator";
const Stack = createNativeStackNavigator();
export default function AppStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="CreatePlace" component={CreatePlaceScreen} />
            <Stack.Screen name="WishlistScreen" component={WishlistScreen} options={{  headerShown: false }} />
            <Stack.Screen name="CreateWishlist" component={CreateWishlistScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditReview" component={EditReviewScreen} />
            <Stack.Screen name="ProfileHome" component={ProfileScreen} />
            <Stack.Screen name="CreateGroupScreen" component={CreateGroupScreen} />
            <Stack.Screen name="GroupList" component={GroupListScreen} options={{  headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen}options={{ headerShown: false,}} />
            <Stack.Screen name="BillSplit" component={BillSplitScreen} />
            <Stack.Screen name="MyBills" component={MyBillsScreen} />
            <Stack.Screen name="UploadPhoto" component={UploadPhotoScreen} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
        </Stack.Navigator>
    );

}   