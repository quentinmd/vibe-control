# 🎉 Implémentation Authentification & Abonnements - Guide Complet

## ✅ Ce qui a été implémenté

### 1. Infrastructure d'authentification (Supabase Auth)

#### Fichiers créés/modifiés :

- ✅ `lib/supabase-browser.ts` - Client Supabase pour composants client
- ✅ `lib/supabase-server.ts` - Client Supabase pour Server Components
- ✅ `middleware.ts` - Middleware pour rafraîchir les sessions automatiquement
- ✅ `lib/auth-context.tsx` - Context Provider pour l'authentification
- ✅ `app/layout.tsx` - Modifié pour wrapper l'app avec AuthProvider

#### Fonctionnalités :

- Inscription/connexion par email + mot de passe
- Connexion OAuth avec Google
- Gestion automatique des sessions
- Hook `useAuth()` pour accéder à l'utilisateur partout dans l'app

### 2. Pages d'authentification

#### Fichiers créés :

- ✅ `app/login/page.tsx` - Page de connexion professionnelle
- ✅ `app/signup/page.tsx` - Page d'inscription avec confirmation email
- ✅ `app/auth/callback/route.ts` - Handler OAuth pour Google

#### Design :

- Design professionnel cohérent avec la landing page
- Formulaires avec validation
- Messages d'erreur clairs
- Boutons de connexion Google avec icône officielle

### 3. Base de données & migrations

#### Fichier créé :

- ✅ `supabase/migrate-to-auth.sql` - Migration complète pour l'authentification

#### Contenants :

- Table `profiles` : Stocke les profils utilisateurs avec `subscription_tier`
- Table `subscriptions` : Historique des abonnements Stripe
- Fonction `handle_new_user()` : Crée automatiquement un profil à l'inscription
- Fonction `get_user_session_limit()` : Retourne les limites par tier
- Vue `user_stats` : Statistiques d'utilisation par utilisateur
- RLS Policies sécurisées : Les utilisateurs ne peuvent accéder qu'à leurs propres données

### 4. Système de limites & abonnements

#### Fichiers créés :

- ✅ `lib/subscription-limits.ts` - Utilitaires pour vérifier les limites
- ✅ `lib/pricing.ts` - Déjà existant, structure des plans

#### Limites par tier :

| Tier    | Sessions actives | Suggestions/session | Invités | Durée |
| ------- | ---------------- | ------------------- | ------- | ----- |
| Free    | 1                | 50                  | 20      | 4h    |
| Premium | ∞                | ∞                   | ∞       | ∞     |
| Pro     | ∞                | ∞                   | ∞       | ∞     |

### 5. Intégration Stripe

#### Fichiers créés :

- ✅ `app/api/stripe/create-checkout-session/route.ts` - Créer session de paiement
- ✅ `app/api/stripe/webhook/route.ts` - Écouter les événements Stripe
- ✅ `app/api/stripe/create-portal-session/route.ts` - Portail de gestion d'abonnement

#### Événements Stripe gérés :

- `checkout.session.completed` : Abonnement créé → Met à jour le tier
- `customer.subscription.updated` : Abonnement modifié → Sync status
- `customer.subscription.deleted` : Abonnement annulé → Retour au plan gratuit

### 6. Pages utilisateur

#### Fichiers créés :

- ✅ `app/dashboard/page.tsx` - Dashboard utilisateur avec statistiques
- ✅ `app/host/page.tsx` - Modifié pour utiliser l'authentification

#### Modifications host page :

- Remplace localStorage par authentification Supabase
- Vérifie les limites avant de créer une session
- Affiche le profil utilisateur avec son tier
- Bouton de déconnexion
- Message d'erreur si limite atteinte avec CTA upgrade

### 7. Enforcement des limites

#### Fichiers modifiés :

- ✅ `components/GuestSubmission.tsx` - Vérifie les limites de suggestions
- ✅ `app/host/page.tsx` - Vérifie les limites de sessions actives

#### Flow :

1. Utilisateur essaie de créer une session → Vérifie `canCreateSession()`
2. Invité essaie de suggérer un morceau → Vérifie `canAddSuggestion()`
3. Si limite atteinte → Affiche message + lien upgrade

---

## 🔧 Configuration requise

### 1. Variables d'environnement

Créez un fichier `.env.local` avec :

