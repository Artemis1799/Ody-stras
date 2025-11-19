import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

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
