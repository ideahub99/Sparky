import { supabase } from '../lib/supabaseClient';

const DODOPAY_API_KEY = import.meta.env.VITE_DODOPAY_API_KEY;
const DODOPAY_API_URL = 'https://api.dodopayments.com/v1';

export interface DodoPaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
}

export interface DodoPaymentStatus {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  created_at: string;
}

/**
 * Create a payment link for plan subscription
 */
export const createPaymentLink = async (
  planId: string,
  amount: number,
  currency: string = 'USD'
): Promise<DodoPaymentLink> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const response = await fetch(`${DODOPAY_API_URL}/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DODOPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        customer_id: user.id,
        metadata: {
          plan_id: planId,
          user_id: user.id,
        },
        success_url: `${window.location.origin}/?payment=success`,
        cancel_url: `${window.location.origin}/?payment=cancelled`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment link');
    }

    const data = await response.json();
    
    // Store payment intent in database
    await supabase.from('payment_history').insert({
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      payment_id: data.id,
      status: 'pending',
    });

    return {
      id: data.id,
      url: data.url,
      amount,
      currency,
    };
  } catch (error) {
    console.error('DodoPay payment link creation failed:', error);
    throw error;
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (paymentId: string): Promise<DodoPaymentStatus> => {
  try {
    const response = await fetch(`${DODOPAY_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DODOPAY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment status');
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Failed to check payment status:', error);
    throw error;
  }
};

/**
 * Process successful payment and upgrade user plan
 */
export const processSuccessfulPayment = async (paymentId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Get payment details from database
    const { data: payment, error: paymentError } = await supabase
      .from('payment_history')
      .select('*, plans(*)')
      .eq('payment_id', paymentId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'completed') {
      return; // Already processed
    }

    // Verify payment with DodoPay
    const status = await checkPaymentStatus(paymentId);
    
    if (status.status !== 'completed') {
      throw new Error('Payment not completed');
    }

    // Update user's plan
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan_id: payment.plan_id,
        credits: supabase.raw(`credits + ${payment.plans.credits}`),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Update payment status
    await supabase
      .from('payment_history')
      .update({ status: 'completed' })
      .eq('payment_id', paymentId);

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Payment Successful',
      message: `Your ${payment.plans.name} plan has been activated!`,
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to process payment:', error);
    throw error;
  }
};

/**
 * Get user payment history
 */
export const getPaymentHistory = async (): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('payment_history')
    .select('*, plans(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
