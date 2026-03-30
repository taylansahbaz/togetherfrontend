import React, { createContext, useEffect, useMemo, useState } from "react";
import { Group } from "../types/group";
import { storage } from "../utils/storage";

interface GroupContextType {
    selectedGroup: Group | null;
    selectedGroupId: string | null;
    setSelectedGroup: (group: Group | null) => Promise<void>;
    clearSelectedGroup: () => Promise<void>;
}

export const GroupContext = createContext<GroupContextType | undefined>(
    undefined
);

export function GroupProvider({ children }: { children: React.ReactNode }) {
    const [selectedGroup, setSelectedGroupState] = useState<Group | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    useEffect(() => {
        const loadSelectedGroupId = async () => {
            const savedGroupId = await storage.getSelectedGroupId();

            if (savedGroupId) {
                setSelectedGroupId(savedGroupId);
            }
        };

        loadSelectedGroupId();
    }, []);

    const setSelectedGroup = async (group: Group | null) => {
        setSelectedGroupState(group);
        setSelectedGroupId(group?.id ?? null);

        if (group?.id) {
            await storage.setSelectedGroupId(group.id);
        } else {
            await storage.removeSelectedGroupId();
        }
    };

    const clearSelectedGroup = async () => {
        setSelectedGroupState(null);
        setSelectedGroupId(null);
        await storage.removeSelectedGroupId();
    };

    const value = useMemo(
        () => ({
            selectedGroup,
            selectedGroupId,
            setSelectedGroup,
            clearSelectedGroup,
        }),
        [selectedGroup, selectedGroupId]
    );

    return (
        <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
    );
}