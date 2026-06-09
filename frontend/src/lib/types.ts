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
  difficulty: 'easy' | 'moderate' | 'hard';
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

export interface UserSession {
  id: string;
  name: string;
  email: string;
  savedTrailIds: string[];
}
