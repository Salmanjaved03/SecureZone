import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:5000/api';

// Export all interfaces
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

export interface Report {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

// Response interfaces
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
  report: IncidentReport; // Updated to include the full report
}

export interface CreateReportResponse {
  message: string;
  report: IncidentReport;
}

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
  return await axios.put(`${API_URL}/profile/${email}`, data);
};

export const createReport = async (title: string, description: string, createdBy: string): Promise<AxiosResponse<{ message: string; report: Report }>> => {
  return await axios.post(`${API_URL}/reports`, { title, description, createdBy });
};

export const getReports = async (): Promise<AxiosResponse<{ reports: Report[] }>> => {
  return await axios.get(`${API_URL}/reports`);
};