import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { deleteDatabase } from "./database";

export async function getAll<T>(db: SQLiteDatabase, table: string) {
  return (await db.getAllAsync(`SELECT * FROM ${table}`)) as T[];
}

export async function getAllWhere<T>(
  db: SQLiteDatabase,
  table: string,
  columns: string[],
  values: any[],
  orderBy?: string
): Promise<T[]> {
  try {
    const where =
      columns.length > 0
        ? `WHERE ${columns.map((col) => `${col} = ?`).join(" AND ")}`
        : "";

    const orderClause = orderBy ? ` ORDER BY ${orderBy}` : "";

    const query = `SELECT * FROM ${table} ${where}${orderClause}`;
    console.log("Executing query:", query, values);

    const res = await db.getAllAsync(query, values);
    return res as T[];
  } catch (error) {
    console.error("Error in getAllWhere:", error);
    return [];
  }
}

export async function insert<T>(
  db: SQLiteDatabase,
  table: string,
  data: Partial<T>
): Promise<void> {
  try {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(",");

    const query = `INSERT INTO ${table} (${keys.join(
      ","
    )}) VALUES (${placeholders})`;
    const values: any[] = Object.values(data);

    await db.runAsync(query, values);
  } catch (e) {
    console.log(e);
  }
}

export async function insertOrReplace<T>(
  db: SQLiteDatabase,
  table: string,
  data: Partial<T>
): Promise<void> {
  try {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(",");

    const query = `INSERT OR REPLACE INTO ${table} (${keys.join(
      ","
    )}) VALUES (${placeholders})`;
    const values: any[] = Object.values(data);

    await db.runAsync(query, values);
  } catch (e) {
    console.log(e);
  }
}

export async function update<T>(
  db: SQLiteDatabase,
  table: string,
  data: Partial<T>,
  where: string,
  whereValues: any[]
): Promise<void> {
  const keys = Object.keys(data);
  const setters = keys.map((k) => `${k} = ?`).join(",");

  const query = `UPDATE ${table} SET ${setters} WHERE ${where}`;
  const values = [...Object.values(data), ...whereValues];

  await db.runAsync(query, values);
}

export async function getPointsForEvent<T>(
  db: SQLiteDatabase,
  eventId: string
) {
  return (await db.getAllAsync(
    `SELECT Point.*, Equipment.Type AS EquipmentType
     FROM Point
     LEFT JOIN Equipment ON Equipment.UUID = Point.EquipmentID
     WHERE Point.EventID = ?`,
    [eventId]
  )) as T[];
}

export async function getPhotosForPoint<T>(
  db: SQLiteDatabase,
  pointId: string
) {
  return (await db.getAllAsync(
    `SELECT Picture.* FROM Picture
    WHERE Picture.PointID = ?`,
    [pointId]
  )) as T[];
}

export async function deleteWhere(
  db: SQLiteDatabase,
  table: string,
  columns: string[],
  values: any[]
): Promise<number> {
  try {
    if (columns.length === 0) {
      throw new Error(
        "deleteWhere: columns cannot be empty — refusing full table delete."
      );
    }

    const where = columns.map((col) => `${col} = ?`).join(" AND ");

    const query = `DELETE FROM ${table} WHERE ${where}`;
    console.log("Executing delete:", query, values);

    const res = await db.runAsync(query, values);

    // runAsync returns { changes, lastId }
    return res.changes ?? 0;
  } catch (error) {
    console.error("Error in deleteWhere:", error);
    return 0;
  }
}

export async function flushDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    console.log("Flushing database...");
    // Ordre de suppression important pour respecter les contraintes de clés étrangères
    await db.runAsync("DELETE FROM Picture");
    await db.runAsync("DELETE FROM Point");
    await db.runAsync("DELETE FROM Area");
    await db.runAsync("DELETE FROM Path");
    await db.runAsync("DELETE FROM Action");
    await db.runAsync("DELETE FROM Planning");
    await db.runAsync("DELETE FROM SecurityArea");
    await db.runAsync("DELETE FROM TeamEmployees");
    await db.runAsync("DELETE FROM Team");
    await db.runAsync("DELETE FROM Employees");
    await db.runAsync("DELETE FROM Equipment");
    await db.runAsync("DELETE FROM Evenement");
    console.log("Database flushed successfully.");
  } catch (error) {
    console.error("Error flushing database:", error);
    console.error("Deleting db instead");
    await deleteDatabase(db);
  }
}
