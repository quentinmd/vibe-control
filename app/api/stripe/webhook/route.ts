import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Utiliser le service role key pour bypasser RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Récupérer les détails de la subscription
        if (session.mode === "subscription" && session.subscription) {
          const subscription: any = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );

          const userId = session.metadata?.user_id;
          const tier = session.metadata?.tier || "premium";

          if (userId) {
            // Mettre à jour le profil utilisateur
            await supabase
              .from("profiles")
              .update({ subscription_tier: tier })
              .eq("id", userId);

            // Créer ou mettre à jour l'enregistrement de souscription
            await supabase.from("subscriptions").upsert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0].price.id,
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000,
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000,
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription: any = event.data.object;

        // Trouver l'utilisateur via stripe_customer_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (profile) {
          // Mettre à jour l'enregistrement de souscription
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000,
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000,
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
            })
            .eq("stripe_subscription_id", subscription.id);

          // Si l'abonnement est annulé ou inactif, rétrograder au plan gratuit
          if (
            subscription.status === "canceled" ||
            subscription.status === "incomplete_expired"
          ) {
            await supabase
              .from("profiles")
              .update({ subscription_tier: "free" })
              .eq("id", profile.id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Trouver l'utilisateur via stripe_customer_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (profile) {
          // Rétrograder au plan gratuit
          await supabase
            .from("profiles")
            .update({ subscription_tier: "free" })
            .eq("id", profile.id);

          // Mettre à jour le statut de l'abonnement
          await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
