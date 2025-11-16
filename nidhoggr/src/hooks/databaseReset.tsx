import * as SQLite from "expo-sqlite";

export async function deleteDatabase(dbName: string = "base.db", db) {
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
