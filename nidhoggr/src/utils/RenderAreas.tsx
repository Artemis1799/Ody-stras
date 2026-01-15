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
  console.log("=== RenderAreas appelé ===", areas?.length || 0, "areas");

  if (!areas || areas.length === 0) {
    console.log("RenderAreas: Pas d'areas à afficher");
    return null;
  }

  return (
    <>
      {areas.map((singleArea, i) => {
        console.log(`RenderAreas [${i}]: UUID=${singleArea.UUID}, GeoJson présent=${!!singleArea.GeoJson}`);

        let geom: GeoJSON;

        try {
          geom = JSON.parse(singleArea.GeoJson);
          console.log(`RenderAreas [${i}]: Type de géométrie = ${geom.type}`);
        } catch (e) {
          console.warn("RenderAreas: JSON invalide:", singleArea.GeoJson, e);
          return null;
        }

        if (geom.type !== "Polygon") {
          console.log(`RenderAreas [${i}]: Type ${geom.type} ignoré (attendu: Polygon)`);
          return null;
        }

        // Vérifier que les coordonnées existent
        const coords = geom.coordinates;
        if (!coords || !Array.isArray(coords[0]) || (coords[0] as any[]).length === 0) {
          console.warn(`RenderAreas [${i}]: Pas de coordonnées valides`);
          return null;
        }

        // Appliquer une opacité de 40% pour voir les rues à travers
        const fillColorWithOpacity = hexToRgba(singleArea.ColorHex || "#3388ff", 0.4);
        const strokeColor = singleArea.ColorHex || "#3388ff";

        const coordinates = (geom.coordinates[0] as [number, number][]).map(
          ([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          })
        );

        console.log(`RenderAreas [${i}]: ${coordinates.length} points, couleur=${strokeColor}`);

        return (
          <Polygon
            key={`poly-${i}`}
            coordinates={coordinates}
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

