import React from "react";
import { Polyline } from "react-native-maps";
import { Path, GeoJSON, RenderPathsProps } from "../../types/types";

export default function RenderPaths({ paths }: RenderPathsProps) {
  if (!paths || paths.length === 0) return null;

  return (
    <>
      {paths.map((singlePath, i) => {
        let geom: GeoJSON;

        try {
          geom = JSON.parse(singlePath.GeoJson);
        } catch {
          console.warn("JSON invalide:", singlePath.GeoJson);
          return null;
        }

        if (geom.type !== "LineString") return null;

        return (
          <Polyline
            key={`line-${i}`}
            coordinates={(geom.coordinates as [number, number][]).map(
              ([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              })
            )}
            fillColor={singlePath.ColorHex}
            strokeColor={singlePath.ColorHex}
            strokeWidth={3}
          />
        );
      })}
    </>
  );
}
