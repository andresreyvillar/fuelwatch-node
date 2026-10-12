import React from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
// Como URL y no como import de CSS: así solo se descarga con el mapa y no va en el CSS principal de la app.
import leafletCssUrl from 'leaflet/dist/leaflet.css?url';

export type RouteStationMarker = { id_ss: number; rotulo: string; latitud: number; longitud: number; kmRuta: number; price: number; masBarataDelTramo: boolean };

interface RouteMapProps {
  geometry: [number, number][];
  stations: RouteStationMarker[];
}

// Leaflet usa [lat, lon]; la API devuelve [lon, lat] (GeoJSON).
const toLatLng = ([lon, lat]: [number, number]): [number, number] => [lat, lon];

const RouteMap: React.FC<RouteMapProps> = ({ geometry, stations }) => {
  const path = geometry.map(toLatLng);
  return (
    <div className='h-80 desk:h-96 w-full rounded-3xl overflow-hidden border border-gray-100 astro-dark:border-white/5 mb-6'>
      {/* React 19 sube la hoja de estilos al <head> y espera a que cargue antes de pintar el mapa. */}
      <link rel='stylesheet' href={leafletCssUrl} precedence='default' />
      <MapContainer bounds={path} boundsOptions={{ padding: [24, 24] }} scrollWheelZoom={false} className='h-full w-full'>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        {/* Colores en global.css (.route-line, .route-station, .route-station-cheapest). */}
        <Polyline positions={path} pathOptions={{ className: 'route-line', weight: 5 }} />
        {stations.map((station) => (
          <CircleMarker
            key={station.id_ss}
            center={[station.latitud, station.longitud]}
            radius={station.masBarataDelTramo ? 9 : 6}
            pathOptions={{ className: station.masBarataDelTramo ? 'route-station-cheapest' : 'route-station', fillOpacity: 0.85 }}
          >
            <Popup>
              <strong>{station.rotulo}</strong><br />
              km {Math.round(station.kmRuta)} · {station.price.toFixed(3)} €/l
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
