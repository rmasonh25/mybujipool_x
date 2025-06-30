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
      rentalId, 
      amount, 
      currency = 'usd', 
      metadata = {} 
    } = await req.json()

    // Validate required fields
    if (!rentalId || !amount) {
      throw new Error('Missing required fields: rentalId and amount')
    }

    // Get rental details
    const { data: rental, error: rentalError } = await supabaseClient
      .from('rentals')
      .select(`
        *,
        machine:machine_id(*),
        renter:renter_id(*),
        owner:owner_id(machine_owners(*))
      `)
      .eq('id', rentalId)
      .single()

    if (rentalError || !rental) {
      throw new Error('Rental not found')
    }

    // Calculate platform fee and owner payout
    const platformFeeRate = 0.035 // 3.5%
    const totalAmount = amount
    const platformFee = Math.round(totalAmount * platformFeeRate)
    const ownerPayout = totalAmount - platformFee

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency,
      metadata: {
        rental_id: rentalId,
        machine_id: rental.machine_id,
        renter_id: rental.renter_id,
        owner_id: rental.owner_id,
        platform_fee: platformFee.toString(),
        owner_payout: ownerPayout.toString(),
        ...metadata
      },
      description: `Rental payment for ${rental.machine?.name || 'mining machine'}`,
      receipt_email: rental.renter?.email,
      transfer_group: `rental_${rentalId}`,
    })

    // Update rental with payment intent ID
    const { error: updateError } = await supabaseClient
      .from('rentals')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        platform_fee: platformFee / 100, // Convert back to dollars for storage
        owner_payout: ownerPayout / 100,
        payment_status: 'pending'
      })
      .eq('id', rentalId)

    if (updateError) {
      console.error('Error updating rental:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating rental payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})