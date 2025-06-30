import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        stripeSecretKey: !!stripeSecretKey
      })
      throw new Error('Missing required environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const { 
      userId, 
      email, 
      businessName, 
      country = 'US' 
    } = await req.json()

    // Validate required fields
    if (!userId || !email) {
      throw new Error('Missing required fields: userId and email')
    }

    console.log('Creating Stripe Connect account for user:', userId)

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        supabase_user_id: userId,
        business_name: businessName || ''
      }
    })

    console.log('Stripe account created:', account.id)

    // Update machine owner profile with Stripe account ID
    const { error: updateError } = await supabaseClient
      .from('machine_owners')
      .update({
        stripe_account_id: account.id,
        payout_enabled: false, // Will be enabled after onboarding
        bank_account_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating machine owner:', updateError)
      throw new Error(`Failed to update machine owner profile: ${updateError.message}`)
    }

    console.log('Machine owner profile updated successfully')

    return new Response(
      JSON.stringify({
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating Connect account:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create Connect account'
    
    if (error.message.includes('environment variables')) {
      errorMessage = 'Server configuration error. Please contact support.'
    } else if (error.message.includes('userId') || error.message.includes('email')) {
      errorMessage = 'Invalid request data. Please try again.'
    } else if (error.type === 'StripeError') {
      errorMessage = `Stripe error: ${error.message}`
    } else if (error.message.includes('machine owner')) {
      errorMessage = 'Failed to update profile. Please try again.'
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})