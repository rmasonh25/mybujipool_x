import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret!)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Received webhook:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update order status
        const { error: orderError } = await supabaseClient
          .from('orders')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_session_id', session.id)

        if (orderError) {
          console.error('Error updating order:', orderError)
          throw orderError
        }

        // Get order details to update user membership
        const { data: order, error: fetchError } = await supabaseClient
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              product:product_id(*)
            )
          `)
          .eq('stripe_session_id', session.id)
          .single()

        if (fetchError) {
          console.error('Error fetching order:', fetchError)
          throw fetchError
        }

        // Update user membership status for membership products
        const membershipItems = order.order_items.filter(
          (item: any) => item.product.type === 'membership'
        )

        if (membershipItems.length > 0) {
          const { error: userError } = await supabaseClient
            .from('users')
            .update({
              is_paid_member: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.user_id)

          if (userError) {
            console.error('Error updating user membership:', userError)
            throw userError
          }
        }

        console.log('Successfully processed checkout.session.completed for order:', order.id)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const rentalId = paymentIntent.metadata.rental_id
        
        if (rentalId) {
          // Handle rental payment
          const { error: rentalError } = await supabaseClient
            .from('rentals')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
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

          console.log('Successfully processed rental payment:', rentalId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const rentalId = paymentIntent.metadata.rental_id
        
        if (rentalId) {
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
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        
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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Handle recurring subscription payments
        console.log('Recurring payment succeeded:', invoice.id)
        
        // Update user membership status if needed
        if (invoice.customer && invoice.subscription) {
          // Get customer email to find user
          const customer = await stripe.customers.retrieve(invoice.customer as string)
          
          if (customer && !customer.deleted && customer.email) {
            const { error: userError } = await supabaseClient
              .from('users')
              .update({
                is_paid_member: true,
                updated_at: new Date().toISOString()
              })
              .eq('email', customer.email)

            if (userError) {
              console.error('Error updating user membership for recurring payment:', userError)
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Handle failed payments - maybe suspend membership
        console.log('Payment failed:', invoice.id)
        
        // Optionally suspend user membership after failed payment
        if (invoice.customer) {
          const customer = await stripe.customers.retrieve(invoice.customer as string)
          
          if (customer && !customer.deleted && customer.email) {
            // Could implement logic to suspend membership after multiple failures
            console.log('Payment failed for customer:', customer.email)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription cancellation
        console.log('Subscription cancelled:', subscription.id)
        
        // Update user membership status
        if (subscription.customer) {
          const customer = await stripe.customers.retrieve(subscription.customer as string)
          
          if (customer && !customer.deleted && customer.email) {
            const { error: userError } = await supabaseClient
              .from('users')
              .update({
                is_paid_member: false,
                updated_at: new Date().toISOString()
              })
              .eq('email', customer.email)

            if (userError) {
              console.error('Error updating user membership for cancelled subscription:', userError)
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})