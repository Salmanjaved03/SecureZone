import axios, { AxiosResponse } from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isBanned: boolean;
}

export interface Tag {
  id: number;
  name: string;
  incidentReportId?: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
  isAnonymous: boolean;
  isFlagged: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  user: User;
  tags: Tag[];
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

export interface UpdateTagsResponse {
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

export const updateProfile = async (
  email: string,
  data: { username: string; password?: string }
): Promise<AxiosResponse<ProfileResponse>> => {
  return await axios.put(`${API_URL}/profile/${email}`, { ...data, userEmail: email });
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

export const getModeratorReports = async (adminEmail: string): Promise<AxiosResponse<ModeratorReportsResponse>> => {
  return await axios.post(`${API_URL}/moderator-reports`, { adminEmail });
};

export const getIncidentReports = async (
  userEmail: string
): Promise<AxiosResponse<IncidentReportsResponse>> => {
  return await axios.get(`${API_URL}/reports`, { params: { userEmail } });
};

export const searchIncidentReports = async (
  userEmail: string,
  query: string
): Promise<AxiosResponse<IncidentReportsResponse>> => {
  return await axios.get(`${API_URL}/reports/search`, { params: { userEmail, query } });
};

export const createIncidentReport = async (
  title: string,
  description: string,
  location: string,
  userId: string,
  image?: File,
  isAnonymous?: boolean,
  tags?: string
): Promise<AxiosResponse<CreateReportResponse>> => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('location', location);
  formData.append('userId', userId);
  if (image) {
    formData.append('image', image);
  }
  formData.append('isAnonymous', isAnonymous ? 'true' : 'false');
  if (tags) {
    formData.append('tags', tags);
  }

  return await axios.post(`${API_URL}/reports`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getIncidentReport = async (
  reportId: string
): Promise<AxiosResponse<{ report: IncidentReport }>> => {
  return await axios.get(`${API_URL}/reports/${reportId}`);
};

export const updateIncidentReportTags = async (
  reportId: string,
  userEmail: string,
  tags?: string
): Promise<AxiosResponse<UpdateTagsResponse>> => {
  return await axios.put(
    `http://localhost:5000/api/reports/${reportId}/tags`,
    { userEmail, tags },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const deleteReport = async (
  adminEmail: string,
  reportId: string
): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.delete(`${API_URL}/reports/${reportId}`, { data: { adminEmail } });
};

export const flagReport = async (
  adminEmail: string,
  reportId: string
): Promise<AxiosResponse<ActionResponse>> => {
  return await axios.put(`${API_URL}/reports/${reportId}/flag`, { adminEmail });
};

export const upvoteReport = async (
  userEmail: string,
  reportId: string
): Promise<AxiosResponse<VoteResponse>> => {
  return await axios.post(`${API_URL}/reports/${reportId}/upvote`, { userEmail });
};

export const downvoteReport = async (
  userEmail: string,
  reportId: string
): Promise<AxiosResponse<VoteResponse>> => {
  return await axios.post(`${API_URL}/reports/${reportId}/downvote`, { userEmail });
};

export const createComment = async (
  userEmail: string,
  reportId: string,
  content: string
): Promise<AxiosResponse<CreateCommentResponse>> => {
  return await axios.post(`${API_URL}/reports/${reportId}/comments`, { userEmail, content });
};

export const getComments = async (
  reportId: string
): Promise<AxiosResponse<CommentsResponse>> => {
  return await axios.get(`${API_URL}/reports/${reportId}/comments`);
};

export const updateReportTags = async (
  userEmail: string,
  reportId: string,
  tags: string
): Promise<AxiosResponse<UpdateTagsResponse>> => {
  return await axios.put(
    `http://localhost:5000/api/reports/${reportId}/tags`,
    { userEmail, tags },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

