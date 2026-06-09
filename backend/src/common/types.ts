export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Trail {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;
  difficulty: Difficulty;
  distanceKm: number;
  elevationM: number;
  durationHours: number;
  coordinates: [number, number];
  tags: string[];
  coverImage: string;
  summary: string;
  routeType: 'loop' | 'out-and-back' | 'point-to-point';
  reviews: Review[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  savedTrailIds: string[];
}
