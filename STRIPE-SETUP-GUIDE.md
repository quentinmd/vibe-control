# 🎯 Guide Configuration Stripe - Étape par Étape

## 📋 Checklist avant de commencer

- [ ] Compte Stripe créé sur https://dashboard.stripe.com/register
- [ ] Mode Test activé (switch en haut à droite du dashboard)
- [ ] Navigateur ouvert avec cet onglet + Stripe Dashboard

---

## 🔑 ÉTAPE 1 : Récupérer les clés API Stripe

### 1.1 Allez sur le Dashboard Stripe

🔗 https://dashboard.stripe.com/test/apikeys

### 1.2 Copiez vos clés

Vous verrez deux clés :

**Publishable key (clé publique)** :

```
pk_test_51ABC123...
```

👉 **Copier cette clé**

**Secret key (clé secrète)** :

```
sk_test_51ABC123...
```

⚠️ Cliquez sur "Reveal test key token" puis **copier cette clé**

### 1.3 Ajoutez-les à .env.local

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
# Clés Stripe (MODE TEST)
STRIPE_SECRET_KEY=sk_test_51ABC123...  # ← Collez votre clé secrète ici
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...  # ← Collez votre clé publique ici
```

✅ **Vérification** : Les clés commencent bien par `sk_test_` et `pk_test_` (pas `sk_live_`)

---

## 💳 ÉTAPE 2 : Créer les produits dans Stripe

### 2.1 Créer le produit Premium

1. 🔗 Allez sur https://dashboard.stripe.com/test/products
2. Cliquez sur **"+ Add product"** (en haut à droite)
3. Remplissez le formulaire :

```
Name: Vibe Control Premium
Description: Accès illimité pour organisateurs réguliers
```

4. Dans la section **Pricing** :

```
Pricing model: Standard pricing
Price: 9.99
Currency: EUR (€)
Billing period: Monthly
```

5. Cliquez sur **"Save product"**

6. **IMPORTANT** : Une fois créé, vous verrez le produit. Sous "Pricing", cliquez sur le prix créé
7. Dans la section **API ID**, vous verrez quelque chose comme :

```
price_1ABC123DEF456...
```

👉 **COPIEZ CE PRICE ID** (commence par `price_`)

### 2.2 Créer le produit Pro

Répétez les mêmes étapes :

1. Cliquez sur **"+ Add product"**
2. Remplissez :

```
Name: Vibe Control Pro
Description: Fonctionnalités avancées pour professionnels et événements
```

3. Pricing :

```
Price: 29.99
Currency: EUR (€)
Billing period: Monthly
```

4. Sauvegardez et **COPIEZ LE PRICE ID** du produit Pro

### 2.3 Mettez à jour le code

Ouvrez le fichier `lib/pricing.ts` et remplacez les `stripePriceId: ""` vides :

```typescript
{
  id: "premium",
  // ... autres champs
  stripePriceId: "price_1ABC123...", // ← Price ID Premium
},
{
  id: "pro",
  // ... autres champs
  stripePriceId: "price_1XYZ789...", // ← Price ID Pro
}
```

✅ **Vérification** : Vous avez 2 produits dans Stripe Dashboard et 2 Price IDs copiés

---

## 🔗 ÉTAPE 3 : Configurer le Webhook (pour développement local)

Le webhook permet à Stripe de notifier votre application quand un paiement est effectué.

### Option A : Développement local avec Stripe CLI (Recommandé)

#### 3.1 Installer Stripe CLI

**Sur macOS :**

```bash
brew install stripe/stripe-cli/stripe
```

**Sur Windows :**
Téléchargez depuis https://github.com/stripe/stripe-cli/releases/latest

#### 3.2 Se connecter à Stripe

```bash
stripe login
```

👉 Suivez les instructions (navigateur s'ouvre, autorisez l'accès)

#### 3.3 Lancer le forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Vous verrez un message avec un **webhook signing secret** :

```
> Ready! Your webhook signing secret is whsec_abc123...
```

👉 **COPIEZ CE SECRET** et ajoutez-le à `.env.local` :

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

⚠️ **IMPORTANT** : Laissez cette commande tourner dans un terminal pendant que vous testez !

### Option B : Webhook public (pour production plus tard)

Si vous avez déployé l'app sur Vercel/autre :

1. 🔗 https://dashboard.stripe.com/test/webhooks
2. Cliquez sur **"+ Add endpoint"**
3. Entrez l'URL :

```
https://votre-domaine.vercel.app/api/stripe/webhook
```

4. Sélectionnez les événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Cliquez sur **"Add endpoint"**
6. Copiez le **Signing secret** et ajoutez-le à `.env.local`

---

## 🧪 ÉTAPE 4 : Tester la configuration

### 4.1 Vérifiez votre .env.local

Votre fichier `.env.local` doit maintenant contenir :

```env
# Supabase (déjà présent)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe (nouveau)
STRIPE_SECRET_KEY=sk_test_51ABC...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_abc...
```

### 4.2 Redémarrez le serveur de dev

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### 4.3 Test du flow complet

1. **Créez un compte** : http://localhost:3000/signup
2. **Connectez-vous** : http://localhost:3000/login
3. **Allez sur la page d'accueil** : http://localhost:3000
4. **Scrollez jusqu'au pricing** (section "Nos Offres")
5. **Modifiez temporairement la PricingTable** pour tester

Ouvrez `components/landing/PricingTable.tsx` et ajoutez un bouton de test :

```typescript
// Dans la fonction qui rend chaque plan
{plan.id !== 'free' && (
  <button
    onClick={() => handleUpgrade(plan.stripePriceId!, plan.id)}
    className="w-full btn-primary"
  >
    Tester l'upgrade
  </button>
)}
```

Et ajoutez la fonction :

```typescript
const handleUpgrade = async (priceId: string, tier: string) => {
  try {
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, tier }),
    });

    const data = await response.json();

    if (data.sessionUrl) {
      window.location.href = data.sessionUrl;
    } else {
      alert("Erreur: " + (data.error || "Impossible de créer la session"));
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Erreur lors de la création de la session de paiement");
  }
};
```

6. **Cliquez sur "Tester l'upgrade"**
7. Vous devriez être redirigé vers Stripe Checkout
8. Utilisez la **carte de test** :

```
Numéro : 4242 4242 4242 4242
Date : n'importe quelle date future (ex: 12/34)
CVC : n'importe quel 3 chiffres (ex: 123)
Code postal : n'importe lequel (ex: 75001)
```

9. Complétez le paiement
10. Vous serez redirigé vers `/host`
11. **Vérifiez votre profil** : vous devriez voir "Plan Premium" ou "Plan Pro"

---

## ✅ Vérifications finales

### Dans Stripe Dashboard

1. 🔗 https://dashboard.stripe.com/test/payments
   - Vous devriez voir votre paiement de test

2. 🔗 https://dashboard.stripe.com/test/subscriptions
   - Vous devriez voir votre abonnement actif

3. 🔗 https://dashboard.stripe.com/test/webhooks
   - Dans les logs, vous devriez voir les événements reçus

### Dans Supabase Dashboard

1. 🔗 Supabase Dashboard > Table Editor > `profiles`
   - Votre `subscription_tier` devrait être `premium` ou `pro`

2. Table `subscriptions`
   - Vous devriez voir un enregistrement avec votre `stripe_subscription_id`

### Dans votre application

1. Page `/host` : Badge "Plan Premium" ou "Plan Pro" visible
2. Page `/dashboard` : Statistiques affichées
3. Capacité à créer plusieurs sessions (si Premium/Pro)

---

## 🐛 Problèmes courants

### ❌ "Unauthorized" lors du checkout

**Cause** : Pas connecté ou token expiré
**Solution** : Déconnectez-vous, reconnectez-vous

### ❌ "Invalid price ID"

**Cause** : Price ID incorrect dans `lib/pricing.ts`
**Solution** : Vérifiez que les Price IDs commencent par `price_` et correspondent à ceux dans Stripe Dashboard

### ❌ Le webhook ne fonctionne pas

**Cause** : Stripe CLI pas lancé ou secret incorrect
**Solution** :

1. Vérifiez que `stripe listen` tourne
2. Vérifiez que `STRIPE_WEBHOOK_SECRET` dans `.env.local` correspond
3. Redémarrez le serveur dev après modification

### ❌ Le tier n'est pas mis à jour après paiement

**Cause** : Webhook pas reçu ou erreur dans le handler
**Solution** :

1. Regardez les logs du terminal où tourne `stripe listen`
2. Regardez les logs Supabase
3. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien défini

### ❌ "Failed to construct stripe"

**Cause** : Clé API manquante ou invalide
**Solution** : Vérifiez `.env.local` et redémarrez le serveur

---

## 📞 Besoin d'aide ?

Si vous êtes bloqué, vérifiez dans cet ordre :

1. ✅ Les 3 clés Stripe sont dans `.env.local`
2. ✅ Les 2 Price IDs sont dans `lib/pricing.ts`
3. ✅ `stripe listen` tourne dans un terminal
4. ✅ Le serveur dev a été redémarré après modification de `.env.local`

---

## 🎉 Félicitations !

Une fois ces étapes complétées, votre intégration Stripe est fonctionnelle !

**Prochaines étapes** :

- Testez l'annulation d'abonnement via le portail client
- Testez les différentes cartes de test Stripe
- Passez en mode live quand vous êtes prêt (attention aux clés API !)
