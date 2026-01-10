import React from "react";
import { Polygon } from "react-native-maps";
import { Area, GeoJSON, RenderAreasProps } from "../../types/types";

export default function RenderAreas({ areas }: RenderAreasProps) {
  if (!areas || areas.length === 0) return null;

  return (
    <>
      {areas.map((singleArea, i) => {
        let geom: GeoJSON;

        try {
          geom = JSON.parse(singleArea.GeoJson);
        } catch {
          console.warn("JSON invalide:", singleArea.GeoJson);
          return null;
        }

        if (geom.type !== "Polygon") return null;

        return (
          <Polygon
            key={`poly-${i}`}
            coordinates={(geom.coordinates[0] as [number, number][]).map(
              ([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              })
            )}
            strokeWidth={2}
            fillColor={singleArea.ColorHex}
            accessibilityLabel={singleArea.Name ?? ""}
          />
        );
      })}
    </>
  );
}
