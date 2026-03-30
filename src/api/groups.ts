import { api } from "./client";
import { Group, GroupMember } from "../types/group";

export async function getGroups(): Promise<Group[]> {
    const response = await api.get("/groups/myGroup");
    return response.data.data ?? response.data;
}

export async function createGroup(payload: { name: string }): Promise<Group> {
    const response = await api.post("/groups/CreateGroup", payload);
    return response.data.data ?? response.data;
}

export async function getGroupDetails(groupId: string): Promise<Group> {
    const response = await api.get(`/groups/${groupId}/GetGroupDetail`);
    return response.data.data ?? response.data;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const response = await api.get(`/groups/${groupId}/GetGroupMembers`);
    return response.data.data ?? response.data;
}

export async function addGroupMember(groupId: string, email: string): Promise<void> {
    await api.post(`/groups/${groupId}/AddGroupMembers`, { email });
}

export async function updateGroup(groupId: string, name: string): Promise<Group> {
    const response = await api.put(`/groups/${groupId}/UpdateGroup`, { name });
    return response.data.data ?? response.data;
}

export async function deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/DeleteGroup`);
}

export async function removeGroupMember(groupId: string, memberUserId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/DeleteMembers/${memberUserId}`);
}

export async function leaveGroup(groupId: string): Promise<void> {
    await api.post(`/groups/${groupId}/leaveGroup`);
}

export async function transferOwnership(groupId: string, newOwnerUserId: string): Promise<void> {
    await api.post(`/groups/${groupId}/transfer-ownership`, { newOwnerUserId });
}