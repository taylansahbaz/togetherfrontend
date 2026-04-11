import React, { createContext, useMemo, useState } from "react";
import { updateLastSelectedGroup } from "../api/groups";
import { Group } from "../types/group";

interface GroupContextType {
  selectedGroup: Group | null;
  selectedGroupId: string | null;
  setSelectedGroup: (group: Group | null) => Promise<void>;
  clearSelectedGroup: () => Promise<void>;
  initializeSelectedGroup: (
    groups: Group[],
    lastSelectedGroupId: string | null
  ) => Promise<Group | null>;
}

export const GroupContext = createContext<GroupContextType | undefined>(
  undefined
);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroup, setSelectedGroupState] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const initializeSelectedGroup = async (
    groups: Group[],
    lastSelectedGroupId: string | null
  ): Promise<Group | null> => {
    let resolvedGroup: Group | null = null;

    if (lastSelectedGroupId) {
      resolvedGroup =
        groups.find((group) => group.id === lastSelectedGroupId) ?? null;
    }

    if (!resolvedGroup && groups.length > 0) {
      resolvedGroup = groups[0];

      try {
        await updateLastSelectedGroup({ groupId: resolvedGroup.id });
      } catch (error) {
        console.log("Failed to sync first selected group:", error);
      }
    }

    setSelectedGroupState(resolvedGroup);
    setSelectedGroupId(resolvedGroup?.id ?? null);

    return resolvedGroup;
  };

  const setSelectedGroup = async (group: Group | null) => {
    setSelectedGroupState(group);
    setSelectedGroupId(group?.id ?? null);

    if (group?.id) {
      try {
        await updateLastSelectedGroup({ groupId: group.id });
      } catch (error) {
        console.log("Failed to update last selected group:", error);
      }
    }
  };

  const clearSelectedGroup = async () => {
    setSelectedGroupState(null);
    setSelectedGroupId(null);
  };

  const value = useMemo(
    () => ({
      selectedGroup,
      selectedGroupId,
      setSelectedGroup,
      clearSelectedGroup,
      initializeSelectedGroup,
    }),
    [selectedGroup, selectedGroupId]
  );

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}