# Architecture Base de Données - Vibe Control

## Vue d'ensemble

L'architecture utilise PostgreSQL via Supabase avec Row Level Security (RLS) activé pour gérer les permissions de manière sécurisée.

## Tables

### 1. `sessions`

Représente une session de soirée créée par un hôte.

| Colonne    | Type      | Description                      |
| ---------- | --------- | -------------------------------- |
| id         | UUID      | Identifiant unique (PK)          |
| host_id    | UUID      | Référence vers auth.users (hôte) |
| name       | VARCHAR   | Nom de la session                |
| created_at | TIMESTAMP | Date de création                 |
| is_active  | BOOLEAN   | Session active ou terminée       |
| ended_at   | TIMESTAMP | Date de fin (nullable)           |

### 2. `tracks`

Représente les morceaux suggérés par les invités.

| Colonne      | Type      | Description                                 |
| ------------ | --------- | ------------------------------------------- |
| id           | UUID      | Identifiant unique (PK)                     |
| session_id   | UUID      | Référence vers sessions                     |
| title        | VARCHAR   | Titre du morceau                            |
| artist       | VARCHAR   | Artiste                                     |
| album        | VARCHAR   | Album (optionnel)                           |
| cover_url    | TEXT      | URL de la pochette                          |
| spotify_id   | VARCHAR   | ID Spotify pour lecture                     |
| suggested_by | VARCHAR   | Nom/pseudo du suggérant                     |
| status       | VARCHAR   | 'pending', 'approved', 'rejected', 'played' |
| created_at   | TIMESTAMP | Date de suggestion                          |
| order_index  | INTEGER   | Ordre dans la playlist (auto-incrémenté)    |
| played_at    | TIMESTAMP | Date de lecture (nullable)                  |

## Politiques de Sécurité (RLS)

### Sessions

- **Host can manage own sessions** : L'hôte contrôle totalement ses sessions
- **Anyone can read active sessions** : Lecture publique des sessions actives (pour QR Code)

### Tracks

- **Host can manage tracks in own sessions** : L'hôte peut modifier/supprimer les tracks
- **Anyone can read tracks in active sessions** : Lecture publique pour affichage
- **Anyone can suggest tracks** : Insertion autorisée sans auth (status='pending' uniquement)

## Triggers

- **set_order_index** : Auto-incrémente `order_index` quand un track passe à 'approved'

## Configuration Realtime

Activez Realtime sur la table `tracks` dans le dashboard Supabase :

```
Database > Replication > Activez "tracks"
```

Les clients peuvent alors écouter les changements en temps réel :

```typescript
supabase
  .channel("tracks-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "tracks",
    },
    handleChange,
  )
  .subscribe();
```
