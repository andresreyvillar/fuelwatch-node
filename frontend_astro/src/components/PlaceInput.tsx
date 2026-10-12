import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export type Place = { name: string; lon: number; lat: number };

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; city?: string; state?: string; countrycode?: string };
};

// Photon (OpenStreetMap), limitado a la caja de España; sin clave.
const PHOTON_URL = 'https://photon.komoot.io/api/';
const SPAIN_BBOX = '-18.3,27.6,4.4,43.9';
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

const describe = ({ properties }: PhotonFeature): string =>
  [properties.name, properties.city, properties.state].filter((part, index, parts) => part && parts.indexOf(part) === index).join(', ');

async function searchPlaces(query: string): Promise<Place[]> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=5&bbox=${SPAIN_BBOX}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const { features } = (await response.json()) as { features: PhotonFeature[] };
  return features
    .filter((feature) => feature.properties.countrycode === 'ES')
    .map((feature) => ({ name: describe(feature), lon: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }));
}

interface PlaceInputProps {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
}

const PlaceInput: React.FC<PlaceInputProps> = ({ label, value, onChange }) => {
  const [text, setText] = useState(value?.name ?? '');
  const [options, setOptions] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value && text === value.name) return;
    if (text.trim().length < MIN_QUERY_LENGTH) { setOptions([]); return; }
    // Si el texto cambia antes de que llegue la respuesta, esa respuesta ya no vale (puede llegar tarde y pisar otra).
    let isCurrent = true;
    const timer = setTimeout(() => {
      searchPlaces(text).then((places) => isCurrent && setOptions(places)).catch(() => isCurrent && setOptions([]));
    }, DEBOUNCE_MS);
    return () => { isCurrent = false; clearTimeout(timer); };
  }, [text, value]);

  const choose = (place: Place) => {
    onChange(place);
    setText(place.name);
    setOptions([]);
    setIsOpen(false);
  };

  return (
    <div className='relative'>
      <label className='block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 text-gray-400'>
        {label}
        <div className='relative mt-2'>
          <MapPin aria-hidden='true' className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
          <input
            type='text'
            name={label}
            value={text}
            onChange={(e) => { setText(e.target.value); onChange(null); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder='Ciudad o dirección...'
            className='w-full border rounded-2xl py-3.5 pl-11 pr-4 normal-case tracking-normal text-sm font-normal focus:ring-2 focus:ring-primary outline-none bg-white astro-dark:bg-white/5 border-gray-100 astro-dark:border-white/10 text-secondary astro-dark:text-white'
          />
        </div>
      </label>
      {isOpen && options.length > 0 && (
        <div className='absolute z-[70] w-full mt-1 border shadow-2xl rounded-2xl overflow-hidden bg-white astro-dark:bg-[#1a1a1a] border-gray-100 astro-dark:border-white/10'>
          {options.map((place, index) => (
            <button type='button' key={`${index}-${place.name}`} onClick={() => choose(place)} className='block w-full px-4 py-3 text-left text-sm hover:bg-primary/10 text-secondary astro-dark:text-white border-b border-gray-50 astro-dark:border-white/5'>
              {place.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceInput;
