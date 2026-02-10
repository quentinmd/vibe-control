# 🔧 CORRECTION : Activer Realtime dans Supabase

## ❌ Ce que vous avez vu (et qui ne fonctionne PAS)

Vous avez trouvé **"Replication"** dans le menu, qui affiche :

> "Automatically replicate your database changes to external data warehouses..."  
> "We are currently in private alpha..."

**C'est la MAUVAISE fonctionnalité !** Replication = Export vers data warehouses (BigQuery, Snowflake, etc.)

---

## ✅ Ce dont vous avez VRAIMENT besoin

**Supabase Realtime** (écouter les changements en temps réel dans votre app) ≠ Replication

---

## 🎯 SOLUTION : 2 Méthodes au Choix

### Méthode 1 : Via SQL (RECOMMANDÉE - 30 secondes)

1. Dans Supabase Dashboard, allez dans **SQL Editor**
2. AJOUTEZ cette ligne à la fin de votre script `schema.sql` :
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
   ```
3. Cliquez sur **"Run"** (ou RUN si déjà exécuté avant)
4. ✅ Vous devriez voir "Success completed"

**C'est tout !** Le Realtime est maintenant activé pour la table `tracks`.

---

### Méthode 2 : Via Dashboard (ALTERNATIVE)

1. Allez dans **Database** (dans le menu de gauche)
2. Cliquez sur **Tables**
3. Dans la liste des tables, cliquez sur **`tracks`**
4. En haut à droite, vous verrez un toggle **"Enable Realtime"**
5. Activez-le ✅

---

## 🧪 Vérifier que ça fonctionne

### Option A : Via SQL

Exécutez cette requête dans le SQL Editor :

```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Résultat attendu :**

```
tablename
---------
tracks
```

### Option B : Tester dans l'app

1. Lancez votre app : `npm run dev`
2. Ouvrez `/host`, créez une session
3. Dans un autre onglet, ouvrez `/guest/[sessionId]`
4. Suggérez un morceau depuis Guest
5. 🔥 Si le morceau apparaît **instantanément** sur Host → ça marche !

---

## 📝 Mise à Jour de votre script SQL

Pour que ce soit automatique la prochaine fois, modifiez votre fichier :
`supabase/schema.sql`

**Ajoutez à la fin (après les DONNÉES DE TEST) :**

```sql
-- =============================================
-- REALTIME: Activer les notifications
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
```

---

## 🆘 Dépannage

### "Publication supabase_realtime does not exist"

→ Vous utilisez une version ancienne de Supabase. Créez la publication :

```sql
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
```

### "Permission denied for publication"

→ Vous n'êtes pas connecté en tant que postgres. Utilisez la méthode Dashboard (Méthode 2).

### Le Realtime ne fonctionne toujours pas

1. Vérifiez votre `.env.local` (bonnes clés Supabase)
2. Ouvrez la console du navigateur (F12) et cherchez des erreurs
3. Vérifiez que le composant `HostDashboard.tsx` utilise bien `.channel()` et `.on('postgres_changes')`

---

## 📚 Pour Aller Plus Loin

- [Doc Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Publications PostgreSQL](https://supabase.com/docs/guides/realtime/postgres-changes)

---

**🎉 Une fois le Realtime activé, votre app Vibe Control fonctionnera en temps réel !**
