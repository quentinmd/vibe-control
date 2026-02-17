# Checklist Configuration Post-Implémentation

## ⚠️ ACTIONS REQUISES IMMÉDIATEMENT

### 1. Variables d'environnement (.env.local)

Ajoutez ces nouvelles variables :

```env
# Service Role Key (trouvez-le dans Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Keys (mode test pour commencer)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (après configuration webhook)
```

### 2. Migration Supabase (CRITIQUE)

**Une des deux options OBLIGATOIRE :**

**Option A - Nettoyer les sessions (Recommandé pour dev) :**

1. Ouvrir `supabase/migrate-to-auth.sql`
2. Décommenter la ligne : `TRUNCATE TABLE sessions CASCADE;`
3. Aller dans Supabase Dashboard > SQL Editor
4. Exécuter tout le script

**Option B - Créer un utilisateur et migrer :**

1. Lancer `npm run dev`
2. Aller sur http://localhost:3000/signup
3. Créer un compte
4. Copier l'UUID utilisateur depuis Supabase Dashboard > Authentication > Users
5. Dans `supabase/migrate-to-auth.sql`, remplacer `'YOUR_USER_UUID_HERE'` par cet UUID
6. Décommenter la ligne `UPDATE sessions...`
7. Exécuter le script dans SQL Editor

### 3. Configuration Supabase OAuth

**Google OAuth (pour "Continuer avec Google") :**

1. Supabase Dashboard > Authentication > Providers > Google
2. Activez le provider
3. Allez sur https://console.cloud.google.com/
4. Créez des credentials OAuth 2.0
5. Authorized redirect URI : `https://[votre-project-ref].supabase.co/auth/v1/callback`
6. Copiez Client ID et Secret dans Supabase

### 4. Créer les produits Stripe

1. https://dashboard.stripe.com/test/products
2. Créer "Vibe Control Premium" à 9.99 EUR/mois → Copier Price ID
3. Créer "Vibe Control Pro" à 29.99 EUR/mois → Copier Price ID
4. Mettre à jour `lib/pricing.ts` :

```typescript
// Dans PRICING_PLANS array
{
  id: "premium",
  // ...
  stripePriceId: "price_1ABC..." // ← Mettez le vrai Price ID ici
},
{
  id: "pro",
  // ...
  stripePriceId: "price_1XYZ..." // ← Mettez le vrai Price ID ici
}
```

### 5. Configurer Webhook Stripe

**Pour production :**

1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint : `https://votre-domaine.com/api/stripe/webhook`
3. Select events : `checkout.session.completed`, `customer.subscription.*`
4. Copier Signing secret → `.env.local` comme `STRIPE_WEBHOOK_SECRET`

**Pour développement local :**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copier le webhook secret affiché
```

---

## ✅ Tests rapides

### Test 1 : Signup fonctionne

```bash
npm run dev
# Ouvrir http://localhost:3000/signup
# Créer un compte
# Vérifier que vous êtes redirigé vers /host
```

### Test 2 : Limites fonctionnent

```
# Créer une session sur /host
# Essayer d'en créer une 2e → Devrait afficher erreur "Limite atteinte"
```

### Test 3 : Dashboard accessible

```
# Aller sur http://localhost:3000/dashboard
# Vérifier que vos stats s'affichent
```

---

## 🚀 Ordre d'exécution recommandé

1. ✅ Ajouter variables d'environnement
2. ✅ Exécuter migration SQL (choisir option A ou B)
3. ✅ Tester signup/login
4. ✅ Créer produits Stripe
5. ✅ Mettre à jour Price IDs dans code
6. ✅ Tester flow complet

---

## 📋 Fichiers à consulter

- **Guide complet** : `AUTH-IMPLEMENTATION-GUIDE.md`
- **Migration SQL** : `supabase/migrate-to-auth.sql`
- **Config pricing** : `lib/pricing.ts`
- **Variables env** : `.env.local`

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Variables d'environnement
echo "SUPABASE_SERVICE_ROLE_KEY=your_key" >> .env.local
echo "STRIPE_SECRET_KEY=sk_test_..." >> .env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." >> .env.local

# 2. Lancer le serveur
npm run dev

# 3. Ouvrir http://localhost:3000/signup

# 4. Pendant ce temps, exécuter la migration SQL dans Supabase Dashboard
```

---

**Une fois ces étapes complétées, votre système d'authentification sera 100% fonctionnel ! 🎉**
