# Plan de Test - API Backend t5-back
**Version** : 1.0  
**Date** : 14 janvier 2026  
**Projet** : t5-back - API REST Gestion logistique événements Eurométropole de Strasbourg  
**Auteur** : Équipe Développement Backend

---

# PARTIE 1 : STRATÉGIE DE TEST

## 1.1 Quelle approche des tests ?

### Approche Générale : White-Box Testing
Nous pratiquons des **tests en boîte blanche** (white-box) avec accès au code source pour contrôler les mocks et les simulations (base de données InMemory, services mockés) et isoler les composants.

### Niveaux de Tests Appliqués

#### 1. Tests Unitaires (100% des tests)
**Objectif** : Tester les services métier isolément avec base de données InMemory.  
**Exemples** :
- CRUD complet sur chaque entité (Create, Read, Update, Delete)
- Validation des règles métier (hachage mot de passe, génération JWT)
- Gestion des cas limites (ID inexistant, données nulles)

### Stratégie de Priorisation

Nous priorisons les tests selon la **criticité métier** :

| Priorité | Critère | % Coverage Cible | Services |
|----------|---------|------------------|----------|
| **P0 - Critique** | Sécurité, authentification | 100% | UserService, JwtService |
| **P1 - Important** | Données métier principales | 100% | EventService, TeamService, SecurityZoneService, PlanningService |
| **P2 - Standard** | Entités secondaires | 100% | AreaService, PathService, PointService, EquipmentService, etc. |

---

## 1.2 Quels types de tests à exécuter ?

### Types de Tests Mis en Œuvre

| Type | Description | Framework | Fréquence |
|------|-------------|-----------|-----------|
| **Unit Tests** | Services isolés avec DB InMemory | xUnit + EF Core InMemory | À chaque commit |
| **Mock Tests** | Services avec dépendances mockées | xUnit + Moq | À chaque commit |

### Tests NON Mis en Œuvre (Hors Périmètre)

| Type | Raison de l'exclusion |
|------|----------------------|
| **E2E Tests** | Tests via Postman/HTTP suffisants en dev |
| **Performance Tests** | Pas de charge prévue importante |
| **Integration Tests DB réelle** | SQLite InMemory suffisant pour valider la logique |
| **Security Penetration Tests** | Revue de code + JWT validation suffisants |

---

## 1.3 Quels outils et environnements ?

### Outils de Test

| Outil | Version | Usage |
|-------|---------|-------|
| **xUnit** | 2.9.3 | Framework principal de test |
| **Moq** | 4.20.70 | Mocking des interfaces (IJwtService) |
| **EF Core InMemory** | 10.0.0 | Base de données de test isolée |
| **coverlet.collector** | 6.0.4 | Collecte de couverture de code |
| **JunitXml.TestLogger** | 4.1.0 | Export résultats pour GitLab CI |

### Configuration des Tests

| Composant | Type Mock/Simulation | Raison |
|-----------|---------------------|--------|
| `AppDbContext` | EF Core InMemory | Isolation complète, pas de SQLite réel |
| `IJwtService` | Moq | Contrôle des tokens générés dans UserService |
| `IConfiguration` | InMemory Config | Configuration JWT pour JwtService |

### Environnements de Test

| Environnement | Configuration |
|---------------|---------------|
| **Local (Dev)** | Windows 10+, `dotnet test` |
| **CI/CD** | GitLab CI avec stages build/test/coverage |
| **Coverage** | Seuil minimum : 100% sur services métier |

### Commandes Disponibles

```bash
dotnet test                                    # Lancer tous les tests
dotnet test --collect:"XPlat Code Coverage"   # Tests avec couverture
dotnet test --filter "FullyQualifiedName~ServiceName"  # Test spécifique
dotnet test --logger "junit;LogFilePath=test-results.xml"  # Export CI
```

---

# PARTIE 2 : PLAN DE TEST

## 2.1 Quelle est l'application que vous testez ? La décrire.

### Description Générale

**t5-back** est une API REST .NET 10.0 développée pour l'**Eurométropole de Strasbourg**. Elle fournit le backend pour la gestion logistique des événements publics, permettant de gérer les équipes, les zones de sécurité, les équipements et la planification des interventions.

### Fonctionnalités Principales

#### Gestion des Événements
- **CRUD Événements** : Création, modification, suppression d'événements
- **Statuts** : Planning, InProgress, Completed, Cancelled
- **Durées** : Dates d'installation et de démontage

#### Gestion des Équipes
- **Équipes** : Création et affectation aux événements
- **Employés** : Gestion des membres d'équipe (relation many-to-many)
- **Plannings** : Attribution de tâches par équipe

#### Gestion Cartographique
- **Points d'intérêt** : Coordonnées GPS, ordre d'affichage
- **Zones (Areas)** : Polygones GeoJSON avec couleur
- **Chemins (Paths)** : Lignes GeoJSON pour itinéraires
- **Zones de sécurité** : Avec équipes d'installation/démontage

#### Ressources et Médias
- **Équipements** : Type, quantité, stockage
- **Photos** : Attachées aux points ou zones de sécurité

#### Authentification
- **Utilisateurs** : CRUD avec hachage BCrypt
- **JWT** : Génération de tokens d'authentification

### Architecture Technique

- **Framework** : ASP.NET Core 10.0
- **ORM** : Entity Framework Core 10.0
- **Base de données** : SQLite
- **Authentification** : JWT (System.IdentityModel.Tokens.Jwt)
- **Hachage** : BCrypt.Net-Next

### Utilisateurs Cibles

- **Application Mobile** : Agents terrain (Nidhoggr Mobile)
- **Application Desktop** : Superviseurs et coordinateurs
- **Intégration** : Synchronisation WebSocket entre apps

---

## 2.2 Quelles fonctionnalités seront testées et en quelle mesure ?

### Fonctionnalités Testées (par priorité)

#### 🔴 Priorité Critique (Coverage : 100%)

| Service | Nb Tests | Raison |
|---------|----------|--------|
| **UserService** | 29 | Authentification, hachage MDP, login, sécurité |
| **JwtService** | 10 | Génération tokens, validation, claims |
| **SecurityZoneService** | 23 | Zones critiques terrain, équipes installation/démontage |
| **PlanningService** | 22 | Planification tâches équipes |

