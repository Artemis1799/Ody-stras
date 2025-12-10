import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";
import { EventGeometry } from "../types/types";

export async function setupDatabase(db: SQLiteDatabase) {
  console.log("Initialisation de la base…");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Evenement (
      UUID TEXT PRIMARY KEY,
      Nom TEXT NOT NULL,
      Description TEXT,
      Date_debut TIMESTAMP,
      Status TEXT CHECK(Status IN ('EN_DESINSTALLATION', 'TERMINE', 'EN_INSTALLATION', 'A_ORGANISER', 'EN_COURS')),
      Responsable TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Point (
      UUID TEXT PRIMARY KEY,
      Event_ID TEXT NOT NULL,
      Latitude FLOAT,
      Longitude FLOAT,
      Commentaire TEXT,
      Image_ID TEXT,
      Ordre INTEGER,
      Valide BOOLEAN DEFAULT FALSE,
      Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Equipement_ID TEXT,
      Equipement_quantite INTEGER,
      FOREIGN KEY(Event_ID) REFERENCES Evenement(UUID) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Photo (
      UUID TEXT PRIMARY KEY,
      Picture TEXT,
      Picture_name TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Image_Point (
      Image_ID TEXT NOT NULL,
      Point_ID TEXT NOT NULL,
      PRIMARY KEY (Image_ID, Point_ID),
      FOREIGN KEY (Image_ID) REFERENCES Photo(UUID) ON DELETE CASCADE,
      FOREIGN KEY (Point_ID) REFERENCES Point(UUID) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Equipement (
      UUID TEXT PRIMARY KEY,
      Type TEXT,
      Description TEXT,
      Unite TEXT,
      Stock_total FLOAT,
      Stock_restant FLOAT
    );
  `);

  await db.execAsync(`
  CREATE TABLE IF NOT EXISTS EventGeometries (
    EventID TEXT NOT NULL,
    GeometryID TEXT PRIMARY KEY,
    GeoJSON TEXT NOT NULL,
    FOREIGN KEY(EventID) REFERENCES Evenement(UUID) ON DELETE CASCADE
  );
`);
  console.log("Base initialisée !");
}

export async function deleteDatabase(
  db: SQLiteDatabase,
  dbName: string = "base.db"
) {
  if (!db) {
    throw new Error("DB non initialisée — appelle initDatabase() dans App.tsx");
  }
  try {
    await db.closeAsync();
    const res = await SQLite.deleteDatabaseAsync(dbName);
    console.log("Base supprimée :", res);
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression :", e);
    return false;
  }
}
