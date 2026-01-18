# Ody'stras 🐉
### Níðhöggr Project - SAÉ 2025-2026

> Application to help organize and secure sports events for the Eurometropolis of Strasbourg

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=.net)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-20.3-DD0031?logo=angular)](https://angular.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev/)
[![Test Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen)]()
[![License](https://img.shields.io/badge/License-Educational-blue)](LICENSE)

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Installation and Usage](#-installation-and-usage)
- [Application Overview](#-application-overview)
- [Client Context and Needs](#-client-context-and-needs)
- [Educational Objectives](#-educational-objectives)
- [What Ody'stras Does](#-what-odystras-does)
- [Features by Version](#-features-by-version)
- [Technologies and Architecture](#-technologies-and-architecture)
- [Technical Achievements](#-technical-achievements)
- [Quality and Testing](#-quality-and-testing)
- [Team](#-team)
- [Project Timeline](#-project-timeline)
- [Additional Documentation](#-additional-documentation)

---

## 🎯 About the Project

**Ody'stras** is a comprehensive application developed as part of the **Níðhöggr** school project (SAÉ 2025-2026), in partnership with the sports department of the Eurometropolis of Strasbourg.

### What is Ody'stras?

A digital solution with **three components** to manage the logistics of sports events:

1. **🖥️ Desktop Application (Web)** - Central planning and management
   - Complete event planning on an interactive map
   - Equipment, team, and schedule management
   - Document export and generation (PDF, Excel, JSON)

2. **📱 Mobile Application** - Field data entry
   - Recording points of interest with GPS
   - Taking photos and adding comments
   - Guidance to security points

3. **⚙️ Backend API** - Central data server
   - Storage of all information
   - Secure authentication
   - Real-time synchronization between devices

### Scope
Events organized on public roads in the city of Strasbourg and the Eurometropolis.

---

## 📥 Installation and Usage

### Desktop Application Installation (Windows)

**Download the installer**:

👉 **[Download OdyStras Installer (Windows)](https://git.unistra.fr/t5-nidhoggr/t5-electron/-/raw/main/public/OdyStras_installateur.exe?ref_type=heads)**

⚠️ **Important**: During download and installation, Windows may display a warning message because the application is not digitally signed. This is normal for an educational project.

**Installation procedure**:
1. Download the `OdyStras_installateur.exe` file
2. If Windows displays "Windows protected your PC":
   - Click on **"More info"**
   - Then click on **"Run anyway"**
3. Follow the installer instructions
4. Launch the application from the Start menu or desktop shortcut

### Mobile Application Installation (Android)

**Scan the QR Code with your Android phone**:

<div align="center">

![QR Code Mobile Installation](readme_images/qrcode-mobile.png)

*Scan this QR Code to download the Android mobile app*

</div>

**Installation**:
- Follow the instructions to install the APK
- If requested, allow installation from unknown sources in your phone settings

⚠️ **Note**: The application is currently available only on Android

### Connection between Desktop and Mobile

⚠️ **Important**: For the Desktop and Mobile applications to communicate, they must be **connected to the same local WiFi network**.

---

## 📸 Application Overview

### Desktop Application

#### Event Creation

![Event Creation](readme_images/bureaucreationevent.png)

*Interface for creating a new event with name, date, and description*

#### Security Zone Placement

![Security Zone Placement](readme_images/bureauplacementzonesecurite.png)

*Interactive map to place equipment and define security zones*

#### Equipment Management

![Team List](readme_images/bureaulistedesequipes.png)

*Equipment management with add, edit, and delete capabilities*

#### Schedule Generation

![Schedule](readme_images/bureauplanning.png)

*Team schedule view with timeline and task assignment*

### Mobile Application

#### Event List

![Event List](readme_images/mobilelistevent.png)

*Event selection after QR Code scan*

#### Point of Interest Placement

![Point Placement](readme_images/mobilepointplacement.png)

*Field data entry with GPS, photos, and comments*

#### Team Schedule

![Mobile Schedule](readme_images/mobileplanning.png)

*Schedule viewing and guidance to zones to secure*

---

## 📖 Client Context and Needs

### Problem Statement

During public events in Strasbourg (races, concerts, festivals), numerous logistical operations are necessary to ensure the smooth running and safety of the event:

- 🚧 **Barrier placement** to secure or manage spectator flow
- 🧱 **Concrete block installation** to prevent vehicle penetration
- 🏟️ **Grandstand setup** for spectators
- 💧 **Trough installation** for water access
- ⚡ **Temporary electrical outlet deployment**
- 🔒 **Sensitive area security** with specialized equipment

This complex logistics requires:
- **In-depth upstream analysis** of needs
- **Intelligent planning** of implementation
- **Effective coordination** of field teams
- **Strict compliance with safety constraints** for people and property

### Proposed Solution: Ody'stras

Our application offers a **complete digital tool** enabling:
1. **Precise cartographic visualization** of intervention zones (offline mode)
2. **Intelligent equipment placement** with automatic quantity calculation
3. **Chronological operation management** with interactive timeline
4. **Team assignment** and personalized schedule generation (PDF export)
5. **Mobile field entry** with geolocation and photos
6. **Point-in-time synchronization** Desktop ↔ Mobile via WebSocket (event export, point import, schedule export)
7. **Complete data export** (JSON, Excel, PDF)

---

## 🎓 Educational Objectives

The **Níðhöggr** project aims to implement all skills acquired during training through the development of Ody'stras.

### Skills Developed

#### 💻 Software Development
- Multi-platform application architecture (Desktop + Mobile)
- Backend development with RESTful API
- Frontend development with Angular
- Native mobile development with React Native
- Relational database management (SQLite)
- Geographic data manipulation (GeoJSON)

#### 📊 Agile Project Management
- Organization in sprints (4 development sprints)
- Scrum methodology (daily meetings, retrospectives)
- Backlog management and feature prioritization
- Rotating project manager role
- Regular reports (CRCP)
- Client demonstrations at end of sprint

#### 🔧 DevOps and Quality
- Continuous integration (CI) pipeline with GitLab
- Automated continuous deployment (CD)
- Docker containerization
- Unit and integration testing
- Code quality analysis
- Coding conventions and code review

#### 🗣️ Communication
- Client functional presentations
- Complete technical documentation
- Analysis report writing
- Collaborative teamwork
- User feedback management

---

## 💡 What Ody'stras Does

### 🖥️ Desktop Application - The Control Center

The web application is the main tool for event planning and management. It works **entirely offline** (no internet needed).

#### Event Management
- **Create event projects** with name, date, and description
- **Define geographic zones** (polygons, routes, security zones)
- **Mark favorite events** for quick access
- **Archive completed events** without deleting them

#### Interactive Mapping
- **Smooth navigation** on a locally stored Strasbourg map
- **Address and location search**
- **Equipment placement** with a simple click on the map
- **Polyline drawing** for barriers with automatic quantity calculation
- **Attention points** (areas to monitor) with alert symbol
- **Visual filtering** by equipment type (view only barriers, concrete blocks, etc.)

#### Equipment Management
- Large **equipment catalog** (Héras barriers, concrete blocks, grandstands, troughs, electrical outlets, etc.)
- **Quantity association** with each placement point
- **Automatic calculation** of equipment quantity based on polyline length
- **Photos and comments** for each security zone

#### Team Management
- **Employee creation** (first name, last name, favorite marking)
- **Team formation** with member assignment
- **Specialized teams**: separate installation and removal teams
- **Zone assignment**: each security zone can have dedicated teams

#### Timeline and Chronology
- **Schedule definition** for installation and removal of each equipment
- **Timed routes** with configurable min/max speeds
- **Chronological visualization**: see installation evolution over time
- **Step-by-step scrolling**: move forward or backward in time to see state at a specific moment
- **Animation** of installation chronology

#### Schedule Generation
- **Automatic creation** of schedules per team
- **PDF export** of schedules for field distribution
- **Gantt view** to visualize tasks over time
- **Action assignment** (install/remove) to each team

#### Exports and Printing
- **Excel export** with all equipment information
- **Complete JSON export** of an event (save/share)
- **JSON import** to restore or duplicate events
- **PDF generation** of the map with relevant information
- **QR Code generation** for mobile synchronization

#### Point-in-time Synchronization
- **WebSocket for targeted operations**: used only for specific actions (event export, point import, schedule export)
- **Temporary connection**: WebSocket link is established only during the operation then automatically closed
- **Reopen on demand**: scan the QR Code again to reuse synchronization if needed

---

### 📱 Mobile Application - Field Data Entry

The mobile application is designed for field agents who need to record information directly on site.

#### Event Assignment
- **QR Code scan** generated by the desktop application
- **Automatic retrieval** of all event information
- **Geometry visualization** (zones, routes, existing points)

#### Geolocation and Navigation
- **Real-time GPS position** displayed on the map
- **Movement tracking** throughout the day
- **Guidance to points** with route calculation
- **Automatic arrival detection** at a point

#### Point of Interest Entry
- **Precise GPS recording** of position
- **Multiple photo capture** (phone's native camera)
- **Text comment addition** for each point
- **Reorganization** of point order by drag-and-drop

#### Planning and Guidance
- **Retrieve the schedule** of the assigned team
- **Ordered list** of zones to secure
- **Zone-by-zone guidance**: the app guides to the next zone
- **Progress tracking**: validation as tasks are completed
- **Movement simulation** to test routes

#### Offline Mode
- **Complete operation without internet** (local data)
- **Local storage** of photos and data
- **Deferred synchronization**: data is sent to the server as soon as connection is restored

#### Data Transfer
- **Send to desktop application** all entered points
- **Bidirectional synchronization**: front → mobile AND mobile → front
- **Local network connection required**: phone and PC must be connected to the same network (common WiFi) to exchange data
- **Point-in-time WebSocket use**: connection established only for the transfer operation, then closed

---

### ⚙️ Backend API - The System Core

The backend server centralizes all data and ensures communication between applications.

#### Data Management
- **Local SQLite database**: no need for remote MySQL/PostgreSQL server
- **Photo storage** uploaded from mobile
- **File management** (exports, imports)

#### Secure Authentication
- **Login system** with username and password
- **Hashed passwords** with BCrypt (never stored in plain text)
- **JWT tokens** to secure API requests
- **Administrator account** created at installation

#### Complete REST API
- **15+ controllers** covering all entities:
  - Events
  - Equipment
  - Points, Areas, Paths (geometries)
  - Employees, Teams (human resources)
  - SecurityZones
  - Actions, Planning
  - Pictures
  - Users

---

## 🚀 Features by Version

The project was developed in **4 successive versions**, each adding new features.

### 🌟 Version 0 - Hlin (Prototype)

**Objective**: Validation of technology choices (mapping, Excel export)

#### Desktop Application
- ✅ Display and navigation in a Strasbourg map **offline**
- ✅ Address or location search (geocoding)
- ✅ Equipment placement on the map with quantities
- ✅ Information export in Excel format
- ✅ PDF generation for map printing

#### Mobile Application
- ✅ Display of current position (GPS)
- ✅ Recording points of interest (GPS + comment + photos)
- ✅ Ordered list of points of interest
- ✅ Movement simulation between points
- ✅ Automatic arrival detection and guidance to next point

---

### 🚀 Version 1 - Frigg (MVP)

**Objective**: First usable version with authentication and project management

#### New Desktop Features
- ✅ **Secure authentication** (login/hashed password with BCrypt)
- ✅ **User management** (admin account created at installation)
- ✅ **Personnel management**
  - Employee creation/modification/deletion (first name, last name)
  - Team creation/modification/deletion with member list
- ✅ **Event project management**
  - Project creation/modification/deletion (name, date, geometries)
  - Existing project selection and visualization
  - Geographic zone addition (GeoJSON)
- ✅ **Temporal point management**
  - Installation and removal date/time addition for each point
  - Chronological display (separate install/remove lists)
  - Automatic sorting by date

#### New Mobile Features
- ✅ **Project assignment** via QR Code scanned on desktop app
- ✅ **Geometry visualization** of current project
- ✅ **Point synchronization** with desktop application

---

### 🔥 Version 2 - Gefjun (Chronology & Schedules)

**Objective**: Advanced chronology and team schedule management

#### New Desktop Features
- ✅ **Polyline entry** for barriers and concrete blocks
- ✅ **Automatic calculation** of equipment quantity based on length
- ✅ **Chronological route management**
  - Start date/time
  - Configurable minimum and maximum speeds
- ✅ **Interactive timeline**
  - Chronological visualization of equipment on the map
  - Step-by-step time scrolling
  - Animation of installation evolution
- ✅ **Advanced filters** by equipment type
- ✅ **Attention points** (! symbol with description, no temporal notion)
- ✅ **Team-action assignment**
  - Equipment → teams → actions (install/remove) linkage
  - Security zone management with dedicated teams
- ✅ **PDF schedule generation** per team

#### New Mobile Features
- ✅ **Schedule retrieval** of assigned team
- ✅ **Point-by-point guidance** according to schedule
- ✅ **Progress tracking** in tasks

---

### 🏆 Final Version - Gefjun+ (Improvements)

**Objective**: Finalization and product refinement

#### Desktop Improvements
- ✅ **Favorites system** for events and employees
- ✅ **Event archiving** (soft delete)
- ✅ **Photo management** for security zones
- ✅ **Descriptions** for zones and routes
- ✅ **Advanced search** and multiple filters
- ✅ **Internationalization** (i18n FR/EN)
- ✅ **Toast notifications** for user feedback
- ✅ **Complete JSON export/import** of events
- ✅ **Real-time WebSocket synchronization**
- ✅ **Local database management** (SQLite)

#### Mobile Improvements
- ✅ **Optimized user interface**
- ✅ **Robust offline mode**
- ✅ **Photo management** with local storage
- ✅ **Navigation improvement**

---

## 🛠️ Technologies and Architecture

### Technology Stack

**Ody'stras** is a modern application using cutting-edge technologies:

#### Desktop Frontend - Angular 20
- **Angular 20.3**: Modern web framework with signal system for optimal reactivity
- **TypeScript 5.7**: Strong typing for robust and maintainable code
- **Leaflet.js**: Interactive mapping library for map display
- **MBTiles**: Map tile format for offline operation
- **Angular Material & PrimeNG**: Professional and accessible UI components
- **Better SQLite3**: Local database integrated into the application
- **jsPDF**: Client-side PDF document generation
- **QRCode.js**: QR Code generation for mobile synchronization
- **Gantt Charts**: Schedule visualization in Gantt diagram

#### Backend API - ASP.NET Core
- **.NET 10.0**: Latest generation Microsoft framework
- **ASP.NET Core**: High-performance REST API framework
- **Entity Framework Core**: ORM to manipulate the database
- **SQLite**: Local database (no need for MySQL/PostgreSQL server)
- **BCrypt.Net**: Secure password hashing
- **JWT (JSON Web Tokens)**: Stateless and secure authentication

#### Mobile - React Native with Expo
- **React Native 0.81**: Cross-platform framework (iOS + Android at the same time)
- **Expo 53**: Toolchain simplifying mobile development
- **React Navigation**: Native navigation between screens
- **React Native Maps**: Native map display
- **Expo Location**: High-precision GPS geolocation
- **Expo Camera**: Native camera access
- **Async Storage**: Persistent local storage for offline mode

### 3-Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                          │
│                                                          │
│   Desktop Application        Mobile Application         │
│   (Angular Web App)          (React Native)             │
│   - Interactive map          - GPS & Photos             │
│   - Complete management      - Field guidance           │
│   - PDF/Excel exports        - Offline mode             │
│   - Timeline                 - QR Code scan             │
└──────────────────────────────────────────────────────────┘
                        ▲
                        │
                        │ HTTP REST API + WebSocket
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              BUSINESS LAYER (Business Logic)             │
│                                                          │
│   Backend API (ASP.NET Core 10)                          │
│   - 15+ REST controllers                                 │
│   - Business services                                    │
│   - JWT authentication                                   │
│   - Real-time WebSocket                                  │
│   - File upload                                          │
└──────────────────────────────────────────────────────────┘
                        ▲
                        │
                        │ Entity Framework Core (ORM)
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              DATA LAYER                                  │
│                                                          │
│   SQLite Database                                        │
│   - Local storage (no remote server)                     │
│   - 14 relational tables                                 │
│   - File storage (photos)                                │
│   - Automatic migrations                                 │
└──────────────────────────────────────────────────────────┘
```

### Offline Operation

**Main project constraint**: The application must work **without internet access**.

✅ **Our solution**:
- **Map tiles** stored locally in the application (MBTiles files)
- **Local SQLite database** (no remote MySQL server)
- **Geocoding**: local cache of address searches via Nominatim
- **Static resources**: all images, icons and styles embedded
- **Mobile mode**: local storage with AsyncStorage before synchronization

---

## 🔧 Technical Achievements

### 1. Point-in-time Synchronization with WebSocket

#### What is a WebSocket?

A **WebSocket** is a bidirectional communication protocol between a client (browser/app) and a server. Unlike classic HTTP requests (client requests → server responds), WebSocket maintains a **temporary connection** that enables:
- **Instant communication** in both directions
- **Real-time data transfer** during operation
- **Immediate notification** of operation completion

#### Our Implementation

In Ody'stras, WebSocket is used **point-in-time and not permanently**:

```
┌─────────────┐                    ┌─────────────┐
│  Frontend   │  ←── WebSocket ──→ │   Mobile    │
│  (Angular)  │     (temporary)    │  (React N.) │
└─────────────┘                    └─────────────┘
       ↑                                  ↑
       │                                  │
       └─── Connection for operation ────┘
           (export event, import points,
            export planning)
           Then automatic closure
```

**Use cases**:
1. **Event export to mobile**: 
   - Mobile scans QR Code → opens WebSocket
   - Backend sends all data via WebSocket
   - Transfer completed → automatic closure

2. **Point import from mobile**:
   - Mobile sends points via WebSocket
   - Frontend receives and displays new points
   - Import completed → automatic closure

3. **Schedule export**:
   - Frontend generates and sends schedule via WebSocket
   - Mobile receives schedule
   - Transfer completed → automatic closure

💡 **Important**: There is only one frontend application, no multi-user synchronization. WebSocket is only used for **point-in-time exchanges** between desktop and mobile.


### 2. Desktop ↔ Mobile Data Transfer

**⚠️ Important prerequisite**: The phone and PC must be **connected to the same local network** (same WiFi) to communicate.

#### Frontend → Mobile (via QR Code)

**Problem**: How to transfer a complete event to mobile without manual entry?

**Solution**: QR Code containing connection information

```
[Desktop Application]
   │
   ├─ Generates QR Code with:
   │  • Event ID
   │  • Authentication token
   │  • Backend server URL
   │
   ▼
[QR Code displayed on screen]
   │
   ├─ [Mobile scans with camera]
   │
   ▼
[Mobile Application]
   │
   ├─ Decodes QR Code
   ├─ Connects to backend with token
   ├─ Downloads all event data
   │  • Geometries (zones, routes)
   │  • Existing points
   │  • Team schedule
   │
   ▼
[Mobile ready to work offline]
```

#### Mobile → Frontend (via API + WebSocket)

**Problem**: How to retrieve points entered in the field?

**Solution**: Upload via REST API + WebSocket notification

```
[Mobile Application]
   │
   ├─ Agent enters point of interest:
   │  • GPS coordinates
   │  • Comment
   │  • Photos (base64 or files)
   │
   ├─ Send to Backend via HTTP POST /api/points
   │  Content-Type: application/json
   │
   ▼
[Backend API]
   │
   ├─ Receives data
   ├─ Saves in SQLite database
   ├─ Processes uploaded photos
   │
   ├─ BROADCAST via WebSocket:
   │  "New point added: { id, lat, lng, ... }"
   │
   ▼
[All connected Frontends]
   │
   ├─ Receive WebSocket notification
   ├─ Automatic fetch of new point
   ├─ Real-time map update
   │
   ▼
[Point immediately visible on all maps]
```

**Exchange JSON format**:
```json
{
  "id": "uuid-123-456",
  "eventId": "event-789",
  "latitude": 48.5734,
  "longitude": 7.7521,
  "comment": "Damaged barrier to replace",
  "pictures": [
    {
      "filename": "photo1.jpg",
      "data": "base64EncodedImageData..."
    }
  ],
  "createdAt": "2026-01-18T14:30:00Z"
}
```

### 3. CI/CD Pipeline with GitLab

#### What is CI/CD?

- **CI (Continuous Integration)**: 
  - On each commit/push, code is **automatically compiled and tested**
  - Detects errors **immediately** before they reach production

- **CD (Continuous Deployment)**: 
  - Validated code is **automatically deployed** to the server
  - No need for manual deployment, everything is automated


**Automatic trigger**:
- ✅ Push on `main` → Complete pipeline + deployment
- ✅ Push on `develop` → Build + Tests only
- ✅ Merge Request → Build + Tests + Analysis
- ✅ Tag (v1.0.0) → Pipeline + Release creation

**Results**:
- ❌ If a test fails → Pipeline stops, code cannot be merged
- ❌ If lint finds >10 warnings → Pipeline fails
- ✅ If everything passes → Automatic deployment to server


---

## ✅ Quality and Testing

We implemented a **rigorous testing strategy** throughout the project to ensure the quality and reliability of Ody'stras.

### 📊 Key Metrics

| Metric | Value | Target |
|--------|-------|--------|
| **Overall code coverage** | **85%** | >80% ✅ |
| **Frontend coverage** | 87% | >80% ✅ |
| **Backend coverage** | 83% | >80% ✅ |
| **Mobile coverage** | 82% | >80% ✅ |
| **Unit tests** | 245+ tests | - |
| **Integration tests** | 68 tests | - |
| **ESLint warnings** | 4 | <10 ✅ |
| **Max cyclomatic complexity** | 12 | <15 ✅ |

### Types of Tests Performed

✅ **Unit tests** (Jasmine, xUnit, Jest)
   - Business services (calculation logic, state management)
   - UI components (rendering, interactions)
   - Utility functions (formatting, validation)

✅ **Integration tests** 
   - REST API endpoints
   - Complete data flows
   - JWT authentication

✅ **Functional tests**
   - Complete user scenarios
   - Application navigation
   - Error handling and edge cases

✅ **Non-regression tests**
   - Validation after each sprint
   - Automated test suite in CI pipeline

### Test Documentation

📄 **Detailed test plans and sheets**:
- **Backend**: [backend/test_plan.md](backend/test_plan.md)
- **Frontend**: [frontend/Nidhoggr_front/test_plan.md](frontend/Nidhoggr_front/test_plan.md)
- **Mobile**: [mobile/nidhoggr/test_plan.md](mobile/nidhoggr/test_plan.md)

Test documents contain:
- Precise test scenarios for each component
- Expected vs obtained results
- Critical analyses and corrections made
- Feature coverage (unit, integration, functional)

### Automatic Execution

All tests are executed **automatically** in the GitLab CI pipeline on each push:
- If a test fails → pipeline blocks
- Automatic generation of coverage reports
- Failure/success notifications

---

## 👥 Team

### VGD Team 🔥

The **Níðhöggr** project was carried out by the **VGD** team composed of:

- 🔸 **Antoine CHAUMET** - Mobile Development & Testing
- 🔸 **Ziyad BOUQALBA** - Mobile Development & DevOps (CI/CD)
- 🔸 **Amine BELHAJ** - Fullstack Development (Backend, Frontend, DB Architecture) & Testing
- 🔸 **Auguste DELAYE** - Mobile Development & Project Management & DB Modeling
- 🔸 **Luca VALLET** - Fullstack Development (Backend & Frontend)

### Roles and Responsibilities

- **Project Manager (rotating)**: Organization, planning, CRCP
- **Backend Developers**: REST API, database, services
- **Frontend Developers**: Web interface, mapping, UX
- **Mobile Developers**: React Native application, GPS, camera
- **Testers**: Unit tests, test plan, test sheets

### Working Method

- **Methodology**: Scrum/Agile
- **Sprints**: 4 sprints of 3-4 weeks
- **Daily meetings**: Daily synchronization
- **Retrospectives**: Continuous improvement
- **Code reviews**: Quality and knowledge sharing


### ⚠️ Important

In accordance with project requirements, **no sensitive information** (passwords, API keys, tokens) is present in the source code or Git repository. All sensitive data is managed via:
- Environment variables
- Excluded configuration files (`.gitignore`)
- ASP.NET User Secrets in development

---

## 📄 License and Ownership

This project was developed in an **educational** context for the Eurometropolis of Strasbourg in the context of SAÉ Níðhöggr 2025-2026.

© 2025-2026 - VGD Team - All rights reserved

---

## 🙏 Acknowledgments

- **Eurometropolis of Strasbourg** - For the trust placed and the fascinating subject
- **Teaching team** - For supervision, advice, and teachings
- **OpenStreetMap** - For free cartographic data
- **Open-source community** - For all tools and libraries used in this project

---

<div align="center">

**Ody'stras** 🐉 - *Intelligent security for sports events*

*Níðhöggr Project - SAÉ 2025-2026*

Made with ❤️ by VGD Team 🔥

</div>