**Justification** : Ces services gèrent l'**authentification** et les **données critiques terrain**. Une défaillance entraîne un blocage de l'application ou une faille de sécurité.

#### 🟡 Priorité Importante (Coverage : 100%)

| Service | Nb Tests | Raison |
|---------|----------|--------|
| **EventService** | 13 | Entité principale, racine de toutes les données |
| **TeamService** | 18 | Gestion équipes avec cascade sur zones |
| **PointService** | 24 | Points GPS avec équipements |
| **ActionService** | 20 | Tâches dans les plannings |

**Justification** : Fonctionnalités principales utilisées quotidiennement par les agents terrain.

#### 🟢 Priorité Standard (Coverage : 100%)

| Service | Nb Tests | Raison |
|---------|----------|--------|
| **AreaService** | 16 | Zones géographiques |
| **PathService** | 17 | Chemins/itinéraires |
| **EquipmentService** | 15 | Gestion équipements |
| **EmployeeService** | 13 | Gestion employés |
| **PictureService** | 20 | Photos attachées |
| **TeamEmployeeService** | 14 | Relation équipes-employés |

### Mesure de Couverture Actuelle

| Service | Coverage | Objectif | Statut |
|---------|----------|----------|--------|
| ActionService | 100% | 100% | ✅ Atteint |
| AreaService | 100% | 100% | ✅ Atteint |
| EmployeeService | 100% | 100% | ✅ Atteint |
| EquipmentService | 100% | 100% | ✅ Atteint |
| EventService | 100% | 100% | ✅ Atteint |
| JwtService | 100% | 100% | ✅ Atteint |
| PathService | 100% | 100% | ✅ Atteint |
| PictureService | 100% | 100% | ✅ Atteint |
| PlanningService | 100% | 100% | ✅ Atteint |
| PointService | 100% | 100% | ✅ Atteint |
| SecurityZoneService | 100% | 100% | ✅ Atteint |
| TeamEmployeeService | 100% | 100% | ✅ Atteint |
| TeamService | 100% | 100% | ✅ Atteint |
| UserService | 100% | 100% | ✅ Atteint |
| DatabaseService | 0% | 0% | ⚪ Exclu |

### ⚠️ Justification du Coverage 100%

> **Pourquoi viser 100% de couverture sur les services ?**
>
> L'**application lourde (desktop)** destinée aux superviseurs et coordinateurs de l'Eurométropole sera **entièrement basée sur cette API**. Les services testés constituent le **cœur métier** de l'ensemble du système :
>
> - **Fiabilité critique** : Toute régression dans un service impacte directement l'application desktop ET mobile
> - **Base de données partagée** : Les deux applications (mobile + desktop) utilisent les mêmes endpoints
> - **Opérations terrain** : Les agents dépendent de ces services pour leurs interventions en temps réel
> - **Sécurité** : L'authentification JWT et le hachage des mots de passe ne tolèrent aucune erreur
>
> **Conséquence** : Un bug non détecté dans un service peut bloquer l'ensemble des utilisateurs terrain et superviseurs. Le coverage 100% garantit que chaque branche de code est testée et validée avant déploiement.

---

## 2.3 Quelles fonctionnalités ne seront pas testées ? Pourquoi ?

### Exclusions Justifiées

#### 1. DatabaseService (0% coverage)
**Raison** : 
- Service utilitaire pour backup/restore SQLite
- Opérations fichier difficiles à tester en InMemory
- Validation manuelle suffisante

#### 2. Controllers (API Endpoints)
**Raison** :
- Les controllers sont des wrappers minces autour des services
- La logique métier est dans les services (testés à 100%)
- Tests d'intégration HTTP via Postman/Swagger

#### 3. Migrations Entity Framework
**Raison** :
- Fichiers générés automatiquement
- Validés par l'exécution de l'application
- Pas de logique métier

#### 4. AppDbContext Configuration
**Raison** :
- Configuration EF Core déclarative
- Validée implicitement par les tests de services

---

## 2.4 Quels risques votre plan de test comporte-t-il ?

### Risques Identifiés

#### 🔴 Risques Élevés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Tests InMemory ≠ SQLite réel** | 🟡 Moyen | Faible | ✅ Comportement quasi-identique, tests manuels |
| **Controllers non testés** | 🟡 Moyen | Faible | ✅ Wrappers simples, tests Swagger |

#### 🟡 Risques Moyens

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Concurrence non testée** | 🟡 Moyen | Faible | ✅ Transactions EF Core gèrent |
| **Performance non mesurée** | 🟢 Faible | Moyenne | ✅ Monitoring production |

#### 🟢 Risques Faibles

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **JWT expiration edge cases** | 🟢 Faible | Faible | ✅ Testé avec tolérance 5s |

---

## 2.5 Quels outils de tests sont utilisés ?

### Outils et Versions

| Outil | Version | Usage |
|-------|---------|-------|
| **xUnit** | 2.9.3 | Test runner, Assertions |
| **Moq** | 4.20.70 | Mocking interfaces |
| **EF Core InMemory** | 10.0.0 | Base de données de test |
| **coverlet.collector** | 6.0.4 | Collecte coverage |
| **ReportGenerator** | CLI | Rapports HTML/Cobertura |

**Commande de test** : `dotnet test --collect:"XPlat Code Coverage"` puis `reportgenerator` pour le rapport.

---

## 2.6 Quel est le planning de la mise en place de vos tests ?

### État Actuel (Terminé - 14/01/2026)

| Tâche | Statut | Tests |
|-------|--------|-------|
| Tests CRUD tous services | ✅ | 200+ tests |
| Tests authentification | ✅ | 39 tests (User+JWT) |
| Tests relations complexes | ✅ | SecurityZone, TeamEmployee |
| Coverage 100% services | ✅ | 14/14 services |
| **Total** | **254 PASS** | **100% réussite** |

### Processus de Maintenance

#### Fréquence d'Exécution
- **À chaque commit** : `dotnet test` (local)
- **À chaque push** : GitLab CI pipeline
- **Avant release** : Coverage report complet

