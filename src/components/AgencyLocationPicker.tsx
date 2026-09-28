'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { SearchIcon, MapPinIcon } from '@/components/Icons';

interface AgencyLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export default function AgencyLocationPicker({
  initialLat = -12.046374,
  initialLng = -77.042793,
  departamento = '',
  provincia = '',
  distrito = '',
  direccion = '',
  onChange,
}: AgencyLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Inicializar Leaflet dinámicamente en el cliente
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      // Limpiar contenedor si ya tenía un mapa previo
      if ((mapContainerRef.current as any)._leaflet_id) {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
          mapInstanceRef.current = null;
        }
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      // Icono SVG institucional Banco de la Nación
      const redPinIcon = L.divIcon({
        className: 'custom-bn-pin',
        html: `
          <div style="
            background-color: #C8102E;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const map = L.map(mapContainerRef.current).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: redPinIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
        onChange({ lat: position.lat, lng: position.lng });
      });

      map.on('click', (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        setLat(newLat);
        setLng(newLng);
        onChange({ lat: newLat, lng: newLng });
      });

      if (isMounted) {
        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Función para mover el mapa según la ubicación geocodificada
  const flyToLocation = useCallback(
    async (queryText: string, zoomLevel: number) => {
      if (!mapInstanceRef.current || !markerRef.current) return;
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryText
          )}&countrycodes=pe&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const resultLat = parseFloat(data[0].lat);
          const resultLng = parseFloat(data[0].lon);

          setLat(resultLat);
          setLng(resultLng);
          onChange({ lat: resultLat, lng: resultLng });

          mapInstanceRef.current.flyTo([resultLat, resultLng], zoomLevel, {
            duration: 1.2,
          });
          markerRef.current.setLatLng([resultLat, resultLng]);
        }
      } catch {
        // En caso de fallo de red en geocoding, continuar sin bloquear la UI
      } finally {
        setIsSearching(false);
      }
    },
    [onChange]
  );

  // Auto-desplazamiento del mapa al cambiar Departamento, Provincia o Distrito
  const lastGeocodedRef = useRef<string>('');
  useEffect(() => {
    const locParts = [distrito, provincia, departamento, 'Perú'].filter(Boolean);
    if (locParts.length <= 1) return;

    const currentKey = locParts.join(', ');
    if (currentKey === lastGeocodedRef.current) return;
    lastGeocodedRef.current = currentKey;

    const zoom = distrito ? 15 : provincia ? 13 : 11;
    flyToLocation(currentKey, zoom);
  }, [departamento, provincia, distrito, flyToLocation]);

  // Búsqueda manual: combina lo escrito con distrito, provincia y departamento
  const handleSearchPlace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const typed = searchQuery.trim() || direccion.trim();
    if (!typed && !distrito) return;

    setIsSearching(true);
    setSearchError(null);

    // Concatenación inteligente con contexto territorial peruano
    const fullQuery = [typed, distrito, provincia, departamento, 'Perú']
      .filter(Boolean)
      .join(', ');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullQuery
        )}&countrycodes=pe&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const resultLat = parseFloat(data[0].lat);
        const resultLng = parseFloat(data[0].lon);

        setLat(resultLat);
        setLng(resultLng);
        onChange({ lat: resultLat, lng: resultLng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([resultLat, resultLng], 16, { duration: 1.2 });
          markerRef.current.setLatLng([resultLat, resultLng]);
        }
      } else {
        setSearchError(`No se ubicó "${fullQuery}". Puedes hacer clic directamente en el mapa.`);
      }
    } catch {
      setSearchError('Error de conexión con el servicio de geocodificación.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Barra de búsqueda de dirección con contexto inteligente */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              distrito
                ? `Buscar calle o avenida en ${distrito}, ${provincia}...`
                : 'Escribe una avenida o dirección...'
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearchPlace(e)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-100"
          />
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <button
          type="button"
          onClick={() => handleSearchPlace()}
          disabled={isSearching}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
        >
          {isSearching ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <SearchIcon className="w-3.5 h-3.5" />
          )}
          <span>{isSearching ? 'Buscando...' : 'Ubicar en Mapa'}</span>
        </button>
      </div>

      {searchError && (
        <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
          {searchError}
        </p>
      )}

      {/* Contenedor del Mapa */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Coordenadas en vivo */}
        <div className="absolute bottom-2 left-2 z-10 bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[10px] font-mono border border-slate-700 flex items-center gap-1.5 shadow-md">
          <MapPinIcon className="w-3.5 h-3.5 text-red-500" />
          <span>
            Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
          </span>
        </div>

        <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium shadow-sm pointer-events-none">
          Haz clic o arrastra el pin para ajustar
        </div>
      </div>
    </div>
  );
}
