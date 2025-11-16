import * as FileSystem from "expo-file-system/legacy";

export async function deleteDatabase(dbName: string = "base.db") {
  try {
    const clonePath = FileSystem.documentDirectory + dbName;

    const info = await FileSystem.getInfoAsync(clonePath);

    if (info.exists) {
      await FileSystem.deleteAsync(clonePath, { idempotent: true });
      console.log("Clone de la base supprimé :", clonePath);
      return true;
    } else {
      console.log("Pas de clone de la base à supprimer.");
      return false;
    }
  } catch (e) {
    console.error("Erreur lors de la suppression du clone :", e);
    return false;
  }
}
