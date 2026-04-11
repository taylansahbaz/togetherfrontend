export type GroupRole = "Owner" | "Member";
export type GroupselectedIconsJson =
  | "planet"
  | "people"
  | "heart"
  | "camera"
  | "restaurant"
  | "airplane"
  | "music"
  | "paw";

export interface Group {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: string;
    colorCode: string;
    photoUrl?: string | null;
    selectedIconsJson?: GroupselectedIconsJson | null;
}

export interface GroupMember {
    userId: string;
    name: string;
    email: string;
    role: GroupRole;
    joinedAt: string;
    photoUrl?: string | null;
    selectedIconsJson?: string | null;
}

export interface MyGroupsData {
  groups: Group[];
  lastSelectedGroupId: string | null;
}

export interface UpdateLastSelectedGroupRequest {
  groupId: string;
}