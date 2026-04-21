import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BillSplitScreen from '../screens/bill/BillSplitScreen';
import MyBillsScreen from '../screens/bill/MyBillsScreen';
import GroupsScreen from '../screens/groups/GroupListScreen';
import GroupMembersScreen from '../screens/groups/GroupMembersScreen';
import PrivacyPolicyScreen from '../screens/profile/PrivacyPolicyScreen';
import PrivacySettingsScreen from '../screens/profile/PrivacySettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TermsOfServiceScreen from '../screens/profile/TermsOfServiceScreen';

const ProfileStack = createNativeStackNavigator();

export function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
            <ProfileStack.Screen name="GroupMembers" component={GroupMembersScreen} />
            <ProfileStack.Screen name="Groups" component={GroupsScreen} />
            <ProfileStack.Screen name="MyBills" component={MyBillsScreen} />
            <ProfileStack.Screen name="BillSplit" component={BillSplitScreen} />
            <ProfileStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <ProfileStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        </ProfileStack.Navigator>
    );
}