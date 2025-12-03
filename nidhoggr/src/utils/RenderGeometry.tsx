import React from "react";
import { Marker, Polyline, Polygon, LatLng } from "react-native-maps";
import { GeometriesList, geoJSON } from "../../types/types";

export default function RenderGeometries({ geometries }: GeometriesList) {
  if (!geometries || geometries.length === 0) return null;

  return (
    <>
      {geometries.map((geomString: string, i: number) => {
        let geom: geoJSON;

        try {
          geom = JSON.parse(geomString);
        } catch (e) {
          console.warn("JSON invalide:", geomString);
          return null;
        }

        if (!geom || !geom.type) return null;

        switch (geom.type) {
          case "Point":
            return (
              <Marker
                key={`point-${i}`}
                coordinate={{
                  latitude: geom.coordinates[1] as number,
                  longitude: geom.coordinates[0] as number,
                }}
              />
            );

          case "LineString":
            return (
              <Polyline
                key={`line-${i}`}
                coordinates={(geom.coordinates as [number, number][]).map(
                  (c) => ({
                    latitude: c[1],
                    longitude: c[0],
                  })
                )}
                strokeWidth={3}
              />
            );

          case "Polygon":
            return (
              <Polygon
                key={`poly-${i}`}
                coordinates={(geom.coordinates[0] as [number, number][]).map(
                  (c) => ({
                    latitude: c[1],
                    longitude: c[0],
                  })
                )}
                strokeWidth={2}
                fillColor="rgba(0, 150, 255, 0.3)"
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}
