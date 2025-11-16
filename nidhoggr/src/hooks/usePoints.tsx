import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

interface pointType {
  UUID: string;
  Nom: string;
  Date_debut: Date;
  Status: string;
  Responsable: string;
}

export function usePoints(eventId: string) {
  const db = useSQLiteContext();
  const [points, setPoints] = useState([]);

  useEffect(() => {
    load();
  }, [eventId]);

  const load = async () => {
    const res = await db.getAllAsync("SELECT * FROM Point WHERE Event_ID = ?", [
      eventId,
    ]);
    console.log(res);
    setPoints(res);
  };

  return points;
}
