import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsScreen from '../screens/groups/GroupListScreen'; // Grupları buraya import et
import ProfileScreen from '../screens/profile/ProfileScreen';

// Profil sekmesinin içi için mini bir yığın oluşturuyoruz
const ProfileStack = createNativeStackNavigator();

export function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            {/* Profil sekmesine tıklandığında ilk açılacak sayfa */}
            <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
            
            {/* Profilin içinden gidilebilecek diğer sayfalar (Alt menü burada KAYBOLMAZ!) */}
            <ProfileStack.Screen name="Groups" component={GroupsScreen} />
        </ProfileStack.Navigator>
    );
}