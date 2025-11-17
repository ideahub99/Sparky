import { supabase } from '../lib/supabaseClient';

const DODOPAY_API_KEY = import.meta.env.VITE_DODOPAY_API_KEY;
const DODOPAY_BASE_URL = 'https://api.dodopayments.com';

export interface DodoCheckoutSession {
  payment_link: string;
  checkout_session_id: string;
}

export interface DodoPaymentStatus {
  payment_id: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  amount: number;
  currency: string;
}

/**
 * Create a checkout session for plan subscription
 * Based on DodoPay API: POST /checkouts
 */
export const createCheckoutSession = async (
  planId: string,
  planName: string,
  amount: number,
  currency: string = 'USD'
): Promise<DodoCheckoutSession> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const response = await fetch(`${DODOPAY_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DODOPAY_API_KEY}`,
      },
      body: JSON.stringify({
        customer: {
          email: user.email,
          name: user.user_metadata?.username || user.email,
        },
        payment: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toUpperCase(),
        },
        success_url: `${window.location.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/?payment=cancelled`,
        metadata: {
          plan_id: planId,
          user_id: user.id,
          plan_name: planName,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    // Store payment intent in database
    await supabase.from('payment_history').insert({
      user_id: user.id,
      plan_id: planId,
      amount,
      currency,
      payment_id: data.checkout_session_id,
      status: 'pending',
    });

    return {
      payment_link: data.payment_link,
      checkout_session_id: data.checkout_session_id,
    };
  } catch (error) {
    console.error('DodoPay checkout session creation failed:', error);
    throw error;
  }
};

/**
 * Get checkout session status
 * Based on DodoPay API: GET /checkouts/{id}
 */
export const getCheckoutSession = async (sessionId: string): Promise<any> => {
  try {
    const response = await fetch(`${DODOPAY_BASE_URL}/checkouts/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DODOPAY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch checkout session');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get checkout session:', error);
    throw error;
  }
};

/**
 * Process successful payment and upgrade user plan
 */
export const processSuccessfulPayment = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Get payment details from database
    const { data: payment, error: paymentError } = await supabase
      .from('payment_history')
      .select('*, plans(*)')
      .eq('payment_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'completed') {
      return; // Already processed
    }

    // Verify payment with DodoPay
    const session = await getCheckoutSession(sessionId);
    
    if (session.status !== 'payment_received' && session.status !== 'completed') {
      throw new Error('Payment not completed');
    }

    // Get current user credits
    const { data: userData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    const currentCredits = userData?.credits || 0;
    const newCredits = currentCredits + payment.plans.credits;

    // Update user's plan and credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan_id: payment.plan_id,
        credits: newCredits,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Update payment status
    await supabase
      .from('payment_history')
      .update({ status: 'completed' })
      .eq('payment_id', sessionId);

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Payment Successful',
      message: `Your ${payment.plans.name} plan has been activated! ${payment.plans.credits} credits added to your account.`,
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

/**
 * Handle DodoPay webhook events
 * Call this from a webhook endpoint
 */
export const handleWebhook = async (event: any): Promise<void> => {
  try {
    const { type, data } = event;

    switch (type) {
      case 'payment.succeeded':
        await processSuccessfulPayment(data.checkout_session_id);
        break;
      
      case 'payment.failed':
        await supabase
          .from('payment_history')
          .update({ status: 'failed' })
          .eq('payment_id', data.checkout_session_id);
        break;
      
      case 'payment.canceled':
        await supabase
          .from('payment_history')
          .update({ status: 'cancelled' })
          .eq('payment_id', data.checkout_session_id);
        break;
      
      default:
        console.log('Unhandled webhook event:', type);
    }
  } catch (error) {
    console.error('Webhook processing failed:', error);
    throw error;
  }
};

