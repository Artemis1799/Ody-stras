import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";

/*
export function usePoints(eventId: string) {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    load();
  }, [eventId]);

  const load = async () => {
    const res: Point[] = await db.getAllAsync(
      "SELECT * FROM Point WHERE Event_ID = ?",
      [eventId]
    );
    console.log(res);
    setPoints(res);
  };

  return points;
}*/

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
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(",");

  const query = `INSERT INTO ${table} (${keys.join(
    ","
  )}) VALUES (${placeholders})`;
  console.log(query);
  const values: any[] = Object.values(data);

  await db.runAsync(query, values);
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
  console.log(query);
  const values = [...Object.values(data), ...whereValues];

  await db.runAsync(query, values);
}

export async function getPointsForEvent<T>(
  db: SQLiteDatabase,
  eventId: string
) {
  return (await db.getAllAsync(
    `SELECT Point.*, Equipement.Type AS EquipType
     FROM Point
     LEFT JOIN Equipement ON Equipement.UUID = Point.Equipement_ID
     WHERE Point.Event_ID = ?`,
    [eventId]
  )) as T[];
}

export async function getPhotosForPoint<T>(
  db: SQLiteDatabase,
  pointId: string
) {
  return (await db.getAllAsync(
    `SELECT Photo.* FROM Photo
    JOIN Image_Point ON Photo.UUID = Image_Point.Image_ID
    WHERE Image_Point.Point_ID = ?`,
    [pointId]
  )) as T[];
}
