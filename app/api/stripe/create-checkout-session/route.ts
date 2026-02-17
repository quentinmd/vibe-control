import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { priceId, tier } = await req.json();

    console.log("Checkout session request:", { priceId, tier });

    if (!priceId || !tier) {
      return NextResponse.json(
        { error: "Missing priceId or tier" },
        { status: 400 },
      );
    }

    // Récupérer l'utilisateur authentifié
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Récupérer le profil utilisateur pour obtenir le stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile) {
      console.error("No profile found for user:", user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Utiliser l'email du profil ou de l'auth user
    const userEmail = profile.email || user.email;
    if (!userEmail) {
      console.error("No email found for user:", user.id);
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    console.log("Profile found:", {
      stripe_customer_id: profile.stripe_customer_id,
      email: userEmail,
    });

    let customerId = profile.stripe_customer_id;

    // Créer un client Stripe si nécessaire
    if (!customerId) {
      console.log("Creating new Stripe customer for:", userEmail);
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Stripe customer created:", customerId);

      // Sauvegarder l'ID client dans le profil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile with customer_id:", updateError);
      }
    }

    // Créer la session de checkout
    console.log("Creating checkout session with:", {
      customer: customerId,
      priceId,
      tier,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/host?success=true`,
      cancel_url: `${req.nextUrl.origin}/#pricing`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    });

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
