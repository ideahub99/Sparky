import type { Plan, NotificationPreferences } from '../types';

export const PLAN_FREE: Plan = {
  id: 1,
  name: 'Free',
  monthly_credits: 10,
  max_daily_credits: 1,
};

// FIX: Changed plan name from 'Pro USD' to 'Pro' to align with the Plan type definition.
export const PLAN_PRO: Plan = {
  id: 3,
  name: 'Pro',
  monthly_credits: 25,
  max_daily_credits: 5,
};

export const PLAN_ENTERPRISE: Plan = {
  id: 4,
  name: 'Enterprise',
  monthly_credits: 5000,
  max_daily_credits: 5000,
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    promotions: true,
    featureUpdates: true,
    generalAlerts: true,
};