```env
# Supabase (existants)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (nouveaux)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Configuration Supabase Dashboard

#### A. Exécuter la migration SQL

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Ouvrez le fichier `supabase/migrate-to-auth.sql`
3. **IMPORTANT** : Choisissez l'une des options suivantes :

**Option A : Nettoyer les sessions existantes (RECOMMANDÉ pour dev)**

```sql
TRUNCATE TABLE sessions CASCADE;
```

Décommentez cette ligne dans le SQL avant d'exécuter.

**Option B : Migrer vers un utilisateur existant**

1. Créez d'abord un compte via l'interface (signup)
2. Trouvez son UUID dans **Authentication** > **Users**
3. Remplacez `'YOUR_USER_UUID_HERE'` dans le SQL
4. Décommentez la ligne `UPDATE sessions...`

5. Exécutez tout le script SQL

#### B. Activer l'authentification Google OAuth

1. **Supabase Dashboard** > **Authentication** > **Providers**
2. Cliquez sur **Google**
3. Activez "Enable Google provider"
4. Configurez les credentials :
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créez un nouveau projet (ou utilisez existant)
   - Activez "Google+ API"
   - Créez des credentials OAuth 2.0 :
     - **Authorized JavaScript origins** : `https://your-project.supabase.co`
     - **Authorized redirect URIs** : `https://your-project.supabase.co/auth/v1/callback`
   - Copiez le **Client ID** et **Client Secret** dans Supabase

5. Sauvegardez

#### C. Configurer l'email de confirmation

1. **Authentication** > **Email Templates**
2. Modifiez le template "Confirm Signup" si nécessaire
3. Pour le dev, désactivez la confirmation email :
   - **Authentication** > **Providers** > **Email**
   - Décochez "Confirm email"

### 3. Configuration Stripe Dashboard

#### A. Créer les produits et prix

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Products** > **Add Product**

**Produit Premium :**

- Name: `Vibe Control Premium`
- Description: `Accès illimité pour organisateurs réguliers`
- Price: `9.99 EUR` / mois
- Copiez le **Price ID** (commence par `price_...`)

**Produit Pro :**

- Name: `Vibe Control Pro`
- Description: `Fonctionnalités avancées pour professionnels`
- Price: `29.99 EUR` / mois
- Copiez le **Price ID**

3. Mettez à jour `lib/pricing.ts` :

```typescript
stripePriceId: "price_1ABC..."; // Premium
stripePriceId: "price_1XYZ..."; // Pro
```

#### B. Configurer le webhook

1. **Developers** > **Webhooks** > **Add endpoint**
2. **Endpoint URL** : `https://your-domain.com/api/stripe/webhook`
3. **Events to send** :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiez le **Signing secret** (commence par `whsec_...`)
5. Ajoutez-le à `.env.local` comme `STRIPE_WEBHOOK_SECRET`

#### C. Activer le Customer Portal

1. **Settings** > **Billing** > **Customer portal**
2. Activez le portail
3. Configurez les options :
   - ✅ Mettre à jour les informations de paiement
   - ✅ Changer de plan
   - ✅ Annuler l'abonnement
4. Sauvegardez

### 4. Déploiement

Pour que les webhooks Stripe fonctionnent, vous devez déployer sur un domaine public :

#### Option A : Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ajouter les variables d'environnement
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redéployer
vercel --prod
```

#### Option B : Testing local avec Stripe CLI

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks vers localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copier le signing secret affiché et l'ajouter à .env.local
```

---

## 🧪 Tests

### 1. Test du flow d'inscription

```bash
npm run dev
```

1. Allez sur http://localhost:3000
2. Cliquez sur "Commencer gratuitement" → Redirigé vers `/signup`
3. Remplissez le formulaire et créez un compte
4. Vérifiez l'email (ou skip si confirmation désactivée)
5. Connectez-vous via `/login`
6. Vous devriez être redirigé vers `/host`

### 2. Test de la création de session

