'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { YMaps, Map, Placemark, Polyline } from '@pbe/react-yandex-maps';

const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';

interface Props {
  points?: [number, number][];
  stopPoints?: [number, number][];
  origin?: string;
  destination?: string;
}

export default function YandexTrackingMap({ points = [], stopPoints = [], origin, destination }: Props) {
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Center based on last point or default Tashkent
  const currentPos = points.length > 0 ? points[points.length - 1] : [41.2995, 69.2401];

  const drawRoute = useCallback(() => {
    const ym = ymapsRef.current;
    const map = mapRef.current;
    if (!ym || !map || !origin || !destination) return;

    if (routeRef.current) {
      try { map.geoObjects.remove(routeRef.current); } catch { /* noop */ }
      routeRef.current = null;
    }

    try {
      const mr = new ym.multiRouter.MultiRoute(
        { referencePoints: [origin, destination], params: { routingMode: 'auto' } },
        {
          boundsAutoApply: points.length === 0, // only auto-bound to route if we have no GPS points
          wayPointVisible: true,
          routeActiveStrokeColor: '#185FA5',
          routeActiveStrokeWidth: 6,
          routeActiveStrokeStyle: 'solid',
        }
      );
      routeRef.current = mr;
      map.geoObjects.add(mr);
    } catch (e) {
      console.error('Failed to draw yandex tracking route', e);
    }
  }, [origin, destination, points.length]);

  useEffect(() => {
    if (mapReady) {
      drawRoute();
      
      // Auto-fit bounds if we have points
      if (points.length > 0 && ymapsRef.current && mapRef.current) {
        try {
          const bounds = ymapsRef.current.util.bounds.fromGlobalPixels(
            ymapsRef.current.util.bounds.getCenterAndZoom(
              points.map((p) => p),
              [ymapsRef.current.coordSystem.geo]
            ).globalPixels,
            mapRef.current.action.getCurrentState().zoom
          );
          // Just bounds of points:
          const lats = points.map(p => p[0]);
          const lngs = points.map(p => p[1]);
          mapRef.current.setBounds([
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
          ], { checkZoomRange: true, zoomMargin: 50 });
        } catch (e) {
          // fallback
        }
      }
    }
  }, [mapReady, drawRoute, points]);

  return (
    <YMaps query={{ apikey: YANDEX_API_KEY, lang: 'ru_RU', load: 'package.full,multiRouter.MultiRoute' }}>
      <Map
        defaultState={{ center: currentPos, zoom: points.length > 0 ? 12 : 5 }}
        state={{ center: currentPos, zoom: points.length > 0 ? 12 : 5 }}
        width="100%"
        height="100%"
        instanceRef={mapRef}
        onLoad={(ymaps: any) => {
          ymapsRef.current = ymaps;
          setMapReady(true);
        }}
        options={{ suppressMapOpenBlock: true }}
      >
        {/* GPS Trail */}
        {points.length > 1 && (
          <Polyline
            geometry={points}
            options={{
              strokeColor: '#ef4444',
              strokeWidth: 4,
              strokeOpacity: 0.8,
            }}
          />
        )}

        {/* Start Position of Trail */}
        {points.length > 0 && (
          <Placemark
            geometry={points[0]}
            options={{
              preset: 'islands#greenDotIcon',
            }}
            properties={{ balloonContent: '📍 Boshlang\'ich nuqta' }}
          />
        )}

        {/* Stop Points */}
        {stopPoints.map((p, i) => (
          <Placemark
            key={`stop-${i}`}
            geometry={p}
            options={{ preset: 'islands#redCircleIcon' }}
            properties={{ balloonContent: `🛑 To'xtash #${i + 1}` }}
          />
        ))}

        {/* Current Position */}
        {points.length > 0 && (
          <Placemark
            geometry={currentPos}
            options={{ preset: 'islands#blueAutoIcon' }}
            properties={{ balloonContent: '🚛 So\'nggi joylashuv' }}
          />
        )}
      </Map>
    </YMaps>
  );
}
