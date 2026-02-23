# Guide de mise en production Stripe

## Spotify (Premium/Pro)

### 0. Configurer Spotify Developer Dashboard

1. Créer l'app `Vibe Control` sur https://developer.spotify.com/dashboard
2. Website: URL de production
3. Redirect URIs (obligatoire, exactes):
   - `http://localhost:3000/api/spotify/callback`
   - `https://vibecontrol.live/api/spotify/callback`
   - `https://preview.vibecontrol.live/api/spotify/callback`
4. Activer: `Web API` + `Web Playback SDK`

### Variables d'environnement Spotify

Ajoutez dans Vercel (Production + Preview):

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://vibecontrol.live/api/spotify/callback
```

En Preview, utilisez `SPOTIFY_REDIRECT_URI=https://preview.vibecontrol.live/api/spotify/callback`.

## ✅ Checklist complète

### 1. Activer ton compte Stripe en production

1. Va sur https://dashboard.stripe.com/
2. Bascule en **Mode production** (en haut à gauche)
3. Si pas encore activé, complète :
   - ✅ Vérification d'identité
   - ✅ Informations bancaires
   - ✅ Détails de l'entreprise

---

### 2. Récupérer les clés API de production

1. Va sur https://dashboard.stripe.com/apikeys (en mode production)
2. Copie :
   - **Clé publique** : `pk_live_...`
   - **Clé secrète** : `sk_live_...` (clique "Révéler")

---

### 3. Créer tes produits en production

1. Va sur https://dashboard.stripe.com/products (mode production)
2. **Créer le produit Premium** :
   - Nom : "Premium"
   - Prix : 9.99 EUR / mois
   - Type : Récurrent
   - Copie le **Price ID** (commence par `price_...`)

3. **Créer le produit Pro** :
   - Nom : "Pro"
   - Prix : 29.99 EUR / mois
   - Type : Récurrent
   - Copie le **Price ID**

---

### 4. Configurer le Webhook de production

1. Va sur https://dashboard.stripe.com/webhooks (mode production)
2. Clique **"Ajouter un endpoint"**
3. **URL de l'endpoint** : `https://vibecontrol.live/api/stripe/webhook`
4. **Événements à écouter** :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Clique **"Ajouter un endpoint"**
6. Copie le **Signing secret** (commence par `whsec_...`)

---

### 5. Mettre à jour les variables d'environnement

#### En local (`.env.local`) :

```env
STRIPE_SECRET_KEY=sk_live_TON_VRAI_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_TON_VRAI_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_TON_WEBHOOK_SECRET_PRODUCTION
```

#### Sur Vercel :

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet Vibe Control
3. **Settings** → **Environment Variables**
4. Ajoute/Modifie :
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (celui du webhook de production)

---

### 6. Mettre à jour les Price IDs dans le code

Dans `lib/pricing.ts`, remplace les Price IDs par ceux de production :

```typescript
{
  id: "premium",
  stripePriceId: "price_TON_PRICE_ID_PREMIUM_PRODUCTION",
},
{
  id: "pro",
  stripePriceId: "price_TON_PRICE_ID_PRO_PRODUCTION",
}
```

---

### 7. Redéployer sur Vercel

```bash
git add .
git commit -m "Configure Stripe production keys"
git push origin main
```

Vercel va automatiquement redéployer avec les nouvelles clés.

---

## 🧪 Tester en production

1. **Ne pas utiliser de vraies cartes bancaires** pour tester
2. Utilise les **cartes de test Stripe** :
   - Carte qui fonctionne : `4242 4242 4242 4242`
   - CVV : n'importe quel 3 chiffres
   - Date expiration : n'importe quelle date future

3. Va sur ton site en production : https://vibecontrol.live/
4. Clique sur **"Démarrer Premium"**
5. Vérifie que :
   - ✅ La session Stripe Checkout s'ouvre
   - ✅ Tu peux compléter le paiement
   - ✅ Tu es redirigé vers `/host?success=true`
   - ✅ Ton profil est mis à jour avec le tier `premium`

---

## ⚠️ Important

- **Garde tes clés secrètes PRIVÉES** (ne les commit jamais dans git)
- **Les webhooks de production** doivent pointer vers ton URL de production
- **Teste d'abord en mode test** avant d'activer la production
- **Configure les emails Stripe** pour les reçus de paiement

---

## 🆘 Dépannage

### Erreur "Invalid API Key"

→ Vérifie que tu utilises bien `sk_live_` et non `sk_test_`

### Webhook ne fonctionne pas

→ Vérifie que l'URL du webhook est bien `https://vibecontrol.live/api/stripe/webhook` (avec HTTPS)

### Profil non mis à jour après paiement

→ Vérifie les logs du webhook dans Stripe Dashboard → Webhooks → Voir les événements

---

✅ Une fois tout configuré, ton site acceptera de vrais paiements en production !
