"use client";



import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";

// ── Fix the broken default icon that webpack/Turbopack can't resolve ──────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  latitude: string;
  longitude: string;
  severity_score: number;
  department: string;
  status: string; 
}

interface Props {
  tickets: Ticket[];
  onSelect?: (ticket: Ticket) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sevColor(s: number) {
  if (s >= 9) return "#dc2626";
  if (s >= 7) return "#ea580c";
  if (s >= 4) return "#d97706";
  return "#16a34a";
}

function sevLabel(s: number) {
  if (s >= 9) return "Critical";
  if (s >= 7) return "High";
  if (s >= 4) return "Moderate";
  return "Low";
}

function makePinIcon(score: number): L.DivIcon {
  const c = sevColor(score);
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
        <defs>
          <filter id="d${score}">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
          </filter>
        </defs>
        <g filter="url(#d${score})">
          <path d="M18 2C10.3 2 4 8.3 4 16c0 10.5 14 28 14 28S32 26.5 32 16C32 8.3 25.7 2 18 2z"
            fill="${c}" stroke="white" stroke-width="2.5"/>
          <circle cx="18" cy="16" r="7" fill="white"/>
          <text x="18" y="20" text-anchor="middle"
            font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="${c}"
          >${score}</text>
        </g>
      </svg>`,
    className: "",
    iconSize:    [36, 46],
    iconAnchor:  [18, 46],
    popupAnchor: [0, -48],
  });
}

// ─── Auto-fits the map to all ticket coordinates ──────────────────────────────

function BoundsFitter({ tickets }: { tickets: Ticket[] }) {
  const map = useMap();
  const prevLen = useRef(0);

  useEffect(() => {
    const valid = tickets.filter((t) => {
      const lat = parseFloat(t.latitude);
      const lng = parseFloat(t.longitude);
      return !isNaN(lat) && !isNaN(lng);
    });
    if (valid.length === 0 || valid.length === prevLen.current) return;
    prevLen.current = valid.length;

    const points = valid.map((t) =>
      L.latLng(parseFloat(t.latitude), parseFloat(t.longitude))
    );

    try {
      if (points.length === 1) {
        map.setView(points[0], 13, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(points), {
          padding: [48, 48],
          maxZoom: 13,
          animate: true,
        });
      }
    } catch {
      // Safe to ignore — can throw on rapid unmount
    }
  }, [map, tickets]);

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TicketMap({ tickets, onSelect }: Props) {
  const valid = tickets.filter((t) => {
    const lat = parseFloat(t.latitude);
    const lng = parseFloat(t.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  return (
    <>
      <MapContainer
        center={[20.5937, 78.9629]}   // India centre — overridden by BoundsFitter
        zoom={5}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        {/* CartoDB Positron — clean white/blue, no clutter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <BoundsFitter tickets={valid} />

        {valid.map((ticket) => {
          const lat   = parseFloat(ticket.latitude);
          const lng   = parseFloat(ticket.longitude);
          const color = sevColor(ticket.severity_score);
          const label = sevLabel(ticket.severity_score);

          return (
            <Marker
              key={ticket.id}
              position={[lat, lng]}
              icon={makePinIcon(ticket.severity_score)}
              eventHandlers={{ click: () => onSelect?.(ticket) }}
            >
              <Popup className="cf-popup" maxWidth={240}>
                <div style={{ fontFamily: "system-ui,sans-serif", minWidth: 180, padding: "2px 0" }}>
                  {/* ID + severity badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      background: "#2563eb", color: "#fff",
                      borderRadius: 8, padding: "3px 10px",
                      fontSize: 12, fontWeight: 800,
                    }}>#{ticket.id}</span>
                    <span style={{
                      background: `${color}18`, color,
                      border: `1px solid ${color}50`,
                      borderRadius: 99, padding: "2px 9px",
                      fontSize: 10, fontWeight: 800,
                    }}>{label}</span>
                  </div>

                  {/* Department */}
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {ticket.department}
                  </p>

                  {/* Coordinates */}
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
                    {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
                  </p>

                  {/* Score mini-bar */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                      <span>Severity</span>
                      <strong style={{ color }}>{ticket.severity_score}/10</strong>
                    </div>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${ticket.severity_score * 10}%`,
                        background: color,
                        borderRadius: 99,
                      }} />
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Popup chrome styles */}
      <style>{`
        .cf-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 8px 28px rgba(15,23,42,0.12) !important;
          padding: 0 !important;
        }
        .cf-popup .leaflet-popup-content {
          margin: 14px 16px !important;
        }
        .cf-popup .leaflet-popup-tip {
          background: white !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          top: 8px !important;
          right: 10px !important;
          color: #94a3b8 !important;
        }
      `}</style>
    </>
  );
}