#### Mise à Jour du Plan de Test
- **Après chaque feature** : Ajout tests correspondants
- **Après incidents** : Tests non-régression
- **Revue mensuelle** : Ajustement stratégie

---

# PARTIE 3 : FICHES DE TEST

## 3.1 ActionServiceTests (20 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 01 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer actions d'une BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 02 | Unitaire | GetAllAsync_WithActions_ReturnsAllActions | Récupérer toutes les actions | Liste complète | Liste complète | ✅ PASS | - |
| 03 | Unitaire | GetAllAsync_ReturnsOrderedByDate | Récupérer actions triées | Actions ordonnées chronologiquement | Ordre correct | ✅ PASS | OrderBy Date |
| 04 | Unitaire | GetAllAsync_IncludesSecurityZone | Récupérer avec Include | SecurityZone chargée | SecurityZone présente | ✅ PASS | Include EF Core |
| 05 | Unitaire | GetByIdAsync_ExistingId_ReturnsAction | Récupérer par ID existant | Action trouvée | Action retournée | ✅ PASS | - |
| 06 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | Récupérer par ID inexistant | null | null | ✅ PASS | - |
| 07 | Unitaire | GetByPlanningIdAsync_ReturnsActionsForPlanning | Récupérer par PlanningId | Actions du planning | Actions filtrées | ✅ PASS | - |
| 08 | Unitaire | GetByPlanningIdAsync_NoActionsForPlanning_ReturnsEmpty | Planning sans actions | Liste vide | Liste vide | ✅ PASS | - |
| 09 | Unitaire | GetByPlanningIdAsync_ReturnsOrderedByDate | Actions triées par date | Ordre chronologique | Ordre correct | ✅ PASS | - |
| 10 | Unitaire | GetBySecurityZoneIdAsync_ReturnsActionsForSecurityZone | Récupérer par ZoneId | Actions de la zone | Actions filtrées | ✅ PASS | - |
| 11 | Unitaire | GetBySecurityZoneIdAsync_IncludesPlanning | Include Planning | Planning chargé | Planning présent | ✅ PASS | Include EF Core |
| 12 | Unitaire | CreateAsync_ValidAction_ReturnsCreatedAction | Créer action valide | Action créée | Action en BDD | ✅ PASS | - |
| 13 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID auto-généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 14 | Unitaire | CreateAsync_AllActionTypes_CreatesSuccessfully | Tous types d'action | Création réussie | Tous types OK | ✅ PASS | Enum ActionType |
| 15 | Unitaire | UpdateAsync_ExistingAction_UpdatesAllFields | Modifier action | Champs mis à jour | Update OK | ✅ PASS | - |
| 16 | Unitaire | UpdateAsync_NonExistingAction_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 17 | Unitaire | DeleteAsync_ExistingAction_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 18 | Unitaire | DeleteAsync_NonExistingAction_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 19 | Unitaire | DeleteAllAsync_WithActions_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 20 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.2 AreaServiceTests (16 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 21 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer zones BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 22 | Unitaire | GetAllAsync_WithAreas_ReturnsAllAreas | Récupérer toutes zones | Liste complète | Toutes zones | ✅ PASS | - |
| 23 | Unitaire | GetByIdAsync_ExistingId_ReturnsArea | Récupérer par ID | Zone trouvée | Zone retournée | ✅ PASS | - |
| 24 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 25 | Unitaire | GetByEventIdAsync_ReturnsAreasForEvent | Récupérer par EventId | Zones de l'event | Zones filtrées | ✅ PASS | - |
| 26 | Unitaire | GetByEventIdAsync_NoAreasForEvent_ReturnsEmpty | Event sans zones | Liste vide | Liste vide | ✅ PASS | - |
| 27 | Unitaire | CreateAsync_ValidArea_ReturnsCreatedArea | Créer zone valide | Zone créée | Zone en BDD | ✅ PASS | - |
| 28 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 29 | Unitaire | CreateAsync_WithProvidedGuid_UsesProvidedGuid | Créer avec GUID | GUID utilisé | GUID conservé | ✅ PASS | - |
| 30 | Unitaire | UpdateAsync_ExistingArea_UpdatesAllFields | Modifier zone | Champs mis à jour | Update OK | ✅ PASS | - |
| 31 | Unitaire | UpdateAsync_NonExistingArea_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 32 | Unitaire | DeleteAsync_ExistingArea_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 33 | Unitaire | DeleteAsync_NonExistingArea_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 34 | Unitaire | DeleteAllAsync_WithAreas_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 35 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |
| 36 | Unitaire | CreateAsync_ValidatesColorHexFormat | Créer avec couleur hex | Couleur stockée | Format #RRGGBB | ✅ PASS | Validation couleur |

---

## 3.3 EmployeeServiceTests (13 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 37 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer employés BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 38 | Unitaire | GetAllAsync_WithEmployees_ReturnsAllEmployees | Récupérer tous employés | Liste complète | Tous employés | ✅ PASS | - |
| 39 | Unitaire | GetByIdAsync_ExistingId_ReturnsEmployee | Récupérer par ID | Employé trouvé | Employé retourné | ✅ PASS | - |
| 40 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 41 | Unitaire | CreateAsync_ValidEmployee_ReturnsCreatedEmployee | Créer employé valide | Employé créé | Employé en BDD | ✅ PASS | - |
| 42 | Unitaire | CreateAsync_WithProvidedId_UsesProvidedId | Créer avec ID fourni | ID utilisé | ID conservé | ✅ PASS | - |
| 43 | Unitaire | CreateAsync_WithEmptyId_GeneratesNewId | Créer sans ID | ID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 44 | Unitaire | UpdateAsync_ExistingEmployee_UpdatesAndReturnsEmployee | Modifier employé | Employé mis à jour | Update OK | ✅ PASS | - |
| 45 | Unitaire | UpdateAsync_NonExistingEmployee_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 46 | Unitaire | DeleteAsync_ExistingEmployee_ReturnsTrueAndDeletesEmployee | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 47 | Unitaire | DeleteAsync_NonExistingEmployee_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 48 | Unitaire | DeleteAllAsync_WithEmployees_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 49 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.4 EquipmentServiceTests (15 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 50 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer équipements BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 51 | Unitaire | GetAllAsync_WithEquipments_ReturnsAllEquipments | Récupérer tous équipements | Liste complète | Tous équipements | ✅ PASS | - |
| 52 | Unitaire | GetByIdAsync_ExistingId_ReturnsEquipment | Récupérer par ID | Équipement trouvé | Équipement retourné | ✅ PASS | - |
| 53 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 54 | Unitaire | CreateAsync_ValidEquipment_ReturnsCreatedEquipment | Créer équipement valide | Équipement créé | Équipement en BDD | ✅ PASS | - |
| 55 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 56 | Unitaire | CreateAsync_WithAllStorageTypes_CreatesSuccessfully | Tous types stockage | Création réussie | Tous types OK | ✅ PASS | Enum StorageType |
| 57 | Unitaire | CreateAsync_WithNullStorageType_CreatesSuccessfully | StorageType null | Création réussie | StorageType null OK | ✅ PASS | Nullable |
| 58 | Unitaire | UpdateAsync_ExistingEquipment_UpdatesAllFields | Modifier équipement | Champs mis à jour | Update OK | ✅ PASS | - |
| 59 | Unitaire | UpdateAsync_NonExistingEquipment_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 60 | Unitaire | UpdateAsync_PartialUpdate_UpdatesOnlyProvidedFields | Modification partielle | Seuls champs fournis | Update partiel OK | ✅ PASS | - |
| 61 | Unitaire | DeleteAsync_ExistingEquipment_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 62 | Unitaire | DeleteAsync_NonExistingEquipment_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 63 | Unitaire | DeleteAllAsync_WithEquipments_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 64 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.5 EventServiceTests (13 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 65 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer événements BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 66 | Unitaire | GetAllAsync_WithEvents_ReturnsAllEvents | Récupérer tous événements | Liste complète | Tous événements | ✅ PASS | - |
| 67 | Unitaire | GetByIdAsync_ExistingId_ReturnsEvent | Récupérer par ID | Événement trouvé | Événement retourné | ✅ PASS | - |
| 68 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 69 | Unitaire | CreateAsync_ValidEvent_ReturnsCreatedEvent | Créer événement valide | Événement créé | Événement en BDD | ✅ PASS | - |
| 70 | Unitaire | CreateAsync_WithProvidedId_UsesProvidedId | Créer avec ID fourni | ID utilisé | ID conservé | ✅ PASS | - |
| 71 | Unitaire | CreateAsync_AllEventStatuses_CreatesSuccessfully | Tous statuts | Création réussie | Tous statuts OK | ✅ PASS | Enum EventStatus |
| 72 | Unitaire | UpdateAsync_ExistingEvent_UpdatesAllFields | Modifier événement | Champs mis à jour | Update OK | ✅ PASS | - |
| 73 | Unitaire | UpdateAsync_NonExistingEvent_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 74 | Unitaire | DeleteAsync_ExistingEvent_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 75 | Unitaire | DeleteAsync_NonExistingEvent_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 76 | Unitaire | DeleteAllAsync_WithEvents_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 77 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.6 JwtServiceTests (10 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 78 | Unitaire | GenerateToken_ValidInput_ReturnsNonEmptyToken | Générer token données valides | Token non vide | Token généré | ✅ PASS | - |
| 79 | Unitaire | GenerateToken_ValidInput_ReturnsValidJwtFormat | Vérifier format JWT | 3 parties (header.payload.sig) | Format correct | ✅ PASS | JWT standard |
| 80 | Unitaire | GenerateToken_ValidInput_TokenContainsCorrectClaims | Vérifier claims | Sub, Name, Jti présents | Claims corrects | ✅ PASS | JwtRegisteredClaimNames |
| 81 | Unitaire | GenerateToken_ValidInput_TokenHasCorrectIssuerAndAudience | Vérifier Issuer/Audience | Valeurs config | Valeurs correctes | ✅ PASS | IConfiguration |
| 82 | Unitaire | GenerateToken_ValidInput_TokenExpiresInTwoHours | Vérifier expiration | Expire dans 2h | 2h ± 5s | ✅ PASS | DateTime.UtcNow.AddHours(2) |
| 83 | Unitaire | GenerateToken_TokenCanBeValidated | Valider token généré | Validation réussie | Signature OK | ✅ PASS | HMAC-SHA256 |
| 84 | Unitaire | GenerateToken_DifferentUsers_GenerateDifferentTokens | Tokens différents par user | Tokens uniques | Tokens différents | ✅ PASS | Claims différents |
| 85 | Unitaire | GenerateToken_SameUser_DifferentTimes_GeneratesDifferentTokens | Même user, tokens différents | Tokens uniques (Jti) | Jti différent | ✅ PASS | Guid.NewGuid() dans Jti |
| 86 | Unitaire | GenerateToken_ExtractUserId_ReturnsCorrectValue | Extraire UserId du token | UserId correct | UserId extrait | ✅ PASS | Claim Sub |
| 87 | Unitaire | GenerateToken_ExtractUsername_ReturnsCorrectValue | Extraire Username du token | Username correct | Username extrait | ✅ PASS | Claim Name |

---

## 3.7 PathServiceTests (17 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 88 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer chemins BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 89 | Unitaire | GetAllAsync_WithPaths_ReturnsAllPaths | Récupérer tous chemins | Liste complète | Tous chemins | ✅ PASS | - |
| 90 | Unitaire | GetByIdAsync_ExistingId_ReturnsPath | Récupérer par ID | Chemin trouvé | Chemin retourné | ✅ PASS | - |
| 91 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 92 | Unitaire | GetByEventIdAsync_ReturnsPathsForEvent | Récupérer par EventId | Chemins de l'event | Chemins filtrés | ✅ PASS | - |
| 93 | Unitaire | GetByEventIdAsync_NoPathsForEvent_ReturnsEmpty | Event sans chemins | Liste vide | Liste vide | ✅ PASS | - |
| 94 | Unitaire | CreateAsync_ValidPath_ReturnsCreatedPath | Créer chemin valide | Chemin créé | Chemin en BDD | ✅ PASS | - |
| 95 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 96 | Unitaire | CreateAsync_WithProvidedGuid_UsesProvidedGuid | Créer avec GUID | GUID utilisé | GUID conservé | ✅ PASS | - |
| 97 | Unitaire | UpdateAsync_ExistingPath_UpdatesAllFields | Modifier chemin | Champs mis à jour | Update OK | ✅ PASS | - |
| 98 | Unitaire | UpdateAsync_NonExistingPath_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 99 | Unitaire | UpdateAsync_CanChangeEvent | Changer EventId | EventId modifié | FK mise à jour | ✅ PASS | - |
| 100 | Unitaire | DeleteAsync_ExistingPath_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 101 | Unitaire | DeleteAsync_NonExistingPath_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 102 | Unitaire | DeleteAllAsync_WithPaths_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 103 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |
| 104 | Unitaire | CreateAsync_WithComplexGeoJson_StoresCorrectly | GeoJSON complexe | GeoJSON stocké | LineString OK | ✅ PASS | Format GeoJSON |

---

## 3.8 PictureServiceTests (20 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 105 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer images BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 106 | Unitaire | GetAllAsync_WithPictures_ReturnsAllPictures | Récupérer toutes images | Liste complète | Toutes images | ✅ PASS | - |
| 107 | Unitaire | GetByIdAsync_ExistingId_ReturnsPicture | Récupérer par ID | Image trouvée | Image retournée | ✅ PASS | - |
| 108 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 109 | Unitaire | GetByPointIdAsync_ReturnsPicturesForPoint | Récupérer par PointId | Images du point | Images filtrées | ✅ PASS | - |
| 110 | Unitaire | GetByPointIdAsync_NoPicturesForPoint_ReturnsEmpty | Point sans images | Liste vide | Liste vide | ✅ PASS | - |
| 111 | Unitaire | GetBySecurityZoneIdAsync_ReturnsPicturesForSecurityZone | Récupérer par ZoneId | Images de la zone | Images filtrées | ✅ PASS | - |
| 112 | Unitaire | GetBySecurityZoneIdAsync_NoPicturesForSecurityZone_ReturnsEmpty | Zone sans images | Liste vide | Liste vide | ✅ PASS | - |
| 113 | Unitaire | CreateAsync_ValidPicture_ReturnsCreatedPicture | Créer image valide | Image créée | Image en BDD | ✅ PASS | byte[] data |
| 114 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 115 | Unitaire | CreateAsync_WithProvidedGuid_UsesProvidedGuid | Créer avec GUID | GUID utilisé | GUID conservé | ✅ PASS | - |
| 116 | Unitaire | UpdateAsync_ExistingPicture_UpdatesPictureData | Modifier données | Données mises à jour | byte[] modifié | ✅ PASS | - |
| 117 | Unitaire | UpdateAsync_NonExistingPicture_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 118 | Unitaire | DeleteAsync_ExistingPicture_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 119 | Unitaire | DeleteAsync_NonExistingPicture_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 120 | Unitaire | DeleteAllAsync_WithPictures_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 121 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |
| 122 | Unitaire | TransferFromPointToSecurityZoneAsync_TransfersPicturesAndReturnsCount | Transférer Point→Zone | Count transféré | Count correct | ✅ PASS | - |
| 123 | Unitaire | TransferFromPointToSecurityZoneAsync_NoPicturesForPoint_ReturnsZero | Point sans images | 0 | 0 | ✅ PASS | - |
| 124 | Unitaire | TransferFromPointToSecurityZoneAsync_UpdatesExistingPictures | Vérifier FK update | PointId=null, ZoneId=new | FK mises à jour | ✅ PASS | - |

---

## 3.9 PlanningServiceTests (22 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 125 | Unitaire | GetAllAsync_ReturnsEmptyList_WhenNoPlanningsExist | Récupérer plannings BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 126 | Unitaire | GetAllAsync_ReturnsAllPlannings_WhenPlanningsExist | Récupérer tous plannings | Liste complète | Tous plannings | ✅ PASS | - |
| 127 | Unitaire | GetAllAsync_IncludesActions | Récupérer avec Include Actions | Actions incluses | Actions chargées | ✅ PASS | Include EF Core |
| 128 | Unitaire | GetByIdAsync_ReturnsPlanning_WhenExists | Récupérer par ID | Planning trouvé | Planning retourné | ✅ PASS | - |
| 129 | Unitaire | GetByIdAsync_ReturnsNull_WhenNotExists | ID inexistant | null | null | ✅ PASS | - |
| 130 | Unitaire | GetByIdAsync_IncludesActions | Include Actions | Actions chargées | Actions présentes | ✅ PASS | Include EF Core |
| 131 | Unitaire | GetByTeamIdAsync_ReturnsPlanning_WhenExists | Récupérer par TeamId | Planning trouvé | Planning retourné | ✅ PASS | - |
| 132 | Unitaire | GetByTeamIdAsync_ReturnsNull_WhenTeamHasNoPlanning | Team sans planning | null | null | ✅ PASS | - |
| 133 | Unitaire | GetByTeamIdAsync_ReturnsNull_WhenTeamNotExists | Team inexistante | null | null | ✅ PASS | - |
| 134 | Unitaire | GetItineraryAsync_ReturnsEmptyList_WhenNoActions | Itinéraire sans actions | Liste vide | Liste vide | ✅ PASS | - |
| 135 | Unitaire | GetItineraryAsync_ReturnsActionsOrderedByDate | Itinéraire trié | Actions ordonnées | Ordre chrono | ✅ PASS | OrderBy Date |
| 136 | Unitaire | GetItineraryAsync_IncludesSecurityZoneAndEquipment | Include Zone+Equipment | Relations chargées | Includes OK | ✅ PASS | Include EF Core |
| 137 | Unitaire | GetItineraryAsync_OnlyReturnsActionsForSpecifiedPlanning | Filtrer par planning | Actions du planning | Filtrage correct | ✅ PASS | - |
| 138 | Unitaire | CreateAsync_AddsPlanningToDatabase | Créer planning valide | Planning créé | Planning en BDD | ✅ PASS | - |
| 139 | Unitaire | CreateAsync_UsesProvidedUUID_WhenNotEmpty | Créer avec UUID | UUID utilisé | UUID conservé | ✅ PASS | - |
| 140 | Unitaire | CreateAsync_GeneratesNewUUID_WhenEmpty | Créer sans UUID | UUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 141 | Unitaire | UpdateAsync_UpdatesTeamId | Modifier TeamId | TeamId mis à jour | FK mise à jour | ✅ PASS | - |
| 142 | Unitaire | UpdateAsync_ReturnsNull_WhenPlanningNotExists | Modifier inexistant | null | null | ✅ PASS | - |
| 143 | Unitaire | DeleteAsync_RemovesPlanningFromDatabase | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 144 | Unitaire | DeleteAsync_ReturnsFalse_WhenPlanningNotExists | Supprimer inexistant | false | false | ✅ PASS | - |
| 145 | Unitaire | DeleteAllAsync_RemovesAllPlannings | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 146 | Unitaire | DeleteAllAsync_ReturnsZero_WhenNoPlannings | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.10 PointServiceTests (24 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 147 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer points BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 148 | Unitaire | GetAllAsync_WithPoints_ReturnsAllPoints | Récupérer tous points | Liste complète | Tous points | ✅ PASS | - |
| 149 | Unitaire | GetAllAsync_IncludesEquipment | Include Equipment | Équipement chargé | Équipement présent | ✅ PASS | Include EF Core |
| 150 | Unitaire | GetByIdAsync_ExistingId_ReturnsPoint | Récupérer par ID | Point trouvé | Point retourné | ✅ PASS | - |
| 151 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 152 | Unitaire | GetByIdAsync_IncludesEquipment | Include Equipment | Équipement chargé | Équipement présent | ✅ PASS | Include EF Core |
| 153 | Unitaire | GetByEventIdAsync_ReturnsPointsForEvent | Récupérer par EventId | Points de l'event | Points filtrés | ✅ PASS | - |
| 154 | Unitaire | GetByEventIdAsync_ReturnsOrderedByOrder | Tri par Order | Points ordonnés | Ordre correct | ✅ PASS | OrderBy Order |
| 155 | Unitaire | GetByEventIdAsync_NoPointsForEvent_ReturnsEmpty | Event sans points | Liste vide | Liste vide | ✅ PASS | - |
| 156 | Unitaire | CreateAsync_ValidPoint_ReturnsCreatedPoint | Créer point valide | Point créé | Point en BDD | ✅ PASS | - |
| 157 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 158 | Unitaire | CreateAsync_WithProvidedGuid_UsesProvidedGuid | Créer avec GUID | GUID utilisé | GUID conservé | ✅ PASS | - |
| 159 | Unitaire | CreateAsync_DuplicateGuid_ThrowsException | GUID dupliqué | Exception levée | Exception | ✅ PASS | Contrainte unique |
| 160 | Unitaire | CreateAsync_WithEquipment_LinksEquipment | Créer avec équipement | Lien FK créé | EquipmentId OK | ✅ PASS | - |
| 161 | Unitaire | UpdateAsync_ExistingPoint_UpdatesAllFields | Modifier point | Champs mis à jour | Update OK | ✅ PASS | - |
| 162 | Unitaire | UpdateAsync_NonExistingPoint_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 163 | Unitaire | DeleteAsync_ExistingPoint_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 164 | Unitaire | DeleteAsync_NonExistingPoint_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 165 | Unitaire | DeleteAllAsync_WithPoints_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 166 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |
| 167 | Unitaire | CreateAsync_ValidCoordinates (90, 180) | Coords limites max | Point créé | Nord-Est OK | ✅ PASS | Lat/Lng valides |
| 168 | Unitaire | CreateAsync_ValidCoordinates (-90, -180) | Coords limites min | Point créé | Sud-Ouest OK | ✅ PASS | Lat/Lng valides |
| 169 | Unitaire | CreateAsync_ValidCoordinates (0, 0) | Coords origine | Point créé | Équateur OK | ✅ PASS | Lat/Lng valides |
| 170 | Unitaire | CreateAsync_ValidCoordinates (48.86, 2.35) | Coords Paris | Point créé | Paris OK | ✅ PASS | Coords réelles |

---

## 3.11 SecurityZoneServiceTests (23 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 171 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer zones BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 172 | Unitaire | GetAllAsync_WithSecurityZones_ReturnsAllWithIncludes | Récupérer avec Includes | Zones + relations | Includes OK | ✅ PASS | Include EF Core |
| 173 | Unitaire | GetByIdAsync_ExistingId_ReturnsSecurityZone | Récupérer par ID | Zone trouvée | Zone retournée | ✅ PASS | - |
| 174 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 175 | Unitaire | GetByIdAsync_IncludesAllNavigationProperties | Include toutes relations | Toutes relations chargées | Includes complets | ✅ PASS | Include EF Core |
| 176 | Unitaire | GetByEventIdAsync_ReturnsSecurityZonesForEvent | Récupérer par EventId | Zones de l'event | Zones filtrées | ✅ PASS | - |
| 177 | Unitaire | CreateAsync_ValidSecurityZone_ReturnsCreatedZone | Créer zone valide | Zone créée | Zone en BDD | ✅ PASS | - |
| 178 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 179 | Unitaire | UpdateAsync_ExistingSecurityZone_UpdatesAllFields | Modifier zone | Champs mis à jour | Update OK | ✅ PASS | - |
| 180 | Unitaire | UpdateAsync_NonExistingSecurityZone_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 181 | Unitaire | DeleteAsync_ExistingSecurityZone_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 182 | Unitaire | DeleteAsync_NonExistingSecurityZone_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 183 | Unitaire | DeleteAllAsync_WithSecurityZones_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 184 | Unitaire | AssignInstallationTeamAsync_ValidIds_AssignsTeam | Assigner équipe install | InstallationTeamId set | FK mise à jour | ✅ PASS | - |
| 185 | Unitaire | AssignInstallationTeamAsync_NonExistingZone_ReturnsNull | Zone inexistante | null | null | ✅ PASS | - |
| 186 | Unitaire | UnassignInstallationTeamAsync_WithAssignedTeam_RemovesTeam | Désassigner install | InstallationTeamId null | FK nullifiée | ✅ PASS | - |
| 187 | Unitaire | UnassignInstallationTeamAsync_NonExistingZone_ReturnsNull | Zone inexistante | null | null | ✅ PASS | - |
| 188 | Unitaire | AssignRemovalTeamAsync_ValidIds_AssignsTeam | Assigner équipe démontage | RemovalTeamId set | FK mise à jour | ✅ PASS | - |
| 189 | Unitaire | AssignRemovalTeamAsync_NonExistingZone_ReturnsNull | Zone inexistante | null | null | ✅ PASS | - |
| 190 | Unitaire | UnassignRemovalTeamAsync_WithAssignedTeam_RemovesTeam | Désassigner démontage | RemovalTeamId null | FK nullifiée | ✅ PASS | - |
| 191 | Unitaire | UnassignRemovalTeamAsync_NonExistingZone_ReturnsNull | Zone inexistante | null | null | ✅ PASS | - |
| 192 | Unitaire | CanAssignBothTeams_DifferentTeams_Success | 2 équipes différentes | Les 2 assignées | 2 FK distinctes | ✅ PASS | - |
| 193 | Unitaire | CanAssignSameTeamToBoth_Success | Même équipe 2 rôles | Équipe assignée 2x | Même TeamId | ✅ PASS | - |

---

## 3.12 TeamEmployeeServiceTests (14 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 194 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer associations BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 195 | Unitaire | GetAllAsync_WithTeamEmployees_ReturnsAllWithIncludes | Récupérer avec Includes | Associations + relations | Includes OK | ✅ PASS | Include EF Core |
| 196 | Unitaire | GetByTeamIdAsync_ReturnsEmployeesForTeam | Récupérer par TeamId | Employés de l'équipe | Employés filtrés | ✅ PASS | - |
| 197 | Unitaire | GetByTeamIdAsync_NoEmployeesForTeam_ReturnsEmpty | Team sans employés | Liste vide | Liste vide | ✅ PASS | - |
| 198 | Unitaire | GetByEmployeeIdAsync_ReturnsTeamsForEmployee | Récupérer par EmployeeId | Équipes de l'employé | Équipes filtrées | ✅ PASS | - |
| 199 | Unitaire | GetByEmployeeIdAsync_NoTeamsForEmployee_ReturnsEmpty | Employé sans équipe | Liste vide | Liste vide | ✅ PASS | - |
| 200 | Unitaire | GetByIdAsync_ExistingCompositeKey_ReturnsTeamEmployee | Récupérer par clé composite | Association trouvée | Association retournée | ✅ PASS | TeamId+EmployeeId |
| 201 | Unitaire | GetByIdAsync_NonExistingCompositeKey_ReturnsNull | Clé composite inexistante | null | null | ✅ PASS | - |
| 202 | Unitaire | CreateAsync_ValidTeamEmployee_ReturnsCreated | Créer association valide | Association créée | Association en BDD | ✅ PASS | - |
| 203 | Unitaire | CreateAsync_MultipleEmployeesOnSameTeam_Success | Plusieurs employés/équipe | Toutes créées | Many-to-many OK | ✅ PASS | Relation N:N |
| 204 | Unitaire | DeleteAsync_ExistingTeamEmployee_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 205 | Unitaire | DeleteAsync_NonExistingTeamEmployee_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 206 | Unitaire | DeleteAllAsync_WithTeamEmployees_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 207 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.13 TeamServiceTests (18 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 208 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer équipes BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 209 | Unitaire | GetAllAsync_WithTeams_ReturnsAllTeams | Récupérer toutes équipes | Liste complète | Toutes équipes | ✅ PASS | - |
| 210 | Unitaire | GetAllAsync_IncludesTeamEmployees | Include TeamEmployees | Membres chargés | Membres présents | ✅ PASS | Include EF Core |
| 211 | Unitaire | GetByIdAsync_ExistingId_ReturnsTeam | Récupérer par ID | Équipe trouvée | Équipe retournée | ✅ PASS | - |
| 212 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 213 | Unitaire | GetByEventIdAsync_ReturnsTeamsForEvent | Récupérer par EventId | Équipes de l'event | Équipes filtrées | ✅ PASS | - |
| 214 | Unitaire | GetByEventIdAsync_NoTeamsForEvent_ReturnsEmpty | Event sans équipes | Liste vide | Liste vide | ✅ PASS | - |
| 215 | Unitaire | CreateAsync_ValidTeam_ReturnsCreatedTeam | Créer équipe valide | Équipe créée | Équipe en BDD | ✅ PASS | - |
| 216 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 217 | Unitaire | CreateAsync_WithProvidedGuid_UsesProvidedGuid | Créer avec GUID | GUID utilisé | GUID conservé | ✅ PASS | - |
| 218 | Unitaire | UpdateAsync_ExistingTeam_UpdatesTeamName | Modifier nom équipe | Nom mis à jour | Update OK | ✅ PASS | - |
| 219 | Unitaire | UpdateAsync_NonExistingTeam_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 220 | Unitaire | UpdateAsync_ChangingEvent_UpdatesSecurityZones | Changer EventId équipe | InstallationTeamId null | Cascade zones | ✅ PASS | Désassignation auto |
| 221 | Unitaire | UpdateAsync_ChangingEvent_UpdatesRemovalTeamInSecurityZones | Changer EventId équipe | RemovalTeamId null | Cascade zones | ✅ PASS | Désassignation auto |
| 222 | Unitaire | DeleteAsync_ExistingTeam_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 223 | Unitaire | DeleteAsync_NonExistingTeam_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 224 | Unitaire | DeleteAllAsync_WithTeams_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 225 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |

---

## 3.14 UserServiceTests (29 tests)

| # | Type | Titre | Scénario | Résultat attendu | Résultat observé | Résultat | Commentaire |
|---|------|-------|----------|------------------|------------------|----------|-------------|
| 226 | Unitaire | GetAllAsync_EmptyDatabase_ReturnsEmptyList | Récupérer users BDD vide | Liste vide | Liste vide | ✅ PASS | - |
| 227 | Unitaire | GetAllAsync_WithUsers_ReturnsAllUsers | Récupérer tous users | Liste complète | Tous users | ✅ PASS | - |
| 228 | Unitaire | GetByIdAsync_ExistingId_ReturnsUser | Récupérer par ID | User trouvé | User retourné | ✅ PASS | - |
| 229 | Unitaire | GetByIdAsync_NonExistingId_ReturnsNull | ID inexistant | null | null | ✅ PASS | - |
| 230 | Unitaire | CreateAsync_ValidUser_ReturnsCreatedUser | Créer user valide | User créé | User en BDD | ✅ PASS | - |
| 231 | Unitaire | CreateAsync_WithPassword_HashesPassword | Créer avec MDP | MDP hashé BCrypt | Hash différent | ✅ PASS | BCrypt.HashPassword |
| 232 | Unitaire | CreateAsync_WithEmptyPassword_DoesNotHash | Créer MDP vide | MDP non hashé | MDP vide conservé | ✅ PASS | - |
| 233 | Unitaire | CreateAsync_WithNullPassword_DoesNotHash | Créer MDP null | MDP reste null | null conservé | ✅ PASS | - |
| 234 | Unitaire | CreateAsync_WithEmptyGuid_GeneratesNewGuid | Créer sans GUID | GUID généré | Nouveau GUID | ✅ PASS | Guid.NewGuid() |
| 235 | Unitaire | CreateAsync_WithProvidedGuid_UsesProvidedGuid | Créer avec GUID | GUID utilisé | GUID conservé | ✅ PASS | - |
| 236 | Unitaire | UpdateAsync_ExistingUser_UpdatesName | Modifier nom | Nom mis à jour | Update OK | ✅ PASS | - |
| 237 | Unitaire | UpdateAsync_WithNewPassword_HashesNewPassword | Modifier MDP | Nouveau hash BCrypt | Hash différent | ✅ PASS | BCrypt.HashPassword |
| 238 | Unitaire | UpdateAsync_WithEmptyPassword_SetsPasswordToNull | Modifier MDP vide | MDP devient null | null | ✅ PASS | - |
| 239 | Unitaire | UpdateAsync_WithNullPassword_SetsPasswordToNull | Modifier MDP null | MDP devient null | null | ✅ PASS | - |
| 240 | Unitaire | UpdateAsync_NonExistingUser_ReturnsNull | Modifier inexistant | null | null | ✅ PASS | - |
| 241 | Unitaire | DeleteAsync_ExistingUser_ReturnsTrueAndDeletes | Supprimer existant | true + suppression | Supprimé | ✅ PASS | - |
| 242 | Unitaire | DeleteAsync_NonExistingUser_ReturnsFalse | Supprimer inexistant | false | false | ✅ PASS | - |
| 243 | Unitaire | DeleteAllAsync_WithUsers_DeletesAllAndReturnsCount | Supprimer tout | Count retourné | Count correct | ✅ PASS | - |
| 244 | Unitaire | DeleteAllAsync_EmptyDatabase_ReturnsZero | Supprimer BDD vide | 0 | 0 | ✅ PASS | - |
| 245 | Unitaire | LoginAsync_ValidCredentials_ReturnsSuccessWithToken | Login valide | Success + Token | Token retourné | ✅ PASS | Auth JWT |
| 246 | Unitaire | LoginAsync_NonExistingUser_ReturnsFailure | Login user inexistant | Failure | IsSuccess=false | ✅ PASS | - |
| 247 | Unitaire | LoginAsync_IncorrectPassword_ReturnsFailure | Login mauvais MDP | Failure | IsSuccess=false | ✅ PASS | BCrypt.Verify |
| 248 | Unitaire | LoginAsync_EmptyPassword_ReturnsFailure | Login MDP vide | Failure | IsSuccess=false | ✅ PASS | Validation |
| 249 | Unitaire | LoginAsync_NullPassword_ReturnsFailure | Login MDP null | Failure | IsSuccess=false | ✅ PASS | Validation |
| 250 | Unitaire | LoginAsync_UserWithNullPassword_ReturnsFailure | Login user sans MDP | Failure | IsSuccess=false | ✅ PASS | Sécurité |
| 251 | Unitaire | LoginAsync_GeneratesTokenWithCorrectParameters | Vérifier params token | UserId+Username OK | Claims corrects | ✅ PASS | Mock IJwtService |
| 252 | Unitaire | CreateAsync_DifferentPasswordsSameUser_ProducesDifferentHashes | MDP différents | Hash uniques | Salt BCrypt | ✅ PASS | Salt aléatoire |
| 253 | Unitaire | LoginAsync_CaseSensitivePassword_ReturnsFailure | Login MDP case diff | Failure | IsSuccess=false | ✅ PASS | Sensible casse |

---

# ANNEXES

## Métriques de Suivi

| Métrique | Valeur Actuelle | Objectif | Statut |
|----------|-----------------|----------|--------|
| **Tests totaux** | **254** | 254 | ✅ Atteint |
| **Tests passés** | **254** | 254 | ✅ Atteint |
| **Tests échoués** | **0** | 0 | ✅ Atteint |
| **Coverage globale services** | **100%** | 100% | ✅ Atteint |
| **Temps exécution** | ~10s | < 30s | ✅ Excellent |

## Récapitulatif par Service

| Service | Nb Tests | Passés | Échoués | Couverture |
|---------|----------|--------|---------|------------|
| ActionService | 20 | 20 | 0 | 100% |
| AreaService | 16 | 16 | 0 | 100% |
| EmployeeService | 13 | 13 | 0 | 100% |
| EquipmentService | 15 | 15 | 0 | 100% |
| EventService | 13 | 13 | 0 | 100% |
| JwtService | 10 | 10 | 0 | 100% |
| PathService | 17 | 17 | 0 | 100% |
| PictureService | 20 | 20 | 0 | 100% |
| PlanningService | 22 | 22 | 0 | 100% |
| PointService | 24 | 24 | 0 | 100% |
| SecurityZoneService | 23 | 23 | 0 | 100% |
| TeamEmployeeService | 14 | 14 | 0 | 100% |
| TeamService | 18 | 18 | 0 | 100% |
| UserService | 29 | 29 | 0 | 100% |
| **TOTAL** | **254** | **254** | **0** | **100%** |

---

**Document validé par** : Équipe Développement Backend  
**Prochaine revue** : À chaque nouvelle fonctionnalité
