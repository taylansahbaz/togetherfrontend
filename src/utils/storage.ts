import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./constants";

export const storage = {
    async setToken(token: string) {
        await AsyncStorage.setItem(STORAGE_KEYS.token, token);
    },

    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem(STORAGE_KEYS.token);
    },

    async removeToken() {
        await AsyncStorage.removeItem(STORAGE_KEYS.token);
    },

    async setSelectedGroupId(groupId: string) {
        await AsyncStorage.setItem(STORAGE_KEYS.selectedGroupId, groupId);
    },

    async getSelectedGroupId(): Promise<string | null> {
        return await AsyncStorage.getItem(STORAGE_KEYS.selectedGroupId);
    },

    async removeSelectedGroupId() {
        await AsyncStorage.removeItem(STORAGE_KEYS.selectedGroupId);
    },

    async clearAllAuthData() {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.token,
            STORAGE_KEYS.selectedGroupId,
        ]);
    },
};