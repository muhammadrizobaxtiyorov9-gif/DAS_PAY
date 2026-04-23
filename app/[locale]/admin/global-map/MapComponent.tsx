'use client';

import { useEffect, useRef, useState } from 'react';
import { YMaps, Map, Placemark, useYMaps } from '@pbe/react-yandex-maps';
import { shipmentStatusMeta } from '@/lib/shipment-status';
import { wagonStatusMeta } from '@/lib/wagon-status';

function getPreset(meta: any, isWagon: boolean, isTruck: boolean, isSelected: boolean) {
  // Map our UI colors to Yandex standard presets
  let color = 'blue';
  if (meta.pill?.includes('emerald') || meta.pill?.includes('green')) color = 'green';
  if (meta.pill?.includes('red')) color = 'red';
  if (meta.pill?.includes('orange') || meta.pill?.includes('yellow')) color = 'orange';
  if (meta.pill?.includes('gray') || meta.pill?.includes('slate')) color = 'gray';

  if (isWagon) return `islands#${color}RailwayIcon`;
  if (isTruck) return `islands#${color}AutoIcon`;
  return `islands#${color}DotIcon`;
}

function generateBalloon(type: 'shipment' | 'wagon' | 'truck', item: any, meta: any) {
  const title = type === 'shipment' ? `📦 ${item.trackingCode}` : type === 'wagon' ? `🚂 ${item.number}` : `🚚 ${item.plateNumber}`;
  
  let detailsHtml = '';
  if (type === 'shipment') {
    detailsHtml += `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">Mijoz</div>
        <div>${item.client?.name || item.senderName}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">Marshrut</div>
        <div>${item.origin} &rarr; ${item.destination}</div>
      </div>
    `;
  }

  if ((type === 'wagon' || type === 'truck') && item.shipments?.[0]) {
    detailsHtml += `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">Biriktirilgan Yuk</div>
        <div>${item.shipments[0].trackingCode}</div>
      </div>
    `;
  }

  if ((type === 'wagon' || type === 'truck') && item.currentStation) {
    detailsHtml += `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; color: #888; text-transform: uppercase;">Stansiya / Baza</div>
        <div>📍 ${item.currentStation.nameUz}</div>
      </div>
    `;
  }

  const updatedDate = new Date(item.lastLocationUpdate || item.updatedAt).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  return `
    <div style="padding: 8px; min-width: 220px; font-family: sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #185FA5; font-size: 14px;">${title}</strong>
        <span style="font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 12px; font-weight: bold;">
          ${meta.labelText}
        </span>
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: #333;">
        ${detailsHtml}
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #666;">
          🕒 Yangilandi: ${updatedDate}
        </div>
      </div>
    </div>
  `;
}

export default function MapComponent({
  shipments,
  wagons = [],
  trucks = [],
  activeItemId,
  onMarkerClick,
  activeTab,
}: {
  shipments: any[];
  wagons?: any[];
  trucks?: any[];
  activeItemId: string | null;
  onMarkerClick: (id: string) => void;
  activeTab: 'shipments' | 'wagons' | 'trucks';
}) {
  const mapRef = useRef<any>(null);

  // Find center based on active item
  let centerLat = 41.2995;
  let centerLng = 69.2401;

  if (activeItemId) {
    if (activeItemId.startsWith('s_')) {
      const activeShipment = shipments.find(s => s.id === parseInt(activeItemId.replace('s_', '')));
      if (activeShipment?.currentLat || activeShipment?.originLat) {
        centerLat = activeShipment.currentLat || activeShipment.originLat;
        centerLng = activeShipment.currentLng || activeShipment.originLng;
      }
    } else if (activeItemId.startsWith('w_')) {
      const activeWagon = wagons.find(w => w.id === parseInt(activeItemId.replace('w_', '')));
      if (activeWagon?.currentLat || activeWagon?.currentStation?.lat) {
        centerLat = activeWagon.currentLat || activeWagon.currentStation?.lat;
        centerLng = activeWagon.currentLng || activeWagon.currentStation?.lng;
      }
    } else if (activeItemId.startsWith('t_')) {
      const activeTruck = trucks.find(t => t.id === parseInt(activeItemId.replace('t_', '')));
      if (activeTruck?.currentLat || activeTruck?.currentStation?.lat) {
        centerLat = activeTruck.currentLat || activeTruck.currentStation?.lat;
        centerLng = activeTruck.currentLng || activeTruck.currentStation?.lng;
      }
    }
  }

  // Effect to pan map
  useEffect(() => {
    if (mapRef.current && activeItemId) {
      mapRef.current.setCenter([centerLat, centerLng], 8, { checkZoomRange: true, duration: 1000 });
    }
  }, [centerLat, centerLng, activeItemId]);

  return (
    <YMaps query={{ lang: 'ru_RU' }}>
      <Map
        instanceRef={mapRef}
        defaultState={{ center: [41.2995, 69.2401], zoom: 6 }}
        width="100%"
        height="100%"
        modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
      >
        {activeTab === 'shipments' && shipments.map(s => {
          const lat = s.currentLat || s.originLat;
          const lng = s.currentLng || s.originLng;
          if (!lat || !lng) return null;
          const meta = shipmentStatusMeta(s.status);
          const isSelected = activeItemId === `s_${s.id}`;

          return (
            <Placemark
              key={`s_${s.id}`}
              geometry={[lat, lng]}
              properties={{
                hintContent: s.trackingCode,
                balloonContent: generateBalloon('shipment', s, meta)
              }}
              options={{
                preset: getPreset(meta, false, false, isSelected),
                iconColor: isSelected ? '#ff0000' : undefined
              }}
              onClick={() => onMarkerClick(`s_${s.id}`)}
            />
          );
        })}

        {activeTab === 'wagons' && wagons.map(w => {
          const lat = w.currentLat || w.currentStation?.lat;
          const lng = w.currentLng || w.currentStation?.lng;
          if (!lat || !lng) return null;
          const meta = wagonStatusMeta(w.status);
          const isSelected = activeItemId === `w_${w.id}`;

          return (
            <Placemark
              key={`w_${w.id}`}
              geometry={[lat, lng]}
              properties={{
                hintContent: w.number,
                balloonContent: generateBalloon('wagon', w, meta)
              }}
              options={{
                preset: getPreset(meta, true, false, isSelected),
              }}
              onClick={() => onMarkerClick(`w_${w.id}`)}
            />
          );
        })}

        {activeTab === 'trucks' && trucks.map(t => {
          const lat = t.currentLat || t.currentStation?.lat;
          const lng = t.currentLng || t.currentStation?.lng;
          if (!lat || !lng) return null;
          const meta = wagonStatusMeta(t.status);
          const isSelected = activeItemId === `t_${t.id}`;

          return (
            <Placemark
              key={`t_${t.id}`}
              geometry={[lat, lng]}
              properties={{
                hintContent: t.plateNumber,
                balloonContent: generateBalloon('truck', t, meta)
              }}
              options={{
                preset: getPreset(meta, false, true, isSelected),
              }}
              onClick={() => onMarkerClick(`t_${t.id}`)}
            />
          );
        })}
      </Map>
    </YMaps>
  );
}
