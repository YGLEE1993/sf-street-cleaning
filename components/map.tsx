"use client"

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useState, useEffect } from "react"

// Custom vivid marker icon with shadow
const icon = L.icon({
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDYiIHZpZXdCb3g9IjAgMCA0MCA0NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMwMDdBRkYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjYiIGZpbGw9IiMwMDdBRkYiIG9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4=",
})

// Apple-style popup
const popupOptions = {
  className: "apple-popup",
  closeButton: true,
}

interface StreetMapProps {
  line: Array<[number, number]>
  addressCoords: [number, number]
  side?: "left" | "right" | null
  address?: string
}

export function StreetMap({
  line,
  addressCoords,
  side,
  address,
}: StreetMapProps) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768
    }
    return false
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Convert coordinates [lng, lat] → [lat, lng] for Leaflet
  const polyline: [number, number][] = line.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  )
  const markerPos: [number, number] = [addressCoords[1], addressCoords[0]]
  const center: [number, number] = markerPos

  // Determine color based on side
  const lineColor = side === "left" ? "#FF3B30" : "#34C759" // Red for left, Green for right
  const fillColor = side === "left" ? "#FF3B3010" : "#34C75910"

  return (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-100">
      <style jsx global>{`
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
          border-radius: 16px !important;
          overflow: hidden;
          background: white !important;
          backdrop-filter: blur(10px);
        }
        .leaflet-control-zoom a {
          border: none !important;
          background: white !important;
          color: #1d1d1f !important;
          font-weight: 700 !important;
          font-size: 18px !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #007aff !important;
          color: white !important;
          transform: scale(1.05);
        }
        .apple-popup {
          border-radius: 16px !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25) !important;
          padding: 0 !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          background: white !important;
        }
        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px);
          border-radius: 8px !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }
        .leaflet-tile-container img {
          border-radius: 0 !important;
        }
        @media (max-width: 768px) {
          .leaflet-container {
            touch-action: pan-y pinch-zoom !important;
          }
          .leaflet-pane {
            touch-action: pan-y pinch-zoom !important;
          }
          .leaflet-map-pane {
            touch-action: pan-y pinch-zoom !important;
          }
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={17}
        scrollWheelZoom={true}
        dragging={!isMobile}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Polyline
          positions={polyline}
          pathOptions={{
            color: lineColor,
            weight: 8,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Marker position={markerPos} icon={icon}>
          <Popup autoPan={true} className="apple-popup" closeButton={true}>
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: "15px",
                padding: "12px 8px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ marginBottom: "6px", fontSize: "16px" }}>
                📍 {address || "Your address"}
              </div>
              {side && (
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginTop: "6px",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    backgroundColor: side === "left" ? "#FF3B30" : "#34C759",
                    display: "inline-block",
                  }}
                >
                  {side === "left" ? "← Left" : "→ Right"} Side
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
