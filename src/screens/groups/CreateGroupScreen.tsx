import React, { useState } from "react";
import { Alert, View } from "react-native";
import AppInput from "../../components/common/AppInput";
import AppButton from "../../components/common/AppButton";
import { createGroup } from "../../api/groups";
import { getApiErrorMessage } from "../../utils/helpers";

export default function CreateGroupScreen({ navigation }: any) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const onCreate = async () => {
        try {
            setLoading(true);
            await createGroup({ name });
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <AppInput label="Group Name" value={name} onChangeText={setName} />
            <AppButton title="Create" onPress={onCreate} loading={loading} />
        </View>
    );
}