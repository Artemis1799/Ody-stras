import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";

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

  const rows: { count: number }[] = await db.getAllAsync(
    "SELECT COUNT(*) AS count FROM Equipement"
  );

  if (rows[0].count === 0) {
    console.log("Insertion des équipements par défaut…");

    await db.execAsync(`
      INSERT INTO Equipement (UUID, Type, Description, Unite, Stock_total, Stock_restant)
      VALUES
        ('f50252ce-31bb-4c8b-a70c-51b7bb630bc3', 'Aucun', 'Aucun', 'U', 0, 0),
        ('21ddc970-e5eb-4105-830b-80e1161eea72', 'Glissières béton armé (GBA)', '60 cm de large – Longueur de 2 mètres ou 1 mètre', 'U', 0, 0),
        ('1ce53d08-b85a-4fb0-8e0b-dfba5b2fb17b', 'Blocs de béton', 'Bloc de taille 0,6m x 0,6m x 1m ou 0,6m x 0,6m x 2,5m', 'U', 0, 0),
        ('60655695-a8ec-4e88-8d9f-0c770cb84a1a', 'Barrières Vauban', 'Barrières de 2 mètres', 'U', 0, 0),
        ('7f05e6b6-1bb9-4c9a-bd4a-04aaba995cd1', 'Barrières Héras', 'Barrières de 3,5 mètres', 'U', 0, 0),
        ('d712a245-2786-4696-8788-96c9a705eb0b', 'Obstacles', 'Existent avec un voile d’occultation', 'U', 0, 0),
        ('c464a420-df26-478d-bdb8-e3c9301afab9', 'Engins de blocage', 'Engins routiers et matériels, ensembles mobiles pour permettre le passage des secours, utilisés pour bloquer les rues.', 'U', 0, 0)
    `);

    console.log("Équipements insérés !");
  } else {
    console.log("Équipements déjà présents.");
  }
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
