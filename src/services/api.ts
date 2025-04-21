import axios, { AxiosResponse } from 'axios';

const API_URL = 'http://localhost:5000/api';

// Interfaces
export interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  userId: string;
  createdAt: string;
  user: User;
  imageUrl?: string;
  isAnonymous?: boolean;
  isFlagged?: boolean;
  upvotes: number;
  downvotes: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  reportId: string;
  user: { id: string; username: string };
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ProfileResponse {
  message: string;
  user: User;
}

export interface AdminDashboardResponse {
  message: string;
  user: User;
}

export interface ModeratorReportsResponse {
  message: string;
  user: User;
}

export interface IncidentReportsResponse {
  reports: IncidentReport[];
}

export interface ActionResponse {
  message: string;
}

export interface VoteResponse {
  message: string;
  report: IncidentReport;
}

export interface CreateReportResponse {
  message: string;
  report: IncidentReport;
}

export interface CreateCommentResponse {
  message: string;
  comment: Comment;
}

export interface CommentsResponse {
  comments: Comment[];
}

// API Functions
export const login = async (email: string, password: string): Promise<AxiosResponse<AuthResponse>> => {
  return await axios.post(`${API_URL}/login`, { email, password });
};

export const signup = async (email: string, password: string, username: string): Promise<AxiosResponse<AuthResponse>> => {
  return await axios.post(`${API_URL}/signup`, { email, password, username });
};

export const getProfile = async (email: string): Promise<AxiosResponse<ProfileResponse>> => {
  return await axios.get(`${API_URL}/profile/${email}`);
};

export const getAdminDashboard = async (adminEmail: string): Promise<AxiosResponse<AdminDashboardResponse>> => {
  return await axios.post(`${API_URL}/admin-dashboard`, { adminEmail });
};

export const banUser = async (adminEmail: string, username: string): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.post(`${API_URL}/admin/ban-user`, { adminEmail, username });
};

export const deleteUser = async (adminEmail: string, username: string): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.delete(`${API_URL}/admin/delete-user`, { data: { adminEmail, username } });
};

export const promoteToModerator = async (adminEmail: string, username: string): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.post(`${API_URL}/admin/promote-to-moderator`, { adminEmail, username });
};

export const deleteReport = async (adminEmail: string, reportId: string): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.delete(`${API_URL}/reports/${reportId}`, { data: { adminEmail } });
};

export const flagReport = async (adminEmail: string, reportId: string): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.put(`${API_URL}/reports/${reportId}/flag`, { adminEmail });
};

export const getModeratorReports = async (adminEmail: string): Promise<AxiosResponse<ModeratorReportsResponse>> => {
  return await axios.post(`${API_URL}/moderator-reports`, { adminEmail });
};

export const getIncidentReports = async (userEmail: string): Promise<AxiosResponse<IncidentReportsResponse>> => {
  return await axios.get(`${API_URL}/reports`, { params: { userEmail } });
};

export const createIncidentReport = async (
  title: string,
  description: string,
  location: string,
  userId: string,
  image?: File,
  isAnonymous: boolean = false
): Promise<AxiosResponse<CreateReportResponse>> => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('location', location);
  formData.append('userId', userId);
  formData.append('isAnonymous', String(isAnonymous));
  if (image) {
    formData.append('image', image);
  }

  return await axios.post(`${API_URL}/reports`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const upvoteReport = async (userEmail: string, reportId: string): Promise<AxiosResponse<VoteResponse>> => {
  return await axios.post(`${API_URL}/reports/${reportId}/upvote`, { userEmail });
};

export const downvoteReport = async (userEmail: string, reportId: string): Promise<AxiosResponse<VoteResponse>> => {
  return await axios.post(`${API_URL}/reports/${reportId}/downvote`, { userEmail });
};

export const updateProfile = async (email: string, data: { username: string; password?: string }): Promise<AxiosResponse<ProfileResponse>> => {
  return await axios.put(`${API_URL}/profile/${email}`, { ...data, userEmail: email });
};

export const createComment = async (userEmail: string, reportId: string, content: string): Promise<AxiosResponse<CreateCommentResponse>> => {
  return await axios.post(`${API_URL}/reports/${reportId}/comments`, { userEmail, content });
};

export const getComments = async (reportId: string): Promise<AxiosResponse<CommentsResponse>> => {
  return await axios.get(`${API_URL}/reports/${reportId}/comments`);
};