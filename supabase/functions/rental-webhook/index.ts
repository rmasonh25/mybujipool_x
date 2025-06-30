// Supabase Edge Function for handling rental-specific Stripe webhooks
// This handles payments, payouts, and Connect account events for the rental system

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    // In a real implementation, you would verify the webhook signature here
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    // For demo purposes, we'll parse the body as JSON
    const event = JSON.parse(body)

    console.log('Received rental webhook:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const rentalId = paymentIntent.metadata.rental_id
        
        if (!rentalId) {
          console.log('No rental_id in payment intent metadata')
          break
        }
        
        // Update rental payment status
        const { error: rentalError } = await supabaseClient
          .from('rentals')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', rentalId)

        if (rentalError) {
          console.error('Error updating rental:', rentalError)
          throw rentalError
        }

        // Create payment record
        const { error: paymentError } = await supabaseClient
          .from('rental_payments')
          .insert({
            rental_id: rentalId,
            payment_type: 'rental_payment',
            amount: paymentIntent.amount / 100, // Convert from cents
            stripe_payment_intent_id: paymentIntent.id,
            status: 'completed',
            processed_at: new Date().toISOString()
          })

        if (paymentError) {
          console.error('Error creating payment record:', paymentError)
          throw paymentError
        }

        // Get rental details for owner payout
        const { data: rental, error: fetchError } = await supabaseClient
          .from('rentals')
          .select(`
            *,
            machine:machine_id(owner_id),
            owner:owner_id(machine_owners(*))
          `)
          .eq('id', rentalId)
          .single()

        if (fetchError) {
          console.error('Error fetching rental for payout:', fetchError)
          throw fetchError
        }

        // Create owner payout record (will be processed by payout scheduler)
        if (rental.owner_payout > 0) {
          const { error: payoutError } = await supabaseClient
            .from('rental_payments')
            .insert({
              rental_id: rentalId,
              payment_type: 'owner_payout',
              amount: rental.owner_payout,
              status: 'pending',
              metadata: {
                stripe_account_id: rental.owner.machine_owners?.[0]?.stripe_account_id
              }
            })

          if (payoutError) {
            console.error('Error creating payout record:', payoutError)
            throw payoutError
          }
        }

        console.log('Successfully processed rental payment:', rentalId)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const rentalId = paymentIntent.metadata.rental_id
        
        if (!rentalId) break
        
        // Update rental payment status
        const { error } = await supabaseClient
          .from('rentals')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', rentalId)

        if (error) {
          console.error('Error updating failed rental:', error)
          throw error
        }

        console.log('Rental payment failed:', rentalId)
        break
      }

      case 'transfer.paid': {
        const transfer = event.data.object
        const rentalId = transfer.metadata.rental_id
        
        if (!rentalId) break
        
        // Update payout status
        const { error } = await supabaseClient
          .from('rental_payments')
          .update({
            status: 'completed',
            stripe_transfer_id: transfer.id,
            processed_at: new Date().toISOString()
          })
          .eq('rental_id', rentalId)
          .eq('payment_type', 'owner_payout')

        if (error) {
          console.error('Error updating payout status:', error)
          throw error
        }

        console.log('Owner payout completed:', transfer.id)
        break
      }

      case 'account.updated': {
        const account = event.data.object
        
        // Update machine owner payout capabilities
        const { error } = await supabaseClient
          .from('machine_owners')
          .update({
            payout_enabled: account.payouts_enabled,
            bank_account_verified: account.payouts_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_account_id', account.id)

        if (error) {
          console.error('Error updating owner account:', error)
          throw error
        }

        console.log('Connect account updated:', account.id)
        break
      }

      default:
        console.log(`Unhandled rental webhook event: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Rental webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})