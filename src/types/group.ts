export type GroupRole = "Owner" | "Member";

export interface Group {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: string;
    color: string;
}

export interface GroupMember {
    userId: string;
    name: string;
    email: string;
    role: GroupRole;
    joinedAt: string;
}