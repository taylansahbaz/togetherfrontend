import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import CreateGroupScreen from "../screens/groups/CreateGroupScreen";
import GroupListScreen from "../screens/groups/GroupListScreen";
import GroupMembersScreen from "../screens/groups/GroupMemberScreen";

const Stack = createNativeStackNavigator();

export default function GroupStackNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="GroupList"
                component={GroupListScreen}
                options={{ title: "Groups" }}
            />
            <Stack.Screen
                name="CreateGroup"
                component={CreateGroupScreen}
                options={{ title: "Create Group" }}
            />
            <Stack.Screen 
                name="GroupMembers" 
                component={GroupMembersScreen} 
                options={{ headerShown: false }} 
            />
        </Stack.Navigator>
    );
}