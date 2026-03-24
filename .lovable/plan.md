

# Nadvir AI — Plateforme de Pronostics IA Premium

## Vue d'ensemble
Application web premium de pronostics sportifs avec données simulées ultra-réalistes, design dark mode inspiré des apps trading/IA, système d'abonnement Stripe, et multi-sports (football, tennis, basket).

---

## 1. Design System & Branding
- **Dark mode dominant** : fond noir profond (#0A0A0F), cartes sombres (#12121A)
- **Couleurs accent** : bleu électrique (#3B82F6), violet IA (#8B5CF6), vert succès (#10B981), rouge risque (#EF4444)
- **Typographie** : Inter/Outfit, moderne et lisible
- **Animations** : transitions fluides, effets de glow subtils sur les éléments clés
- **Style** : inspiré Bloomberg Terminal / apps trading premium

## 2. Pages & Navigation

### Landing Page (publique)
- Hero section percutante avec stats de performance IA simulées (ex: "78.4% de réussite")
- Démo d'un pronostic en live
- Section pricing (Gratuit vs Premium)
- Témoignages et social proof
- CTA vers inscription

### Authentification
- Login / Register avec Supabase Auth (email + Google)
- Onboarding rapide après inscription

### Dashboard Utilisateur
- Résumé du jour : meilleurs pronostics, matchs à venir
- Statistiques de performance IA (graphiques)
- Pronostics favoris
- Historique des pronostics consultés
- Compteur "1 pronostic gratuit restant" pour les utilisateurs free

### Page Matchs du Jour
- Liste des matchs par sport (Football, Tennis, Basket)
- Chaque carte match affiche : équipes, probabilités, niveau de confiance (SAFE/MODÉRÉ/RISQUÉ)
- Filtres : par sport, par confiance (SAFE only), value bets, meilleurs matchs
- Badge "GRATUIT" sur 1 match, les autres floutés/bloqués pour les non-abonnés

### Page Pronostic Détaillé
- Analyse complète du match :
  - Probabilités 1X2 avec barres visuelles
  - Score probable
  - Over/Under, BTTS
  - Niveau de confiance avec explication
  - Forme récente des 2 équipes (5 derniers matchs W/D/L)
  - Joueurs blessés/absents simulés
  - Classement actuel simulé
  - Explication textuelle du pronostic par l'IA
- Bloqué derrière paywall pour users gratuits (sauf 1/jour)

### Page Abonnement
- Comparaison Free vs Premium
- Intégration Stripe pour abonnement mensuel
- Tunnel de conversion optimisé

### Page Profil
- Infos utilisateur, gestion abonnement, préférences

## 3. Données Simulées Réalistes

### Football
- Équipes réelles des top 5 ligues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1)
- Matchs générés quotidiennement avec probabilités cohérentes (favoris/outsiders)
- Formes récentes simulées (5 derniers matchs)
- Joueurs blessés fictifs mais crédibles
- Classements dynamiques

### Tennis
- Joueurs ATP/WTA connus
- Pronostics match par match avec probabilités

### Basketball
- Équipes NBA
- Pronostics avec over/under points

### Logique de simulation
- Algorithme de génération de probabilités réalistes basé sur un "rating" par équipe
- Cohérence entre favori, cote et probabilité
- Variation quotidienne pour donner l'impression d'une IA vivante

## 4. Système de Monétisation
- **Free** : 1 pronostic détaillé / jour, accès limité aux matchs du jour
- **Premium** (abonnement Stripe) : accès illimité, filtres avancés, value bets, analyses complètes
- Gate de contenu avec CTA upgrade élégant (pas de popup agressif)

## 5. Backend (Lovable Cloud + Supabase)
- **Auth** : Supabase Auth (email + social)
- **Base de données** : tables utilisateurs, abonnements, pronostics, historique
- **Edge Functions** : génération de pronostics simulés, vérification abonnement
- **Stripe** : gestion abonnements via intégration Lovable Stripe

## 6. UX Priorités
- Pronostic compréhensible en 3 secondes (badges de confiance colorés, probabilités visuelles)
- Navigation fluide, mobile-first responsive
- Confiance immédiate grâce au design premium et aux données réalistes
- Performance optimale (pas de chargement lent)

