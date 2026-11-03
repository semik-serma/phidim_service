
"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom technician marker
const technicianIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;
      height:22px;
      background:#10b981;
      border:3px solid white;
      border-radius:50%;
      box-shadow:
        0 0 0 8px rgba(16,185,129,.2),
        0 3px 10px rgba(0,0,0,.3);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Smooth moving technician marker
function MovingMarker({ latitude, longitude }) {
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const start = marker.getLatLng();
    const target = L.latLng(latitude, longitude);

    let animationId;
    const startTime = performance.now();
    const duration = 1500;

    const animate = (time) => {
      const progress = Math.min(
        (time - startTime) / duration,
        1
      );

      // Smooth easing
      const eased =
        progress * progress * (3 - 2 * progress);

      const lat =
        start.lat +
        (target.lat - start.lat) * eased;

      const lng =
        start.lng +
        (target.lng - start.lng) * eased;

      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        marker.setLatLng(target);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [latitude, longitude]);

  return (
    <Marker
      ref={markerRef}
      position={[latitude, longitude]}
      icon={technicianIcon}
    >
      <Popup>Technician current location</Popup>
    </Marker>
  );
}

export default function TechnicianMap({
  latitude,
  longitude,
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      scrollWheelZoom={true}
      className="h-[420px] w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MovingMarker
        latitude={latitude}
        longitude={longitude}
      />
    </MapContainer>
  );
}
