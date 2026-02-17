# Configuration des Prix Annuels sur Stripe

## Vue d'ensemble

Votre application affiche une option de facturation annuelle avec 20% de réduction. Pour que cela fonctionne, vous devez créer des prix annuels sur Stripe.

## Prix à créer

### 1. Premium Annuel

- **Montant** : 95,90 € / an (soit 9,99 € × 12 × 0,80)
- **Produit** : Premium (existant)
- **Période** : Annuel
- **Facturation** : Récurrente annuelle

### 2. Pro Annuel

- **Montant** : 287,90 € / an (soit 29,99 € × 12 × 0,80)
- **Produit** : Pro (existant)
- **Période** : Annuel
- **Facturation** : Récurrente annuelle

## Étapes de création sur Stripe

### 1. Accéder au Dashboard Stripe

1. Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
2. Assurez-vous d'être en mode **Test** pour tester d'abord

### 2. Créer le prix Premium Annuel

1. Allez dans **Produits** > Cliquez sur votre produit "Premium"
2. Cliquez sur **Ajouter un autre prix**
3. Configurez :
   - **Modèle de tarification** : Prix standard
   - **Prix** : 95,90 €
   - **Facturation** : Récurrente
   - **Période de facturation** : Annuelle (chaque année)
   - **Description** : Premium - Abonnement annuel (économisez 20%)
4. Cliquez sur **Ajouter un prix**
5. **Copiez l'ID du prix** (format : `price_xxxxxxxxxxxxx`)

### 3. Créer le prix Pro Annuel

1. Allez dans **Produits** > Cliquez sur votre produit "Pro"
2. Cliquez sur **Ajouter un autre prix**
3. Configurez :
   - **Modèle de tarification** : Prix standard
   - **Prix** : 287,90 €
   - **Facturation** : Récurrente
   - **Période de facturation** : Annuelle (chaque année)
   - **Description** : Pro - Abonnement annuel (économisez 20%)
4. Cliquez sur **Ajouter un prix**
5. **Copiez l'ID du prix** (format : `price_xxxxxxxxxxxxx`)

### 4. Mettre à jour le code

Ouvrez `/lib/pricing.ts` et remplacez les placeholders :

```typescript
{
  id: "premium",
  name: "Premium",
  // ...
  stripePriceId: {
    monthly: "price_1T1o2FK4C9lHKe8XMoJ6oj8R",
    annual: "VOTRE_ID_PRIX_PREMIUM_ANNUEL", // ← Remplacez ici
  },
},
{
  id: "pro",
  name: "Pro",
  // ...
  stripePriceId: {
    monthly: "price_1T1o2SK4C9lHKe8XsKkNkoNu",
    annual: "VOTRE_ID_PRIX_PRO_ANNUEL", // ← Remplacez ici
  },
}
```

## Test en mode Test

1. Créez d'abord les prix en **mode Test** sur Stripe
2. Ajoutez les IDs de test dans votre code
3. Testez le flux de paiement avec une [carte de test Stripe](https://stripe.com/docs/testing)
4. Vérifiez que :
   - Le bon montant s'affiche (95,90 € ou 287,90 €)
   - La période de facturation est bien annuelle
   - Le webhook reçoit les événements correctement

## Passage en Production

Une fois les tests validés :

1. Passez en **mode Production** sur Stripe
2. Créez les mêmes prix en mode production
3. Remplacez les IDs de test par les IDs de production dans votre code
4. Déployez la nouvelle version

## Notes importantes

⚠️ **Ne supprimez pas les anciens prix mensuels** - Les clients existants qui paient mensuellement continueront avec leur prix actuel.

⚠️ **Testez le webhook** - Assurez-vous que votre webhook (`/api/stripe/webhook`) gère correctement les événements pour les abonnements annuels.

✅ **Avantages de la facturation annuelle** :

- Moins de frais de transaction Stripe (12 paiements → 1 paiement/an)
- Meilleure rétention client
- Revenus prévisibles

## Vérification

Pour vérifier que tout fonctionne :

1. Sur votre page d'accueil, basculez entre "Mensuel" et "Annuel"
2. Les prix doivent s'afficher correctement :
   - **Premium** : 9,99 €/mois ou 95,90 €/an (soit 7,99 €/mois)
   - **Pro** : 29,99 €/mois ou 287,90 €/an (soit 23,99 €/mois)
3. Cliquez sur "Démarrer Premium" en mode annuel
4. Vérifiez que la page Stripe affiche bien 95,90 € pour un abonnement annuel

## Support

- [Documentation Stripe sur les prix récurrents](https://stripe.com/docs/billing/prices-guide)
- [Guide des abonnements Stripe](https://stripe.com/docs/billing/subscriptions/overview)
