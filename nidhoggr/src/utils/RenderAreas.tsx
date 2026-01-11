import React from "react";
import { Polygon } from "react-native-maps";
import { Area, GeoJSON, RenderAreasProps } from "../../types/types";

// Convertit une couleur hex en rgba avec opacité
const hexToRgba = (hex: string, opacity: number = 0.4): string => {
  // Enlever le # si présent
  const cleanHex = hex.replace('#', '');

  // Parser les valeurs RGB
  let r, g, b;
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    return `rgba(51, 136, 255, ${opacity})`; // Couleur par défaut
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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

        // Appliquer une opacité de 40% pour voir les rues à travers
        const fillColorWithOpacity = hexToRgba(singleArea.ColorHex || "#3388ff", 0.4);
        const strokeColor = singleArea.ColorHex || "#3388ff";

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
            strokeColor={strokeColor}
            fillColor={fillColorWithOpacity}
            accessibilityLabel={singleArea.Name ?? ""}
          />
        );
      })}
    </>
  );
}
