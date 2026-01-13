# Vue Organisée - Documentation

## Description
Une nouvelle vue organisée a été ajoutée à la sidebar de la carte pour permettre de trier et visualiser facilement les différents éléments d'un événement par catégories.

## Fonctionnalités

### Sections Disponibles

1. **Points à sécuriser** 📍
   - Affiche les points réguliers (non équipés)
   - Les 4 premiers sont visibles, avec un compteur pour les autres
   - Cliquez sur un point pour le centrer sur la carte

2. **Parcours** 🏃
   - Affiche tous les parcours de l'événement
   - Cliquez pour zoomer sur le parcours

3. **Équipements de sécurité** 🚗
   - Regroupe les équipements par type (Véhicules, Blocs béton, etc.)
   - Affiche la quantité totale par type
   - Les 4 premiers types sont visibles

4. **Zones** 📌
   - Affiche les points d'intérêt et zones spéciales
   - Zones de départ/arrivée, stands, ravitaillement, etc.

### Interactions

- **Checkbox** : Sélectionner/désélectionner une section entière (fonctionnalité future)
- **Flèche d'expansion** : Déplier/replier une section
- **Clic sur un item** : Focus sur l'élément dans la carte
- **"... X autres"** : Indique le nombre d'items masqués dans une section

## Utilisation

1. Sélectionnez un événement dans le menu déroulant
2. Cliquez sur l'onglet "📋 Vue organisée"
3. Parcourez les différentes sections
4. Cliquez sur les flèches pour déplier/replier les sections
5. Cliquez sur un item pour le visualiser sur la carte

## Design

Le composant respecte le design system de l'application :
- Thème sombre avec dégradés verts
- Animations fluides
- États hover interactifs
- Style cohérent avec le reste de l'interface

## Fichiers Modifiés/Créés

### Nouveaux fichiers
- `organized-list.component.ts` - Logique du composant
- `organized-list.component.html` - Template du composant
- `organized-list.component.scss` - Styles du composant

### Fichiers modifiés
- `points-sidebar.component.ts` - Ajout de l'onglet et intégration
- `points-sidebar.component.html` - Ajout de l'onglet Vue organisée
- `points-sidebar.component.scss` - Styles pour le nouvel onglet

## Améliorations Futures

- Action groupée sur les sections sélectionnées
- Filtres et recherche dans la vue organisée
- Export de sections spécifiques
- Drag & drop pour réorganiser
- Mode d'édition en masse
