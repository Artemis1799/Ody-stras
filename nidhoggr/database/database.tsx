import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";

export async function setupDatabase(db: SQLiteDatabase) {
  console.log("Initialisation de la base…");

  try {
    /* ===================== EVENEMENT ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Evenement (
        UUID TEXT PRIMARY KEY,
        Title TEXT NOT NULL,
        StartDate TEXT NOT NULL,
        EndDate TEXT NOT NULL,
        Status TEXT CHECK(Status IN (
          'uninstallation',
          'completed',
          'installation',
          'toOrganize',
          'inProgress'
        ))
      );
    `);

    /* ===================== EQUIPMENT ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Equipment (
        UUID TEXT PRIMARY KEY,
        Type TEXT,
        Length REAL,
        Description TEXT,
        StorageType TEXT CHECK(StorageType IN ('single','multiple'))
      );
    `);

    /* ===================== POINT ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Point (
        UUID TEXT PRIMARY KEY,
        EventID TEXT NOT NULL,
        Name TEXT NOT NULL,
        Latitude REAL NOT NULL,
        Longitude REAL NOT NULL,
        Comment TEXT,
        Validated INTEGER DEFAULT 0,
        EquipmentID TEXT,
        EquipmentQuantity INTEGER,
        Ordre INTEGER,
        FOREIGN KEY(EventID) REFERENCES Evenement(UUID) ON DELETE CASCADE,
        FOREIGN KEY(EquipmentID) REFERENCES Equipment(UUID) ON DELETE SET NULL
      );
    `);

    /* ===================== PICTURE ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Picture (
        UUID TEXT PRIMARY KEY,
        PointID TEXT NOT NULL,
        Picture TEXT,
        FOREIGN KEY (PointID) REFERENCES Point(UUID) ON DELETE CASCADE
      );
    `);

    /* ===================== PATH ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Path (
        UUID TEXT PRIMARY KEY,
        EventID TEXT NOT NULL,
        Name TEXT NOT NULL,
        ColorHex TEXT NOT NULL,
        StartDate TEXT NOT NULL,
        FastestEstimatedSpeed REAL NOT NULL,
        SlowestEstimatedSpeed REAL NOT NULL,
        GeoJson TEXT NOT NULL,
        FOREIGN KEY(EventID) REFERENCES Evenement(UUID) ON DELETE CASCADE
      );
    `);

    /* ===================== EMPLOYEES ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Employees (
        UUID TEXT PRIMARY KEY,
        LastName TEXT NOT NULL,
        FirstName TEXT NOT NULL,
        Email TEXT,
        Phone TEXT
      );
    `);

    /* ===================== TEAM ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Team (
        UUID TEXT PRIMARY KEY,
        EventID TEXT NOT NULL,
        TeamName TEXT NOT NULL,
        TeamNumber INTEGER NOT NULL,
        FOREIGN KEY (EventID) REFERENCES Evenement(UUID) ON DELETE CASCADE
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS TeamEmployees (
        TeamID TEXT NOT NULL,
        EmployeeID TEXT NOT NULL,
        PRIMARY KEY (TeamID, EmployeeID),
        FOREIGN KEY (TeamID) REFERENCES Team(UUID) ON DELETE CASCADE,
        FOREIGN KEY (EmployeeID) REFERENCES Employees(UUID) ON DELETE CASCADE
      );
    `);

    /* ===================== PLANNING ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Planning (
        UUID TEXT PRIMARY KEY,
        TeamID TEXT NOT NULL,
        FOREIGN KEY (TeamID) REFERENCES Team(UUID) ON DELETE CASCADE
      );
    `);

    /* ===================== SECURITY AREA ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS SecurityArea (
        UUID TEXT PRIMARY KEY,
        EquipmentID TEXT NOT NULL,
        Quantity INTEGER NOT NULL,
        InstallationDate TEXT NOT NULL,
        RemovalDate TEXT NOT NULL,
        GeoJson TEXT NOT NULL,
        FOREIGN KEY(EquipmentID) REFERENCES Equipment(UUID) ON DELETE CASCADE
      );
    `);

    /* ===================== ACTION ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Action (
        UUID TEXT PRIMARY KEY,
        PlanningID TEXT NOT NULL,
        SecurityAreaID TEXT NOT NULL,
        Type TEXT CHECK(Type IN ('setup','removal')),
        Date TEXT NOT NULL,
        Longitude REAL NOT NULL,
        Latitude REAL NOT NULL,
        FOREIGN KEY (PlanningID) REFERENCES Planning(UUID) ON DELETE CASCADE,
        FOREIGN KEY (SecurityAreaID) REFERENCES SecurityArea(UUID) ON DELETE CASCADE
      );
    `);

    /* ===================== AREA ===================== */
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Area (
        UUID TEXT PRIMARY KEY,
        EventID TEXT NOT NULL,
        Name TEXT,
        ColorHex TEXT NOT NULL,
        GeoJson TEXT NOT NULL,
        FOREIGN KEY (EventID) REFERENCES Evenement(UUID) ON DELETE CASCADE
      );
    `);
    //await insertHardcodedEvent(db);
    const res = await db.getAllAsync("PRAGMA table_info(Evenement);");
    console.log(res);

    console.log("Base initialisée !");
  } catch (e) {
    console.error("Erreur lors de la création de la base :", e);
  }
}
export async function insertHardcodedEvent(db: SQLiteDatabase) {
  const event = {
    UUID: "event-001",
    Title: "Festival Sécurité 2025",
    StartDate: "2025-06-01T08:00:00.000Z",
    EndDate: "2025-06-05T18:00:00.000Z",
    Status: "toOrganize" as const,
  };

  try {
    /* ===================== EVENEMENT ===================== */
    await db.runAsync(
      `
      INSERT OR REPLACE INTO Evenement
        (UUID, Title, StartDate, EndDate, Status)
      VALUES (?, ?, ?, ?, ?);
      `,
      [event.UUID, event.Title, event.StartDate, event.EndDate, event.Status]
    );

    /* ===================== POINTS ===================== */
    const points = [
      {
        UUID: "point-001",
        Name: "Entrée principale",
        lat: 48.5739,
        lng: 7.7524,
        comment: "Entrée visiteurs",
      },
      {
        UUID: "point-002",
        Name: "Poste de sécurité",
        lat: 48.5728,
        lng: 7.7512,
        comment: "Présence agents",
      },
      {
        UUID: "point-003",
        Name: "Sortie secours",
        lat: 48.5745,
        lng: 7.7505,
        comment: "Accès pompiers",
      },
    ];

    for (const p of points) {
      await db.runAsync(
        `
        INSERT OR REPLACE INTO Point
          (UUID, EventID, Name, Latitude, Longitude, Comment, Validated)
        VALUES (?, ?, ?, ?, ?, ?, 1);
        `,
        [p.UUID, event.UUID, p.Name, p.lat, p.lng, p.comment]
      );
    }

    /* ===================== AREA ===================== */
    const areaGeoJson = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [7.7505, 48.5725],
          [7.754, 48.5725],
          [7.754, 48.5745],
          [7.7505, 48.5745],
          [7.7505, 48.5725],
        ],
      ],
    });

    await db.runAsync(
      `
      INSERT OR REPLACE INTO Area
        (UUID, EventID, Name, ColorHex, GeoJson)
      VALUES (?, ?, ?, ?, ?);
      `,
      [
        "area-001",
        event.UUID,
        "Zone sécurisée principale",
        "#ff00004f",
        areaGeoJson,
      ]
    );

    /* ===================== PATH ===================== */
    const pathGeoJson = JSON.stringify({
      type: "LineString",
      coordinates: [
        [7.7508, 48.573],
        [7.7515, 48.5735],
        [7.7523, 48.574],
        [7.7532, 48.5743],
      ],
    });

    await db.runAsync(
      `
      INSERT OR REPLACE INTO Path
        (UUID, EventID, Name, ColorHex, StartDate,
         FastestEstimatedSpeed, SlowestEstimatedSpeed, GeoJson)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        "path-001",
        event.UUID,
        "Parcours agents",
        "#0000FF",
        event.StartDate,
        5.0,
        2.5,
        pathGeoJson,
      ]
    );

    console.log("Événement, points, area et path insérés ✅");
  } catch (error) {
    console.error("Erreur insertion données de démo :", error);
  }
}

export async function deleteDatabase(
  db: SQLiteDatabase,
  dbName: string = "base.db"
) {
  try {
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync(dbName);
    console.log("Base supprimée");
    return true;
  } catch (e) {
    console.error("Erreur suppression DB :", e);
    return false;
  }
}
