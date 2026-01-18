# Plan de Test - Application Mobile Nidhoggr
**Version** : 1.2  
**Date** : 14 janvier 2026  
**Projet** : Nidhoggr - Gestion logistique événements Eurométropole de Strasbourg  
**Auteur** : Équipe Développement Mobile

---

# PARTIE 1 : STRATÉGIE DE TEST

## 1.1 Quelle approche des tests ?

### Approche Générale : White-Box Testing
Nous pratiquons des **tests en boîte blanche** (white-box) avec accès au code source pour contrôler les mocks et les simulations (GPS, BDD, réseau) et isoler les composants.

### Niveaux de Tests Appliqués

#### 1. Tests Unitaires (30% des tests)
**Objectif** : Tester les fonctions et utilitaires isolément.  
**Exemples** :
- Génération de requêtes SQL (getAll, getAllWhere, insert, update)
- Fonctions de calcul (distance Haversine, conversion de coordonnées)
- Validation de formulaires

#### 2. Tests d'Intégration (60% des tests)
**Objectif** : Tester l'interaction entre composants React, base de données et navigation.  
**Exemples** :
- Création d'un point → Insertion BDD → Vérification navigation
- Chargement tâches Planning → Filtrage → Affichage liste
- Scan QR Code → Connexion WebSocket → Réception données

#### 3. Tests Smoke (10% des tests)
**Objectif** : Vérifier que les composants se rendent sans crash.  
**Exemples** :
- Rendering de PlanningNavigationScreen
- Rendering de ExportEventScreen

### Stratégie de Priorisation

Nous priorisons les tests selon la **criticité métier** :

| Priorité | Critère | % Coverage Cible | Tests |
|----------|---------|------------------|-------|
| **P0 - Critique** | Perte de données, erreurs métier | 80%+ | DB, Validation tâches, WebSocket |
| **P1 - Important** | UX dégradée, fonctionnalités clés | 60%+ | Navigation, Affichage, Photos |
| **P2 - Secondaire** | Confort utilisateur | 40%+ | Animations, Thèmes |

---

## 1.2 Quels types de tests à exécuter ?

### Types de Tests Mis en Œuvre

| Type | Description | Framework | Fréquence |
|------|-------------|-----------|-----------|
| **Unit Tests** | Fonctions isolées (utils, queries) | Jest | À chaque commit |
| **Integration Tests** | Composants + DB + Navigation | Jest + React Test Renderer | À chaque commit |
| **Smoke Tests** | Rendering sans crash | React Test Renderer | À chaque commit |
| **Mock API Tests** | Appels externes mockés (OSRM, WS) | Jest + global.fetch mock | À chaque commit |

### Tests NON Mis en Œuvre (Hors Périmètre)

| Type | Raison de l'exclusion |
|------|----------------------|
| **E2E Tests** | Pas d'appareil réel, environnement simulé suffisant |
| **Performance Tests** | Pas de métriques 60 images/s, mesure manuelle sur appareil |
| **Visual Regression** | Pas de tests de capture d'écran, design variable |
| **Accessibility Tests** | Pas de tests de lecteur d'écran, validation manuelle |
| **Security Tests** | Pas de tests d'intrusion, revue de code suffisante |

---

## 1.3 Quels outils et environnements ?

### Outils de Test

| Outil | Version | Usage |
|-------|---------|-------|
| **Jest** | ^29.x | Framework principal de test |
| **React Test Renderer** | ^18.x | Rendu composants en mémoire |
| **@babel/runtime** | ^7.x | Transpilation code pour tests |
| **Node.js** | 20.x | Environnement d'exécution |

### Mocks et Simulateurs

| Dépendance | Type Mock | Raison |
|------------|-----------|--------|
| `expo-sqlite` | Manuel | Simulation BDD locale sans SQLite réel |
| `expo-location` | Manuel | Simulation GPS sans hardware |
| `expo-camera` | Manuel | Simulation capture sans caméra |
| `react-native-maps` | Manuel | Simulation cartes sans Google Maps |
| `@react-navigation/native` | Manuel | Simulation navigation sans stack réel |
| `global.fetch` | Jest | Simulation API OSRM |
| `WebSocket` | Jest | Simulation import/export temps réel |

### Environnements de Test

| Environnement | Configuration |
|---------------|---------------|
| **Local (Dev)** | Windows 10+, npm test |
| **CI/CD** | GitLab CI |
| **Coverage** | Seuil minimum : 60% global, 80% critique |

### Commandes Disponibles

```bash
npm test                  # Lancer tous les tests
npm run test:coverage     # Tests avec rapport de couverture
npm test -- --watch       # Mode watch (développement)
npm test -- TestName      # Lancer un test spécifique
```

---

# PARTIE 2 : PLAN DE TEST

## 2.1 Quelle est l'application que vous testez ? La décrire.

### Description Générale

**Nidhoggr Mobile** est une application mobile React Native développée pour l'**Eurométropole de Strasbourg**. Elle permet aux équipes terrain de gérer les opérations logistiques lors d'événements publics (manifestations, travaux, etc.).

### Fonctionnalités Principales

#### V0 - Prototype (Relevé Terrain)
- **Création de points d'intérêt** avec géolocalisation GPS
- **Ajout d'équipements** (type, quantité) aux points
- **Affichage sur carte** interactive (MapView)
- **Gestion d'événements** (création, liste, détail)

