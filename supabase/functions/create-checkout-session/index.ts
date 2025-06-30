import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const { 
      orderId, 
      lineItems, 
      customerEmail, 
      successUrl, 
      cancelUrl, 
      mode = 'payment' 
    } = await req.json()

    // Validate required fields
    if (!orderId || !lineItems || !customerEmail) {
      throw new Error('Missing required fields')
    }

    // Create or retrieve customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          supabase_order_id: orderId
        }
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: orderId,
        supabase_customer_email: customerEmail
      },
      billing_address_collection: 'required',
      shipping_address_collection: mode === 'payment' ? {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP']
      } : undefined,
      automatic_tax: {
        enabled: true
      },
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    })

    // Update order with Stripe session ID and customer ID
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        stripe_session_id: session.id,
        stripe_customer_id: customer.id,
        status: 'processing'
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({
        id: session.id,
        url: session.url,
        customer_id: customer.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})