1. Sur `/host`, entrez un nom de session
2. Cliquez sur "Créer la session"
3. Vérifiez que la session est créée (QR code s'affiche)
4. Essayez de créer une 2e session → Devrait échouer (plan gratuit = 1 session)

### 3. Test du flow de paiement

1. Mettez à jour `lib/pricing.ts` avec vos vrais Price IDs
2. Modifiez `components/landing/PricingTable.tsx` pour ajouter les boutons upgrade
3. Cliquez sur "Passer à Premium"
4. Complétez le checkout (utilisez carte test : `4242 4242 4242 4242`)
5. Après redirection, vérifiez que le tier est mis à jour sur `/host`

Cartes de test Stripe :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`

### 4. Test de l'enforcement des limites

**Plan gratuit :**

1. Créez une session
2. Essayez d'en créer une 2e → Message d'erreur
3. Allez sur la session en tant qu'invité
4. Suggérez 50 morceaux
5. Essayez le 51e → Devrait échouer

**Plan premium (après upgrade) :**

1. Créez plusieurs sessions → Devrait fonctionner
2. Suggérez autant de morceaux que vous voulez → Pas de limite

---

## 📚 Utilisation dans le code

### Utiliser l'authentification dans un composant

```typescript
'use client'
import { useAuth } from '@/lib/auth-context'

export default function MyComponent() {
  const { user, profile, signOut } = useAuth()

  if (!user) {
    return <p>Non connecté</p>
  }

  return (
    <div>
      <p>Bonjour {profile?.full_name}</p>
      <p>Tier: {profile?.subscription_tier}</p>
      <button onClick={signOut}>Déconnexion</button>
    </div>
  )
}
```

### Vérifier les limites

```typescript
import { canCreateSession, canAddSuggestion } from "@/lib/subscription-limits";

// Avant de créer une session
const check = await canCreateSession(userId);
if (!check.allowed) {
  alert(check.reason);
  return;
}

// Avant d'ajouter une suggestion
const check = await canAddSuggestion(sessionId);
if (!check.allowed) {
  alert(check.reason);
  return;
}
```

### Créer un checkout Stripe

```typescript
const handleUpgrade = async (priceId: string, tier: string) => {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, tier }),
  });

  const { sessionUrl } = await response.json();
  window.location.href = sessionUrl;
};
```

### Accéder au portail Stripe

```typescript
const handleManageSubscription = async () => {
  const response = await fetch("/api/stripe/create-portal-session", {
    method: "POST",
  });

  const { url } = await response.json();
  window.location.href = url;
};
```

---

## 🎯 Prochaines étapes

### Court terme

1. ✅ Configurer les variables d'environnement
2. ✅ Exécuter la migration SQL dans Supabase
3. ✅ Activer Google OAuth dans Supabase
4. ✅ Créer les produits Stripe et récupérer les Price IDs
5. ✅ Configurer le webhook Stripe
6. ✅ Tester le flow complet

### Moyen terme

1. Personnaliser les templates d'emails Supabase
2. Ajouter des animations sur les pages auth
3. Implémenter "Mot de passe oublié"
4. Ajouter plus de statistiques au dashboard
5. Créer une page de settings pour modifier le profil

### Long terme

1. Ajouter Spotify OAuth (en plus de YouTube)
2. Analytics avancés pour le plan Pro
3. Système de multi-hôtes (co-modération)
4. API publique pour le plan Pro
5. Webhooks sortants pour intégrations tierces

---

## ❓ FAQ

**Q: Les anciennes sessions (avec localStorage) fonctionnent-elles encore ?**
R: Non, la migration nettoie les sessions. Les utilisateurs devront se créer un compte et créer de nouvelles sessions.

**Q: Peut-on garder les pages guest sans authentification ?**
R: Oui ! Les invités n'ont pas besoin de compte. Seuls les hôtes doivent s'authentifier.

**Q: Comment tester les paiements sans carte réelle ?**
R: Utilisez le mode test de Stripe avec la carte `4242 4242 4242 4242`.

**Q: Que se passe-t-il si un utilisateur annule son abonnement ?**
R: Le webhook Stripe mettra automatiquement son tier à "free". Ses sessions actives resteront actives jusqu'à leur fin naturelle.

**Q: Comment gérer les remboursements ?**
R: Via le Stripe Dashboard > Payments > Recherchez le paiement > Refund.

---

## 🐛 Troubleshooting

### Erreur "Unauthorized" sur /host

→ L'utilisateur n'est pas connecté. Vérifier que `useAuth()` retourne bien un user.

### Webhook Stripe ne fonctionne pas

→ Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
→ Vérifier que l'endpoint est accessible publiquement
→ Regarder les logs dans Stripe Dashboard > Webhooks

### "Profile not found" après signup

→ Vérifier que le trigger `on_auth_user_created` est bien créé
→ Vérifier les logs Supabase dans Dashboard > Logs

### Erreur RLS "new row violates row-level security"

→ Les politiques RLS sont trop restrictives
→ Vérifier que la politique permet l'opération souhaitée

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Supabase : Dashboard > Logs
2. Vérifiez les logs Stripe : Dashboard > Webhooks > Events
3. Vérifiez la console navigateur pour les erreurs frontend
4. Vérifiez les logs server : Terminal où tourne `npm run dev`

---

**Félicitations ! 🎉 Votre système d'authentification et d'abonnements est maintenant opérationnel !**
