import axios from 'axios';
import { Trail, UserSession } from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
});

export async function fetchTrails(params: Record<string, string> = {}) {
  const { data } = await api.get<Trail[]>('/trails', { params });
  return data;
}

export async function fetchTrail(idOrSlug: string) {
  const { data } = await api.get<Trail>(`/trails/${idOrSlug}`);
  return data;
}

export async function fetchTrailPhotos(idOrSlug: string) {
  const { data } = await api.get<string[]>(`/trails/${idOrSlug}/photos`);
  return data;
}

export async function addReview(idOrSlug: string, input: { userId: string; userName: string; rating: number; comment: string }) {
  const { data } = await api.post<Trail>(`/trails/${idOrSlug}/reviews`, input);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<UserSession>('/auth/login', input);
  return data;
}

export async function register(input: { name: string; email: string; password: string }) {
  const { data } = await api.post<UserSession>('/auth/register', input);
  return data;
}

export async function checkEmailAvailability(email: string) {
  const { data } = await api.post<{ exists: boolean }>('/auth/check-email', { email });
  return data;
}

export async function toggleSavedTrail(userId: string, trailId: string) {
  const { data } = await api.post<{ id: string; savedTrailIds: string[] }>('/auth/toggle-save', { userId, trailId });
  return data;
}

export async function changePassword(input: { userId: string; oldPassword: string; newPassword: string }) {
  const { data } = await api.post<{ ok: boolean }>('/auth/change-password', input);
  return data;
}
