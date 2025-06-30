import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
let stripePromise
const getStripe = () => {
  if (!stripePromise) {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!stripeKey) {
      console.error('Missing Stripe publishable key')
      return null
    }
    stripePromise = loadStripe(stripeKey)
  }
  return stripePromise
}

/**
 * Create a Stripe checkout session for membership purchases
 */
export const createCheckoutSession = async ({
  orderId,
  lineItems,
  customerEmail,
  successUrl,
  cancelUrl,
  mode = 'payment'
}) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        orderId,
        lineItems,
        customerEmail,
        successUrl,
        cancelUrl,
        mode
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const session = await response.json()
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

/**
 * Redirect to Stripe checkout
 */
export const redirectToCheckout = async (sessionId) => {
  const stripe = await getStripe()
  
  if (!stripe) {
    throw new Error('Stripe failed to load')
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId
  })

  if (error) {
    throw error
  }
}

/**
 * Create a payment intent for rental payments
 */
export const createRentalPaymentIntent = async ({
  rentalId,
  amount,
  currency = 'usd',
  metadata = {}
}) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-rental-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        rentalId,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create payment intent')
    }

    const paymentIntent = await response.json()
    return paymentIntent
  } catch (error) {
    console.error('Error creating rental payment intent:', error)
    throw error
  }
}

/**
 * Confirm a payment intent
 */
export const confirmPayment = async (clientSecret, paymentMethod) => {
  const stripe = await getStripe()
  
  if (!stripe) {
    throw new Error('Stripe failed to load')
  }

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod
  })

  if (error) {
    throw error
  }

  return paymentIntent
}

/**
 * Create Stripe Connect account for machine owners
 */
export const createConnectAccount = async ({
  userId,
  email,
  businessName,
  country = 'US'
}) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-connect-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userId,
        email,
        businessName,
        country
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create Connect account')
    }

    const account = await response.json()
    return account
  } catch (error) {
    console.error('Error creating Connect account:', error)
    throw error
  }
}

/**
 * Get Connect account onboarding link
 */
export const getConnectOnboardingLink = async (accountId, refreshUrl, returnUrl) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-account-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        accountId,
        refreshUrl,
        returnUrl
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create account link')
    }

    const link = await response.json()
    return link
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

/**
 * Format amount for display
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Convert dollars to cents for Stripe
 */
export const dollarsToCents = (dollars) => {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars from Stripe
 */
export const centsToDollars = (cents) => {
  return cents / 100
}

export default getStripe