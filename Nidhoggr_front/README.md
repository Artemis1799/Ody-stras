# NidhoggrFront

Event logistics management application - Angular 18 frontend for Eurométropole de Strasbourg.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

---

## Project Structure

```
src/
├── app/
│   ├── components/                          # Angular components organized by page/feature
│   │   ├── accueil-page/                   # Application home page
│   │   ├── equipement-page/                # Equipment management
│   │   ├── historique-page/                # Event history view
│   │   ├── login-page/                     # User authentication
│   │   ├── map-page/                       # Main map (core feature)
│   │   │   ├── layout/                     # Main map container
│   │   │   ├── map-loader/                 # Map initialization & loading
│   │   │   ├── point-drawer/               # GPS point drawing tool
│   │   │   ├── points-sidebar/             # Points list sidebar
│   │   │   └── equipment-manager/          # On-map equipment management
│   │   └── personnels-page/                # Personnel/Employee management
│   │
│   ├── shared/                              # Reusable components (popups, drawers)
│   │   ├── event-confirm-popup/            # Event confirmation popup
│   │   ├── event-create-popup/             # New event creation popup
│   │   ├── event-edit-popup/               # Event editing popup
│   │   ├── export-popup/                   # Data export (JSON/PDF)
│   │   ├── import-popup/                   # Data import
│   │   ├── geometry-edit-drawer/           # GeoJSON geometry editor
│   │   ├── timeline-drawer/                # Event timeline drawer
│   │   ├── navbar/                         # Navigation bar
│   │   └── ... (others)                    # Archive, Delete, Person, Team, Photo popups
│   │
│   ├── services/                            # Business logic services
│   │   ├── ActionService.ts                # Actions/tasks management
│   │   ├── AreaService.ts                  # Geographic areas management
│   │   ├── AuthService.ts                  # Authentication & JWT
│   │   ├── EmployeeService.ts              # Employee management
│   │   ├── EquipmentService.ts             # Equipment management
│   │   ├── EventService.ts                 # Events CRUD + state (signals)
│   │   ├── MapService.ts                   # Map state & controls
│   │   ├── PointService.ts                 # GPS points management
│   │   ├── SecurityZoneService.ts          # Security zones with teams
│   │   ├── TeamService.ts                  # Teams management
│   │   ├── UserService.ts                  # Users management
│   │   ├── ToastService.ts                 # Toast notifications
│   │   ├── PictureService.ts               # Photo uploads/management
│   │   ├── PathService.ts                  # Routes/paths management
│   │   ├── PlanningService.ts              # Event planning
│   │   ├── NominatimService.ts             # Geocoding (Nominatim API)
│   │   ├── EventTeamService.ts             # Event-team associations
│   │   ├── TeamEmployeeService.ts          # Team-employee associations
│   │   ├── EventExportService.ts           # Event export (JSON)
│   │   ├── WebSocketExportService.ts       # Real-time sync (WebSocket)
│   │   ├── DatabaseService.ts              # Local database management
│   │   └── __tests__/                      # Services unit tests
│   │
│   ├── models/                              # TypeScript models (interfaces/types)
│   │   ├── actionModel.ts                  # Action type
│   │   ├── areaModel.ts                    # Area type
│   │   ├── eventModel.ts                   # Event type
│   │   ├── pointModel.ts                   # GPS Point type
│   │   ├── equipmentModel.ts               # Equipment type
│   │   ├── employeeModel.ts                # Employee type
│   │   ├── userModel.ts                    # User type
│   │   ├── teamModel.ts                    # Team type
│   │   ├── securityZoneModel.ts            # SecurityZone type
│   │   ├── geometryEditModel.ts            # Geometry (GeoJSON) type
│   │   ├── pictureModel.ts                 # Picture type
│   │   ├── routePathModel.ts               # Path type
│   │   └── ... (others)                    # Event, Planning, TeamEmployee types
│   │
│   ├── interceptors/                        # HTTP interceptors
│   │   └── auth.interceptor.ts             # JWT injection, error handling
│   │
│   ├── router/                              # Navigation routes
│   │   ├── app.routes.ts                   # Client-side routes
│   │   └── app.routes.server.ts            # Server-side routes (SSR)
│   │
│   └── app.ts                               # Root application component
│
├── assets/                                  # Static resources
│   ├── i18n/                               # Translation files (i18n)
│   ├── icons/                              # SVG/PNG icons
│   └── tiles/                              # Local MBTiles (offline mapping)
│
├── environments/                            # Environment-specific configuration
│   ├── environment.ts                      # Development configuration
│   └── environment.production.ts           # Production configuration
│
└── styles/
    └── styles.scss                         # Global styles (SCSS)
```

---

## Development server

To start a local development server, run:

```bash
npm run start 
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Docker

This repository includes a multistage `Dockerfile` that builds the Angular SSR application and produces a small runtime image.

Build the image (run in `Nidhoggr_front`):

```powershell
docker build -t nidhoggr-front:latest .
```

Run the container (maps port 4000 by default):

```powershell
docker run --rm -p 4000:4000 -e PORT=4000 nidhoggr-front:latest
```

Notes:
- The image builds the app (requires dev dependencies) and then installs only production dependencies in the final image.
- If you have a `package-lock.json`, it will be used for deterministic installs. If not, `npm install` is used during the build.
- Adjust `PORT` if you prefer a different port.

## Local tile map (Eurométropole de Strasbourg)

This project can display a local tile map (MBTiles) served by `tileserver-gl`.

1. Install the tile server globally (requires npm):

```powershell
cd Nidhoggr_front
nvm install 22.12.0 
nvm use 22.12.0
npm install -g tileserver-gl
```

2. Install `leaflet` in the project (adds map rendering library):

```powershell
cd Nidhoggr_front #(if needed)
npm install --save leaflet 
npm install maplibre-gl
```

3. Start the local tile server using the provided MBTiles file (`src/assets/tiles/tiles.mbtiles`):

```powershell
tileserver-gl --file "src/assets/tiles/tiles.mbtiles" --port 8080
```

By default `tileserver-gl` listens on port `8080`. Open `http://localhost:8080` to see the available styles and tile endpoints.

4. Start the Angular app (in another terminal):

```powershell
cd Nidhoggr_front #(if needed)
npm run start
```

5. Open the app at `http://localhost:4200/`. The root page contains a Leaflet map centered on Strasbourg and will try to load tiles from the local tile server.

Notes:
- The code probes a few common tileserver endpoints (for example `/data/tiles/{z}/{x}/{y}.png` or `/tiles/{z}/{x}/{y}.png`). If your tileserver exposes a different path, update the tile URL in `src/app/app.component.ts`.
- The map is currently fixed to center/zoom for the Eurométropole de Strasbourg. Adjust the coordinates or zoom in `src/app/app.component.ts` as needed.



## Ajout des librairies pour excel et pdf 

```powershell
cd Nidhoggr_front #(if needed)
npm install jspdf xlsx
```



## lancement du docker pour les recherches : 

```powershell
# Dans le répertoire contenant docker-compose.yml
docker-compose up -d
# Tester l'API (environ 10min de dl)
curl "http://localhost:8080/search?q=Strasbourg&format=json"
```