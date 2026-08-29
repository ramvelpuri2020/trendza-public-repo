import { ClosetItem } from "./closetTypes";

export interface OutfitGeneration {
  id: string;
  user_id: string;
  name?: string;
  item_ids: string[];
  items?: ClosetItem[];
  score?: number;
  rationale?: string;
  occasion: string;
  weather?: string;
  style_preference?: string;
  created_at: string;
}

export interface OutfitGenerationRequest {
  occasion: string;
  weather?: string;
  style_preference?: string;
  color_preference?: string;
  specific_requirements?: string;
}

export interface GeneratedOutfitOption {
  id: string;
  items: ClosetItem[];
  score: number;
  rationale: string;
  style_notes: string[];
  missing_items?: MissingItem[];
}

export interface MissingItem {
  category: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export type OccasionType = 
  | 'work'
  | 'casual'
  | 'date_night'
  | 'party'
  | 'formal'
  | 'gym'
  | 'travel'
  | 'wedding'
  | 'interview'
  | 'brunch'
  | 'night_out'
  | 'weekend';

export type WeatherType = 
  | 'hot'
  | 'warm'
  | 'mild'
  | 'cool'
  | 'cold'
  | 'rainy'
  | 'snowy';

export type StylePreference = 
  | 'classic'
  | 'trendy'
  | 'edgy'
  | 'bohemian'
  | 'minimalist'
  | 'romantic'
  | 'sporty'
  | 'vintage';

export interface OccasionOption {
  id: OccasionType;
  label: string;
  emoji: string;
  description: string;
  examples: string[];
}

export interface WeatherOption {
  id: WeatherType;
  label: string;
  emoji: string;
  temp_range: string;
}

export interface StyleOption {
  id: StylePreference;
  label: string;
  emoji: string;
  description: string;
}
