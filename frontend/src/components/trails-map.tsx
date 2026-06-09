"use client";

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import { Trail } from '@/lib/types';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function TrailsMap({ trails }: { trails: Trail[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!rootRef.current || mapRef.current) return;

    const first = trails[0]?.coordinates ?? [48.5, 24.5];
    const map = new maplibregl.Map({
      container: rootRef.current,
      style: MAP_STYLE,
      center: [first[1], first[0]],
      zoom: 6,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [trails]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    trails.forEach((trail) => {
      const popup = new Popup({ offset: 20 }).setHTML(
        `<div class="map-popup"><strong>${trail.name}</strong><p>${trail.region}, ${trail.country}</p><p>${trail.distanceKm} км · ${trail.elevationM} м</p></div>`,
      );

      const marker = new Marker({ color: '#2ae28f' })
        .setLngLat([trail.coordinates[1], trail.coordinates[0]])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (trails.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      trails.forEach((t) => bounds.extend([t.coordinates[1], t.coordinates[0]]));
      map.fitBounds(bounds, { padding: 48, duration: 800 });
    }
  }, [trails]);

  return <div ref={rootRef} className="map-shell" />;
}
