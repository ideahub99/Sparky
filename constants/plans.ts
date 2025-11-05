import type { Plan, NotificationPreferences } from '../types';

export const PLAN_FREE: Plan = {
  id: 1,
  name: 'Free',
  monthly_credits: 10,
  max_daily_credits: 1,
};

export const PLAN_PRO_USD: Plan = {
  id: 3,
  name: 'Pro USD',
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
