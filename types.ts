import type { ComponentType, CSSProperties } from 'react';

export interface Plan {
  id: number;
  name: 'Free' | 'Pro' | 'Enterprise';
  monthly_credits: number;
  max_daily_credits: number;
  price_usd?: number;
}

export interface NotificationPreferences {
    promotions: boolean;
    featureUpdates: boolean;
    generalAlerts: boolean;
}

export interface Notification {
    id: string;
    type: 'offer' | 'feature' | 'general';
    title: string; // translation key
    message: string; // translation key
    created_at: string;
    read: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  plan: Plan;
  credits: number;
  notificationPreferences: NotificationPreferences;
}

export type ToolType = 'TRANSFORMATION' | 'FILTER' | 'ANALYSIS';

export interface Tool {
  id:string;
  name: string; // This will now be a translation key, e.g., "tool.hairstyle.name"
  description: string; // This will now be a translation key
  type: ToolType;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  coverImage?: string; // For home page
}

export interface Hairstyle {
  id: string;
  name: string;
  imageUrl: string;
  gender: 'male' | 'female';
  isPro: boolean;
  category: string;
}

export interface ToolParameters {
  // Hairstyle
  style?: string;
  color?: string; // Can be hex or name
  // Filters
  intensity?: number;
  age?: number;
  // Beard
  beardStyle?: 'Clean Shaven' | 'Stubble' | 'Goatee';
  // Skin/Eye color
  skinTone?: string;
  eyeColor?: string;
  // Halloween
  halloweenStyle?: 'face only' | 'whole figure' | 'add objects';
}

export interface FacialAnalysisResult {
  faceShape: string;
  symmetryScore: number;
  youthfulnessScore: number;
  skinClarity: number;
  overallAnalysis: string;
  // New Fields
  eyeShape: string;
  jawlineDefinitionScore: number;
  cheekboneProminenceScore: number;
  lipFullnessScore: number;
  skinEvennessScore: number;
  goldenRatioScore: number;
  emotionalExpression: string;
  perceivedAge: number;
}

export type Page = 
  | 'welcome' | 'login' | 'signup' | 'home' | 'tools' | 'history' | 'profile' 
  | 'settings' | 'subscription' | 'themes' | 'about' | 'privacy' | 'terms'
  | 'editor' | 'language' | 'tracking' | 'account-info' | 'notifications' | 'notification-settings'
  | 'forgot-password' | 'update-password' | 'usage-detail';

export interface Generation {
  id: number;
  toolName: string; // This will be a translation key
  created_at: string;
  imageUrl?: string; // optional as some history items might not have one
  image_url_hq?: string; // Path to high-quality image in private bucket
}

export interface CreditUsage {
    id: number;
    toolId: string;
    toolName: string; // translation key
    credits: number;
    created_at: string;
}

export type Language = {
    code: string;
    name: string;
    nativeName: string;
}