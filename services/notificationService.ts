import { supabase } from '../lib/supabaseClient';
import type { Notification } from '../types';

/**
 * Create a notification for a user
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<void> => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      read: false,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
};

/**
 * Subscribe to real-time notification updates
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notification: Notification) => void
) => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Send notification when image generation is complete
 */
export const notifyGenerationComplete = async (
  userId: string,
  toolName: string
): Promise<void> => {
  await createNotification(
    userId,
    'Generation Complete',
    `Your ${toolName} transformation is ready!`,
    'success'
  );
};

/**
 * Send notification when credits are low
 */
export const notifyLowCredits = async (
  userId: string,
  remainingCredits: number
): Promise<void> => {
  if (remainingCredits <= 5) {
    await createNotification(
      userId,
      'Low Credits',
      `You have ${remainingCredits} credits remaining. Consider upgrading your plan.`,
      'warning'
    );
  }
};

/**
 * Send notification when plan is upgraded
 */
export const notifyPlanUpgraded = async (
  userId: string,
  planName: string,
  creditsAdded: number
): Promise<void> => {
  await createNotification(
    userId,
    'Plan Upgraded',
    `Welcome to ${planName}! ${creditsAdded} credits have been added to your account.`,
    'success'
  );
};
