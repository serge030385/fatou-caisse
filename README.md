# Fatou Caisse

Application web mobile-first pour gérer les ventes, produits, transferts Cameroun, dépenses, stock et rapports de Fatou Shop.

## Démarrage local

```bash
npm install
npm run dev
```

Ouvre ensuite `http://localhost:3000`.

L'application lit et écrit directement dans Supabase. Sans variables Supabase, elle affiche une erreur visible et ne bascule plus sur des données mock/locales.

## Configuration Supabase

1. Créer un projet Supabase.
2. Dans Supabase SQL Editor, exécuter `supabase/schema.sql`.
3. Optionnel: exécuter `supabase/seed.sql` pour charger des données de test.
4. Copier `.env.example` vers `.env.local`.
5. Renseigner:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

6. Relancer `npm run dev`.

Important: après modification de `.env.local`, il faut redémarrer `npm run dev` car Next.js injecte les variables `NEXT_PUBLIC_*` au démarrage.

Note sécurité: le schéma contient des politiques RLS ouvertes pour le MVP sans connexion. Avant une mise en production publique, ajoute une connexion admin et remplace les politiques par `auth.uid() = user_id`.

## Déploiement Vercel

1. Pousser le projet sur GitHub.
2. Importer le dépôt dans Vercel.
3. Ajouter les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Déployer.

En ligne, l'app est installable comme PWA: ouvrir l'URL sur téléphone, puis choisir “Ajouter à l'écran d'accueil”.

## Pages incluses

- Dashboard avec ventes, dépenses, bénéfice estimé, semaine et stock faible.
- Produits avec ajout, modification, suppression et photo par URL.
- Nouvelle vente avec produit existant ou vente libre.
- Transfert Cameroun avec historique et recherche client.
- Dépenses avec date, catégorie et note.
- Stock avec statut OK, stock faible ou rupture.
- Rapports avec résumé jour/semaine, catégories et bouton WhatsApp.

## Évolution prévue

La structure contient déjà `user_id` et `shop_id` dans les tables pour ajouter plus tard: connexion admin, multi-utilisateurs, multi-boutiques, exports PDF et statistiques avancées.
