"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function LocationPicker({ lat, lng, onLocationSelect }: { lat: string, lng: string, onLocationSelect: (lat: string, lng: string) => void }) {
  // Default to Hyderabad/Secunderabad center
  const defaultPos: [number, number] = [17.4399, 78.4983]; 
  const pos: [number, number] | null = lat && lng ? [parseFloat(lat), parseFloat(lng)] : null;

  return (
    <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative shadow-inner">
      <MapContainer center={pos || defaultPos} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <LocationMarker 
          position={pos} 
          setPosition={(p: [number, number]) => onLocationSelect(p[0].toString(), p[1].toString())} 
        />
      </MapContainer>
    </div>
  );
}