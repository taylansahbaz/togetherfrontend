import { ApiResponse } from "../types/api";
import {
  Group,
  GroupMember,
  GroupselectedIconsJson,
  MyGroupsData,
  UpdateLastSelectedGroupRequest,
} from "../types/group";
import { api } from "./client";

export async function getMyGroups(): Promise<ApiResponse<MyGroupsData>> {
  const response = await api.get<ApiResponse<MyGroupsData>>("/groups/myGroup");
  return response.data;
}

export async function createGroup(payload: {
  name: string;
  colorcode: string;
  photoUrl?: string | null;
  selectedIconsJson?: GroupselectedIconsJson | null;
}): Promise<Group> {
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

export async function updateGroup(
  groupId: string,
  payload: {
    name: string;
    colorcode: string;
    photoUrl?: string | null;
    selectedIconsJson?: GroupselectedIconsJson | null;
  }
): Promise<Group> {
  const response = await api.put(`/groups/${groupId}/UpdateGroup`, {
    name: payload.name,
    colorCode: payload.colorcode,
    photoUrl: payload.photoUrl ?? null,
    selectedIconsJson: payload.selectedIconsJson ?? null,
  });

  return response.data.data ?? response.data;
}

export async function deleteGroup(groupId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/DeleteGroup`);
}

export async function removeGroupMember(
  groupId: string,
  memberUserId: string
): Promise<void> {
  await api.delete(`/groups/${groupId}/DeleteMembers/${memberUserId}`);
}

export async function leaveGroup(groupId: string): Promise<void> {
  await api.post(`/groups/${groupId}/leaveGroup`);
}

export async function transferOwnership(
  groupId: string,
  newOwnerUserId: string
): Promise<void> {
  await api.post(`/groups/${groupId}/transfer-ownership`, { newOwnerUserId });
}

export const inviteGroupMember = async (groupId: string, email: string) => {
  const response = await api.post(`/groups/${groupId}/invite`, { email });
  return response.data;
};

export const getPendingGroupInvitations = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}/pending-invitations`);
  return response.data?.data ?? response.data ?? [];
};

export const cancelGroupInvitation = async (invitationId: string) => {
  const response = await api.post(`/groups/invitations/${invitationId}/cancel`);
  return response.data;
};

export async function updateLastSelectedGroup(
  payload: UpdateLastSelectedGroupRequest
): Promise<ApiResponse<null>> {
  const response = await api.put<ApiResponse<null>>(
    "/groups/last-selected-group",
    payload
  );

  return response.data;
}
export async function uploadGroupAvatar(fileUri: string): Promise<string> {
  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    name: `group-avatar-${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  const response = await api.post("/files/upload-group-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data?.data?.url ?? response.data?.url;
}