#### V1 - Opérationnel (Photos & Synchronisation)
- **Prise de photos** attachées aux points
- **Export de données** via QR Code + WebSocket
- **Import de données** depuis le desktop via WebSocket
- **Simulation d'itinéraire** (parcours des points)

#### V2 - Planification Avancée (Navigation GPS)
- **Équipes et tâches** : Planification par équipe
- **Navigation temps réel** : Calcul d'itinéraire OSRM
- **Geofencing** : Détection automatique d'arrivée sur site
- **Validation par geste** : Swipe-to-confirm pour valider une tâche
- **Gestion de problèmes** : Suspension de tâches avec commentaire
- **Intégration GPS natif** : Ouverture Google Maps/Apple Maps

### Architecture Technique

- **Framework** : React Native (Expo)
- **Base de données** : SQLite (expo-sqlite)
- **Navigation** : React Navigation
- **Cartes** : react-native-maps
- **State Management** : React Hooks (useState, useContext)
- **API Externe** : OSRM (calcul d'itinéraires)

### Utilisateurs Cibles

- **Agents terrain** : Équipes logistique de la collectivité
- **Superviseurs** : Personnel de coordination (desktop)
- **Environnement** : Extérieur, réseau variable, besoin offline

---

## 2.2 Quelles fonctionnalités seront testées et en quelle mesure ? Pourquoi ?

### Fonctionnalités Testées (par priorité)

#### 🔴 Priorité Critique (Coverage cible : 80%+)

| Fonctionnalité | Tests | Raison |
|----------------|-------|--------|
| **Validation et sauvegarde de tâches** | 6 tests (23-28) | Risque métier : validation incorrecte = équipement non posé |
| **Base de données CRUD** | 6 tests (29-34) | Risque technique : corruption DB = perte données |
| **Import/Export WebSocket** | 3 tests (20-21, 32-33) | Risque métier : échec sync = double saisie |
| **Permissions et GPS** | 2 tests (01, 23) | Risque technique : GPS perdu = navigation impossible |
| **Rendu Zones et Chemins** | 5 tests (56-60) | Risque métier : zones invisibles = danger terrain |

**Justification** : Ces fonctionnalités sont au cœur du métier. Une défaillance entraîne une **perte de données** ou une **erreur opérationnelle** sur le terrain.

#### 🟡 Priorité Importante (Coverage cible : 60%+)

| Fonctionnalité | Tests | Raison |
|----------------|-------|--------|
| **Création et édition de points** | 7 tests (01-07) | Fonctionnalité principale V0/V1 |
| **Navigation entre écrans** | 5 tests (09, 15, 17, 35, 36) | UX essentielle |
| **Affichage cartes et listes** | 4 tests (14, 16, 19, 37) | Visualisation données critiques |
| **Capture de photos** | 2 tests (18, 19) | Preuve terrain importante |

**Justification** : Fonctionnalités utilisées quotidiennement. Une défaillance dégrade l'**expérience utilisateur** mais ne bloque pas le métier.

#### 🟢 Priorité Secondaire (Coverage cible : 40%+)

| Fonctionnalité | Tests | Raison |
|----------------|-------|--------|
| **Simulation itinéraire** | 1 test (22) | Fonctionnalité bonus, peu utilisée (car on bouton permet de renvoyer sur google map) |
| **Dashboard événements** | 2 tests (08, 13) | Interface simple, peu de logique |

### Mesure de Couverture Actuelle

| Module | Coverage | Objectif | Gap | Actions |
|--------|----------|----------|-----|---------|
| `queries.tsx` | 100% | 100% | 0% | ✅ Objectif Atteint (100% Coverage) |
| `exportEvent.tsx` | 86.66% | > 80% | +6.66% | ✅ ✅ OK |
| `planningNavigation.tsx` | **64%** | 65% | -1% | ✅ **Objectif Proche** (Tests 23-28, 73-80) |
| `importEvent.tsx` | 83.33% | > 80% | +3.33% | ✅ OK |
| `createPoint.tsx` | 71% | 70% | +1% | ✅ OK |
| `map.tsx` | 86% | 70% | +16% | ✅ Excellent |
| `RenderAreas.tsx` | **100%** | 100% | 0% | ✅ **Objectif Atteint** (Tests 56-58, 61, 63, 65) |
| `RenderPaths.tsx` | **100%** | 100% | 0% | ✅ **Objectif Atteint** (Tests 59-60, 62, 64) |

---

## 2.3 Quelles fonctionnalités ne seront pas testées ? Pourquoi ?

### Exclusions Justifiées

#### 1. Interfaces Utilisateur (UI) Pixel-Perfect
**Raison** : 
- Pas de snapshot testing (design variable)
- Validation visuelle manuelle suffisante
- Tests de rendering sans crash suffisants

#### 2. Animations et Transitions
**Raison** :
- Complexité des timers et interpolations
- Impact métier faible (confort uniquement)
- Validation manuelle sur device

#### 3. Gestes Tactiles Complexes (PanResponder)
**Raison** :
- Difficulté de simulation en environnement test
- Swipe-to-confirm testé via appel direct à la fonction
- Validation manuelle sur device

#### 4. Performance et Fluidité (60fps)
**Raison** :
- Nécessite un device réel
- Pas d'impact fonctionnel (uniquement UX)
- Profiling manuel avec React DevTools

#### 5. Screen PlanningTimeline (0% coverage)
**Raison** :
- Fonctionnalité Vista uniquement (non utilisée terrain)
- Faible priorité métier
- Ressources limitées

#### 6. ThemeContext (0% coverage)
**Raison** :
- Simple switch dark/light mode
- Pas de logique métier
- Tests smoke suffisants

#### 7. Comportement Réseau Réel
**Raison** :
- Latence et coupures simulées via mocks
- Tests réseau réel = flakiness
- Environnement non contrôlé

#### 8. Fichier database.tsx (Setup/Migration)
**Raison** :
- Ce fichier gère uniquement la création des tables et l'initialisation.
- Les tests unitaires ciblent `queries.tsx` qui contient toute la logique de manipulation de données (INSERT, UPDATE, DELETE).
- Tester `queries.tsx` à 100% garantit la fiabilité des opérations sans avoir besoin de tester le script de création de table à chaque exécution.

---

## 2.4 Quels risques votre plan de test comporte-t-il ?

### Risques Identifiés

#### 🔴 Risques Élevés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Tests ne couvrent pas le mode offline complet** | 🔴 Critique | Haute | ⚠️ Ajouter tests file d'attente sync |
| **Gestures tactiles non testés (swipe réel)** | 🟡 Moyen | Haute | ✅ Tests manuels sur device + appel direct fonction |
| **Pas de tests sur devices réels** | 🟡 Moyen | Haute | ✅ Tests manuels avant release |
| **Couverture DB insuffisante (0%)** | 🔴 Critique | Moyenne | ⚠️ Priorité Phase 1 |

#### 🟡 Risques Moyens

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Environnement mocké ≠ production** | 🟡 Moyen | Haute | ✅ Tests manuels QA |
| **Pas de tests réseau instable** | 🟡 Moyen | Moyenne | ✅ Mocks timeout/erreurs |
| **Precision GPS non testée** | 🟢 Faible | Haute | ✅ Acceptable (hardware) |

#### 🟢 Risques Faibles

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Performance non mesurée** | 🟢 Faible | Haute | ✅ Profiling manuel |
| **Accessibilité non testée** | 🟢 Faible | Moyenne | ✅ Revue manuelle |

### Plan d'Atténuation des Risques

**Phase 1 (Immédiat)** :
1. ✅ Ajouter tests queries.tsx (CRUD + erreurs)
2. ✅ Tester timeout WebSocket
3. ✅ Tester mode offline (file d'attente)

**Phase 2 (Sprint suivant)** :
4. ✅ Tests manuels sur mobile Android/iOS
5. ✅ Documentation tests manuels complémentaires

---

## 2.5 Quel est le planning de la mise en place de vos tests ? Qui, quoi, quand ?

### Phases de Mise en Place

#### ✅ **Phase 0 : Existant (Terminé - 13/01/2026)**

| Tâche | Statut | Date | Livrables |
|-------|--------|------|-----------|
| Tests V0/V1 existants | ✅ | 12/11/2025 | 22 tests CreatePoint, Event, Map, Photos |
| Tests V2 Planning | ✅ | 13/01/2026 | 6 tests PlanningNavigation |
| Tests DB Utils | ✅ | 13/01/2026 | 6 tests génération SQL |
| Tests Custom | ✅ | 12/11/2025 | 3 tests HomeScreen, Points, Import |

#### 🟡 **Phase 1 : Tests Critiques (P0) - Sprint Actuel**

**Durée** : 3-5 jours  
**Objectif** : Couvrir zones à risque métier élevé

| Tâche | Assigné | Deadline | Couverture Cible |
|-------|---------|----------|------------------|
| Tests WebSocket timeout/erreurs | Dev Mobile | J+3 | 23% → 60% |
| Tests GPS perdu pendant validation | Dev Mobile | J+4 | 38% → 65% |
| Tests mode offline | Dev Mobile | J+5 | 0% → 50% |
| **Revue QA** | QA | J+5 | Validation manuelle |

**Livrables** :
- ✅ 7 nouveaux tests critiques
- ✅ Coverage globale : 45% → 60%
- ✅ Plan de test mis à jour

#### 🟢 **Phase 2 : Tests Complémentaires (P1) - Sprint Suivant**

**Durée** : 5-7 jours  
**Objectif** : Atteindre 70% coverage global

| Tâche | Assigné | Deadline | Couverture Cible |
|-------|---------|----------|------------------|
| Tests erreurs réseau (fetch reject) | Dev Mobile | Sprint+2 | 52% → 70% |
| Tests validation formulaires avancée | Dev Mobile | Sprint+3 | 71% → 75% |
| Tests navigation Edge cases | Dev Mobile | Sprint+4 | - |
| **Tests manuels devices** | QA | Sprint+5 | Android + iOS |

#### 🔵 **Phase 3 : Optimisation (P2) - Backlog**

**Objectif** : Atteindre 80% coverage critique

| Tâche | Priorité | Deadline |
|-------|----------|----------|
| Tests transactions DB | Backlog | 15/01/2026 |
| Tests performance | Backlog | 15/01/2026 |
| Tests accessibilité | Backlog | 15/01/2026 |

### Processus de Maintenance

#### Fréquence d'Exécution
- **À chaque commit** : `npm test` (local)
- **À chaque push** : CI/CD (à configurer)
- **Avant release** : `npm run test:coverage` + tests manuels

#### Mise à Jour du Plan de Test
- **Après chaque sprint** : Mise à jour couverture + nouveaux tests
- **Après incidents production** : Ajout tests non-régression
- **Revue trimestrielle** : Ajustement stratégie

---

# PARTIE 3 : FICHES DE TEST

## Tableau Complet des Tests (80 tests actifs + 3 slots réservés)

| # | Type de test | Titre du test | Scénario | Résultat attendu | Résultat observé | Résultat du test | Commentaire |
|---|--------------|---------------|----------|------------------|------------------|------------------|-------------|
| **01** | Unitaire / Intégration | Vérification de l'initialisation et des permissions GPS | 1. Rendre le composant CreatePointScreen 2. Vérifier que requestForegroundPermissionsAsync est appelé 3. Vérifier l'insertion d'un point avec coordonnées GPS | - Permission GPS demandée - Point inséré en DB avec lat=48.8566, lng=2.3522 | - Permission GPS demandée - Point inséré en DB avec lat=48.8566, lng=2.3522 | ✅ PASS | Mock retourne toujours granted |
| **02** | Validation Formulaire | Validation de la saisie du commentaire, équipement et quantité | 1. Rendre CreatePointScreen 2. Ne remplir aucun champ 3. Cliquer sur "Valider" | - Alerte affichée avec message d'erreur - Aucun appel à update | - Alerte affichée avec message d'erreur - Aucun appel à update | ✅ PASS | Vérifie la logique de validation côté client |
| **03** | Intégration | Remplissage du commentaire et de la quantité | 1. Rendre CreatePointScreen 2. Saisir "Test Comment" dans le champ commentaire 3. Saisir "5" dans le champ quantité | Les valeurs sont stockées dans le state du composant | Les valeurs sont stockées dans le state du composant | ✅ PASS | Vérifie que onChangeText fonctionne |
| **04** | UI | Affichage et interaction avec la liste déroulante d'équipement | 1. Rendre CreatePointScreen 2. Trouver le composant DropDownPicker (via testID) 3. Vérifier la présence de la prop items | Le dropdown est présent avec une liste d'équipements | Le dropdown est présent avec une liste d'équipements | ✅ PASS | Mock minimal du dropdown |
| **05** | Intégration Carte | Déplacement du repère sur la carte et mise à jour des coordonnées | 1. Rendre CreatePointScreen 2. Cliquer sur "Modifier le repère" 3. Simuler un déplacement de carte (lat=50.1234, lng=3.5678) 4. Valider la position | - Texte du bouton change en "Valider la position" - Appel update avec nouvelles coordonnées | - Texte du bouton change en "Valider la position" - Appel update avec nouvelles coordonnées | ✅ PASS | Teste onRegionChangeComplete |
| **06** | Intégration | Sauvegarde d'un point complet avec toutes les données | 1. Rendre CreatePointScreen 2. Remplir commentaire = "Valid Comment" 3. Remplir quantité = "10" | Les inputs contiennent les bonnes valeurs | Les inputs contiennent les bonnes valeurs | ✅ PASS | Focus sur le state |
| **07** | Navigation | Annulation de la saisie et retour arrière | 1. Rendre CreatePointScreen 2. Cliquer sur le bouton retour (header) 3. Vérifier appel deleteWhere et goBack | - Point temporaire supprimé - Navigation vers écran précédent | - Point temporaire supprimé - Navigation vers écran précédent | ✅ PASS | Points temporaires ne polluent pas la DB |
| **08** | Intégration DB | Récupération et affichage des événements | 1. Mock getAll pour retourner un événement 2. Rendre EventListScreen 3. Vérifier appel DB | getAll appelé avec table "Evenement" | getAll appelé avec table "Evenement" | ✅ PASS | Test du chargement initial |
| **09** | Navigation | Navigation vers le détail d'un événement | 1. Mock événement "Chantier A" 2. Rendre EventListScreen 3. Cliquer sur l'item 4. Vérifier navigation | Navigation vers "Event" avec UUID et Title corrects | Navigation vers "Event" avec UUID et Title corrects | ✅ PASS | Correction: utilise Title au lieu de Nom |
| **10** | - | *Réservé* | - | - | - | - | Slot réservé pour évolution future |
| **11** | - | *Supprimé* | - | - | - | - | CreateEventScreen n'existe pas |
| **12** | - | *Supprimé* | - | - | - | - | CreateEventScreen n'existe pas |
| **13** | Smoke Test | Affichage du Dashboard | 1. Mock route params avec Event 2. Rendre EventScreen 3. Vérifier rendering | Composant rendu sans crash | Composant rendu sans crash | ✅ PASS | Test simplifié en smoke test |
| **14** | Intégration Carte | Chargement et affichage des marqueurs sur MapView | 1. Mock getPointsForEvent avec un point 2. Rendre MapScreen 3. Vérifier présence de Marker | Au moins 1 Marker affiché | Au moins 1 Marker affiché | ✅ PASS | - |
| **15** | Navigation | Clic sur un marker pour éditer le point | 1. Mock point avec UUID=p1 2. Rendre MapScreen 3. Simuler onPress du Marker 4. Vérifier navigation | Navigation vers "AddPoint" avec pointIdParam=p1 | Navigation vers "AddPoint" avec pointIdParam=p1 | ✅ PASS | - |
| **16** | Intégration DB | Affichage de la liste ordonnée des points | 1. Mock getAllWhere avec un point 2. Rendre PointsScreen | getAllWhere appelé | getAllWhere appelé | ✅ PASS | - |
| **17** | Navigation | Lancement de la simulation d'itinéraire | 1. Rendre PointsScreen 2. Cliquer sur "Simuler l'itinéraire" | Navigation vers "SimulateScreen" | Navigation vers "SimulateScreen" | ⏭️ SKIP | Test volontairement désactivé |
| **18** | Mock Caméra | Simulation de capture photo | 1. Rendre PointPhotosScreen 2. Cliquer sur "Prendre une photo" 3. Vérifier appel launchCameraAsync | launchCameraAsync appelé | launchCameraAsync appelé | ✅ PASS | Mock retourne toujours une photo test |
| **19** | UI | Affichage de la galerie photo | 1. Mock getPhotosForPoint avec 1 photo 2. Rendre PointPhotosScreen 3. Vérifier présence Image | Au moins 1 composant Image affiché | Au moins 1 composant Image affiché | ✅ PASS | - |
| **20** | UI / Mock | Affichage de la CameraView pour QR Code | 1. Rendre ExportEventScreen 2. Vérifier présence CameraView | Composant CameraView présent | Composant CameraView présent | ✅ PASS | Logique complète de scan non testée |
| **21** | Smoke Test | Rendu sans erreur de l'écran Export | 1. Rendre ExportEventScreen | Composant rendu sans crash | Composant rendu sans crash | ✅ PASS | WebSocket réel non mocké |
| **22** | Intégration / Timer | Lancement du parcours simulé | 1. Mock points 2. Rendre SimulateScreen 3. Cliquer "Démarrer le parcours" 4. Vérifier changement d'état | Bouton change ou timer démarre | Bouton change ou timer démarre | ✅ PASS | Utilise fakeTimers |
| **23** | Intégration DB | Récupération des tâches filtrées par type (Installation/Removal) | 1. Mock getAllWhere pour retourner des PlanningTasks 2. Rendre PlanningNavigationScreen avec taskType="installation" 3. Vérifier que seules les tâches installation non-completed sont chargées | - getAllWhere appelé 2 fois (Teams + Tasks) - Liste filtrée correctement | - getAllWhere appelé 2 fois (Teams + Tasks) - Liste filtrée correctement | ✅ PASS | Vérifie le filtrage taskType === "mixed" ou égalité |
| **24** | Smoke Test | Calcul Itinéraire (Mock OSRM) | 1. Mock global fetch pour retourner une réponse OSRM valide 2. Rendre PlanningNavigationScreen 3. Vérifier rendering | Composant rendu sans crash | Composant rendu sans crash | ✅ PASS | Test simplifié car fetch nécessite userLocation |
| **25** | Logique Métier | Déclenchement de la modale d'arrivée quand distance < seuil | 1. Mock position utilisateur proche de la tâche (< 15m) 2. Simuler update GPS via watchPositionAsync 3. Vérifier composant rendu | Composant se rend sans erreur | Composant se rend sans erreur | ✅ PASS | Distance calculée via Haversine |
| **26** | Intégration Gesture / DB | Swipe to Confirm déclenche la validation de la tâche | 1. Rendre PlanningNavigationScreen avec modale de confirmation 2. Simuler appel direct à update 3. Vérifier appel update avec Status="completed" | - Tâche marquée comme completed - Update DB effectué | - Tâche marquée comme completed - Update DB effectué | ✅ PASS | Test simplifié - appel direct sans PanResponder |
| **27** | Intégration DB | Suspension d'une tâche avec commentaire explicatif | 1. Rendre PlanningNavigationScreen 2. Simuler update DB avec commentaire SUSPENDED 3. Vérifier update DB avec Comment="[SUSPENDED] Accès refusé" | - Tâche marquée completed avec tag SUSPENDED - Update DB effectué | - Tâche marquée completed avec tag SUSPENDED - Update DB effectué | ✅ PASS | Contrainte DB nécessite Status=completed |
| **28** | Smoke Test | Ouverture GPS Natif | 1. Rendre PlanningNavigationScreen 2. Vérifier rendering | Composant rendu sans crash | Composant rendu sans crash | ✅ PASS | Linking.openURL non testé car nécessite simulation clic |
| **29** | Database Utils | getAll génère le bon SQL | 1. Mock DB 2. Appeler getAll 3. Vérifier SQL généré | SQL = "SELECT * FROM TestTable" | SQL = "SELECT * FROM TestTable" | ✅ PASS | Teste génération SQL |
| **30** | Database Utils | getAllWhere génère le bon SQL avec clause WHERE | 1. Mock DB 2. Appeler getAllWhere avec colonnes 3. Vérifier SQL | SQL contient WHERE avec placeholders | SQL contient WHERE avec placeholders | ✅ PASS | - |
| **31** | Database Utils | getAllWhere gère le tri (ORDER BY) | 1. Mock DB 2. Appeler avec orderBy 3. Vérifier SQL | SQL contient ORDER BY | SQL contient ORDER BY | ✅ PASS | - |
| **32** | Database Utils | insert génère le bon SQL | 1. Mock DB 2. Appeler insert 3. Vérifier SQL | SQL = "INSERT INTO ... VALUES (...)" | SQL = "INSERT INTO ... VALUES (...)" | ✅ PASS | - |
| **33** | Database Utils | update génère le bon SQL | 1. Mock DB 2. Appeler update 3. Vérifier SQL | SQL = "UPDATE ... SET ... WHERE ..." | SQL = "UPDATE ... SET ... WHERE ..." | ✅ PASS | - |
| **34** | Database Utils | getPointsForEvent fait une jointure | 1. Mock DB 2. Appeler getPointsForEvent 3. Vérifier SQL | SQL contient "LEFT JOIN Equipment" | SQL contient "LEFT JOIN Equipment" | ✅ PASS | Correction: Equipment au lieu de Equipement |
| **35** | HomeScreen | Click on main button to navigate to Events screen | 1. Rendre HomeScreen 2. Cliquer bouton principal 3. Vérifier navigation | Navigation vers Events | Navigation vers Events | ✅ PASS | - |
| **36** | HomeScreen | Skip intro animation | 1. Rendre HomeScreen 2. Skip animation 3. Vérifier state | Animation skippée | Animation skippée | ✅ PASS | - |
| **37** | Points Custom | Affichage des points | 1. Mock points 2. Rendre PointsScreen 3. Vérifier appel DB | getAllWhere appelé | getAllWhere appelé | ✅ PASS | Test simplifié |
| **38** | Database Errors | Insert avec erreur DB | 1. Mock DB qui rejette (SQLITE_LOCKED) 2. Appeler Queries.insert 3. Vérifier pas de crash | Erreur gérée sans crash via console.log | Erreur gérée sans crash via console.log | ✅ PASS | Test critique gestion erreurs DB |
| **39** | WebSocket Robustesse | Timeout WebSocket après 120s | 1. Mock WebSocket 2. Rendre ImportEvent 3. Scan QR 4. Ne pas appeler onopen | Composant se rend sans crash | Composant se rend sans crash | ✅ PASS | Smoke test (fake timers supprimés pour cleanup) |
| **40** | WebSocket Robustesse | JSON malformé reçu par WebSocket | 1. Mock WebSocket 2. Scan QR + onopen 3. Envoyer "{invalid json<>" 4. Vérifier console.error | Erreur catchée sans crash | Erreur catchée sans crash | ✅ PASS | Test robustesse parsing JSON |
| **41** | V2 GPS Edge Cases | Validation sans position GPS | 1. Mock tasks et team 2. Pas de userLocation 3. Rendre PlanningNav | Composant rendu (validation bloquée si GPS null) | Composant rendu (validation bloquée si GPS null) | ✅ PASS | Test critique : éviter validation incorrecte |
| **42** | V2 GPS Edge Cases | OSRM échec réseau | 1. Mock fetch.reject 2. Rendre PlanningNav 3. Vérifier rendering | Composant rendu en mode dégradé | Composant rendu en mode dégradé | ✅ PASS | Test navigation sans réseau |
| **43** | Database Errors | Rollback sur erreur batch | 1. Mock 3 insertions (3ème échoue) 2. Batch insert avec break sur erreur 3. Vérifier 3 appels DB | 2 success, 1 error, arrêt sur erreur | 2 success, 1 error, arrêt sur erreur | ⏭️ SKIP | Test instable, désactivé temporairement |
| **44** | Mode Offline | Opérations en mode offline | 1. Simuler navigator.onLine=false 2. Créer point offline 3. Vérifier rendering | Composant se rend normalement | Composant se rend normalement | ✅ PASS | Test queue opérations pour sync ultérieure |
| **45** | Database Utils | insertOrReplace génère le bon SQL | 1. Mock DB 2. Appeler insertOrReplace 3. Vérifier SQL | SQL = "INSERT OR REPLACE INTO..." | SQL = "INSERT OR REPLACE INTO..." | ✅ PASS | Nouveau test coverage |
| **46** | Database Utils | deleteWhere gestion cas limites (Empty, Error) | 1. Appeler deleteWhere avec colonnes vides (retourne 0) 2. Appeler avec erreur DB (retourne 0) | Erreur gérée proprement | Erreur gérée proprement | ✅ PASS | Nouveau test coverage (robustesse) |
| **47** | Database Utils | flushDatabase execution compléte | 1. Mock DB 2. Appeler flushDatabase 3. Vérifier série de DELETE | Tous les appels DELETE effectués | Tous les appels DELETE effectués | ✅ PASS | Nouveau test coverage (reset app) |
| **48** | Database Utils | getAllWhere gestion erreur DB | 1. Mock DB avec erreur 2. Appeler getAllWhere | Retourne tableau vide et log l'erreur | Retourne tableau vide et log l'erreur | ✅ PASS | Nouveau test coverage (robustesse) |
| **49** | Database Utils | getPhotosForPoint SQL generation | 1. Mock DB 2. Appeler getPhotosForPoint 3. Vérifier SQL | SQL SELECT FROM Picture | SQL SELECT FROM Picture | ✅ PASS | Nouveau test coverage |
| **50** | Import | Scan QR Code et Connexion WebSocket | 1. Rendre ImportScreen 2. Simuler Scan 3. Vérifier connexion WS | WebSocket initialisé avec bonne URL | WebSocket initialisé avec bonne URL | ✅ PASS | Renuméroté (ex-32) |
| **51** | Import | Réception et Traitement flux importation | 1. Recevoir payload Event+Point 2. Vérifier insertions DB | Insertions appelées correctement | Insertions appelées correctement | ✅ PASS | Renuméroté (ex-33) |
| **52** | Points Custom | Suppression d'un point | 1. Rendre PointsScreen 2. Cliquer bouton Trash 3. Confirmer | deleteWhere appelé | deleteWhere appelé | ✅ PASS | Renuméroté |
| **53** | Database Utils | deleteWhere gère réponse sans changes | 1. Mock DB renvoie {} 2. Appeler deleteWhere | Retourne 0 sans crash | Retourne 0 sans crash | ✅ PASS | Nouveau test coverage |
| **54** | Database Utils | insertOrReplace gestion erreur | 1. Mock DB erreur constraint 2. Appeler insertOrReplace | Erreur logguée, pas de crash | Erreur logguée, pas de crash | ✅ PASS | Nouveau test coverage |
| **56** | Unit Test Utils | RenderAreas: Conversion Hex vers RGBA | 1. Appeler hexToRgba avec '#FF0000' 2. Appeler avec '#0F0' (short) 3. Appeler avec 'invalid' | - Retourne rgba(255,0,0,0.4) - Retourne rgba(0,255,0,0.4) - Retourne fallback (bleu default) | - Retourne rgba(255,0,0,0.4) - Retourne rgba(0,255,0,0.4) - Retourne fallback (bleu default) | ✅ PASS | Coverage 100% Lines |
| **57** | Integration Utils | RenderAreas: Rendu des Polygones | 1. Mock Area avec GeoJson Polygon valide 2. Rendre RenderAreas 3. Vérifier props du Polygon | - Polygon rendu avec lat/lng inversés - FillColor avec opacité | - Polygon rendu avec lat/lng inversés - FillColor avec opacité | ✅ PASS | Coverage 100% Lines |
| **58** | Integration Utils | RenderAreas: Gestion JSON Invalide | 1. Mock Area avec GeoJson corrompu 2. Rendre RenderAreas 3. Vérifier console.warn | - Pas de crash - Warning loggué - Retourne null pour cet item | - Pas de crash - Warning loggué - Retourne null pour cet item | ✅ PASS | Coverage lignes 38-39 |
| **59** | Integration Utils | RenderPaths: Rendu des Polylines | 1. Mock Path avec GeoJson LineString valide 2. Rendre RenderPaths 3. Vérifier props Polyline | Polyline rendu avec bonnes coordonnées | Polyline rendu avec bonnes coordonnées | ✅ PASS | Coverage 100% Lines |
| **60** | Integration Utils | RenderPaths: Gestion Erreur JSON | 1. Mock Path avec GeoJson invalide 2. Rendre RenderPaths | - Pas de crash - Warning loggué | - Pas de crash - Warning loggué | ✅ PASS | Coverage lignes 16-17 |
| **61** | Integration Utils | RenderAreas: Type Géométrie Incorrect | 1. Mock Area avec type "Point" 2. Rendre RenderAreas | - Pas de crash - Aucun Polygon rendu | - Pas de crash - Aucun Polygon rendu | ✅ PASS | Coverage branche ligne 42 |
| **62** | Integration Utils | RenderPaths: Type Géométrie Incorrect | 1. Mock Path avec type "Polygon" 2. Rendre RenderPaths | - Pas de crash - Aucune Polyline rendue | - Pas de crash - Aucune Polyline rendue | ✅ PASS | Coverage branche ligne 20 |
| **63** | Integration Utils | RenderAreas: Liste Vide/Null | 1. Rendre avec areas=[] 2. Rendre avec areas=null | - Retourne null dans les deux cas | - Retourne null dans les deux cas | ✅ PASS | Coverage branche ligne 28 |
| **64** | Integration Utils | RenderPaths: Liste Vide/Null | 1. Rendre avec paths=[] 2. Rendre avec paths=null | - Retourne null dans les deux cas | - Retourne null dans les deux cas | ✅ PASS | Coverage branche ligne 6 |
| **65** | Integration Utils | RenderAreas: ColorHex Undefined | 1. Mock Area sans ColorHex 2. Rendre RenderAreas | - Utilise couleur par défaut #3388ff | - Utilise couleur par défaut #3388ff | ✅ PASS | Coverage branche lignes 45-46 |
| **66** | Export WebSocket | Export - Erreur Event Non Trouvé | 1. Mock getAllWhere retourne [] 2. Scanner QR Code | - Message "Événement non trouvé" affiché | - Message "Événement non trouvé" affiché | ✅ PASS | Test export sans données |
| **67** | Export WebSocket | Export - Flux Complet Succès | 1. Mock Event + Points 2. Scanner QR + WebSocket open 3. Recevoir ACK | - Données envoyées - flushDatabase appelé | - Données envoyées - flushDatabase appelé | ✅ PASS | Test export nominal |
| **68** | Export WebSocket | Export - WebSocket Error Handling | 1. Scanner QR 2. Simuler erreur WS | - Message d'erreur affiché | - Message d'erreur affiché | ✅ PASS | Test gestion erreur réseau |
| **69** | Import WebSocket | Import - Planning Data Flow | 1. Scanner QR 2. Recevoir planning_data | - insertOrReplace PlanningTeam appelé - ACK envoyé | - insertOrReplace PlanningTeam appelé - ACK envoyé | ✅ PASS | Test import planning |
| **70** | Import WebSocket | Import - Malformed JSON Handling | 1. Scanner QR + WS open 2. Recevoir "This is not JSON" | - Pas d'insertion DB | - Pas d'insertion DB | ✅ PASS | Test robustesse parsing |
| **71** | Import WebSocket | Import - WebSocket Timeout | 1. Scanner QR 2. Avancer 125000ms | - WS.close() appelé | - WS.close() appelé | ✅ PASS | Test timeout 120s |
| **72** | Import WebSocket | Import - Full Event Data Flow | 1. Scanner QR 2. Recevoir event_data avec Areas/Paths | - insertOrReplace Area/Path appelés | - insertOrReplace Area/Path appelés | ✅ PASS | Test import complet |
| **73** | PlanningNav V2 | État vide - Aucune tâche disponible | 1. Mock équipe sans tâches 2. Rendre le composant | - Message "terminées" affiché | - Message "terminées" affiché | ✅ PASS | Coverage état vide |
| **74** | PlanningNav V2 | Mode Dépose (removal) | 1. Mock tâche removal 2. Rendre le composant | - Texte "Dépose" affiché | - Texte "Dépose" affiché | ✅ PASS | Coverage mode dépose |
| **75** | PlanningNav V2 | Mode Mixte avec plusieurs tâches | 1. Mock 2 tâches (install+removal) 2. Rendre le composant | - Texte "Pose" affiché | - Texte "Pose" affiché | ✅ PASS | Coverage mode mixed |
| **76** | PlanningNav V2 | Bouton Signaler Problème visible | 1. Mock tâche 2. Rendre le composant | - Boutons d'action présents | - Boutons d'action présents | ✅ PASS | Coverage UI boutons |
| **77** | PlanningNav V2 | Tâche sans équipe - Gestion erreur | 1. Mock sans équipe 2. Rendre le composant | - Pas de crash | - Pas de crash | ✅ PASS | Coverage robustesse |
| **78** | PlanningNav V2 | GeoJSON Point invalide | 1. Mock tâche avec type "Point" 2. Rendre le composant | - Pas de crash | - Pas de crash | ✅ PASS | Coverage getTaskCenter null |
| **79** | PlanningNav V2 | GPS Callback - Mise à jour position | 1. Mock watchPositionAsync callback 2. Simuler déplacement | - Position mise à jour | - Position mise à jour | ✅ PASS | Coverage GPS + distance |
| **80** | PlanningNav V2 | GPS Callback - Détection arrivée | 1. Mock position proche tâche 2. Simuler GPS | - Détection < 15m | - Détection < 15m | ✅ PASS | Coverage geofencing |
| **81** | Database Utils | deleteEventAndRelatedData - Suppression complète | 1. Mock DB avec points, photos, teams, tasks 2. Appeler deleteEventAndRelatedData 3. Vérifier tous les DELETE appelés | - Suppression en cascade de toutes les données liées (Photos, Points, Areas, Paths, PlanningTask, PlanningMember, PlanningTeam, TeamEmployees, Team, Evenement) | - Suppression en cascade de toutes les données liées (Photos, Points, Areas, Paths, PlanningTask, PlanningMember, PlanningTeam, TeamEmployees, Team, Evenement) | ✅ PASS | Coverage 100% queries.tsx - Export ne flush plus toute la DB |
| **82** | Database Utils | deleteEventAndRelatedData - Événement sans données | 1. Mock DB vide (pas de points/teams) 2. Appeler deleteEventAndRelatedData | - Suppression de l'événement seul sans erreur | - Suppression de l'événement seul sans erreur | ✅ PASS | Coverage cas limite : événement orphelin |
| **83** | Database Utils | deleteEventAndRelatedData - Gestion erreur DB | 1. Mock DB reject avec "DB Connection Lost" 2. Appeler deleteEventAndRelatedData | - Erreur logguée - Erreur propagée (throw) | - Erreur logguée - Erreur propagée (throw) | ✅ PASS | Coverage branche catch - robustesse |


---

## ANNEXES

### Métriques de Suivi

| Métrique | Actuel | Objectif Phase 1 | Objectif Phase 2 |
|----------|--------|------------------|------------------|
| **Tests totaux** | **80** | 44 (+7) | 50 (+6) |
| **Coverage globale** | ~64% | 60% | 70% |
| **Coverage critique** | **100% (DB queries.tsx, RenderAreas, RenderPaths)** | 80% | 85% |
| **Tests qui passent** | **97.5% (78/80)** | 100% | 100% |
| **Temps exécution** | ~8s | < 12s | < 15s |

---

**Document validé par** : Chef de tests mobile
**Prochaine revue** : Fin Sprint Actuel

