import L from 'leaflet';

export const originIcon = L.divIcon({
  className: 'daspay-origin-icon',
  html: `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:rgba(16,185,129,0.2);"></span>
      <span style="position:relative;z-index:10;width:26px;height:26px;border-radius:9999px;background:#10b981;border:3px solid white;box-shadow:0 4px 12px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">A</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export const destinationIcon = L.divIcon({
  className: 'daspay-destination-icon',
  html: `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:rgba(239,68,68,0.2);"></span>
      <span style="position:relative;z-index:10;width:26px;height:26px;border-radius:9999px;background:#ef4444;border:3px solid white;box-shadow:0 4px 12px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">B</span>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export const waypointIcon = L.divIcon({
  className: 'daspay-waypoint-icon',
  html: `
    <div style="width:16px;height:16px;border-radius:9999px;background:white;border:3px solid #185FA5;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export const deliveredIcon = L.divIcon({
  className: 'daspay-delivered-icon',
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:rgba(16,185,129,0.25);"></span>
      <span style="position:relative;z-index:10;width:32px;height:32px;border-radius:9999px;background:linear-gradient(135deg,#10b981,#059669);border:3px solid white;box-shadow:0 6px 16px rgba(16,185,129,0.55);display:flex;align-items:center;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export function vehicleIcon(mode: 'truck' | 'train', bearing = 0): L.DivIcon {
  const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;
  const trainSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/></svg>`;
  const svg = mode === 'truck' ? truckSvg : trainSvg;
  const color = mode === 'truck' ? '#185FA5' : '#7c3aed';

  return L.divIcon({
    className: 'daspay-vehicle-icon',
    html: `
      <div style="position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:${color};opacity:0.22;animation:daspayVehiclePing 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute;width:70%;height:70%;border-radius:9999px;background:${color};opacity:0.35;animation:daspayVehiclePing 2.4s cubic-bezier(0,0,0.2,1) infinite;animation-delay:0.4s;"></span>
        <span style="position:relative;z-index:10;width:40px;height:40px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 8px 22px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;transform:rotate(${bearing - 90}deg);">${svg}</span>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}
