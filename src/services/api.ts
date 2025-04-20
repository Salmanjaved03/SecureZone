import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  userId: string;
  createdAt: string;
  user: User;
}

interface AuthResponse {
  message: string;
  user?: User;
}

interface IncidentReportResponse {
  message: string;
  report: IncidentReport;
}

interface IncidentReportsResponse {
  reports: IncidentReport[];
}

export const login = (data: { email: string; password: string }) =>
  axios.post<AuthResponse>(`${API_URL}/login`, data);

export const signup = (data: { email: string; password: string; username: string }) =>
  axios.post<AuthResponse>(`${API_URL}/signup`, data);

export const getProfile = (email: string) =>
  axios.get<AuthResponse>(`${API_URL}/profile/${email}`);

export const getAdminDashboard = (email: string) =>
  axios.get<AuthResponse>(`${API_URL}/admin-dashboard/${email}`);

export const getModeratorReports = (email: string) =>
  axios.get<AuthResponse>(`${API_URL}/moderator-reports/${email}`);

export const createIncidentReport = (data: { title: string; description: string; location: string; userId: string }) =>
  axios.post<IncidentReportResponse>(`${API_URL}/reports`, data);

export const getIncidentReports = () =>
  axios.get<IncidentReportsResponse>(`${API_URL}/reports`);