'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Train, X, Search, MapPin } from 'lucide-react';

interface StationOption {
  id: number;
  code: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

interface StationAutocompleteProps {
  locale?: string;
  value?: string;
  stationId?: number | null;
  placeholder?: string;
  onSelect: (station: StationOption | null) => void;
  label?: string;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function getStationName(station: StationOption, locale: string): string {
  switch (locale) {
    case 'ru': return station.nameRu;
    case 'en': return station.nameEn;
    default: return station.nameUz;
  }
}

export function StationAutocomplete({
  locale = 'uz',
  value,
  placeholder = 'Stansiyani qidiring...',
  onSelect,
  label,
}: StationAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [options, setOptions] = useState<StationOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<StationOption | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchStations = useCallback(
    debounce(async (q: string) => {
      if (q.length < 1) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/stations?q=${encodeURIComponent(q)}&limit=15`);
        const data = await res.json();
        setOptions(data.stations || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (query && !selected) {
      fetchStations(query);
      setIsOpen(true);
    } else {
      setOptions([]);
    }
  }, [query, selected, fetchStations]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (station: StationOption) => {
    setSelected(station);
    setQuery(getStationName(station, locale));
    setIsOpen(false);
    onSelect(station);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onSelect(null);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <Train className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) setSelected(null);
          }}
          onFocus={() => {
            if (options.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        {(selected || query) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selected && (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs">
          <Train className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-medium text-blue-700">{selected.code}</span>
          <span className="text-blue-600">— {getStationName(selected, locale)}</span>
          {selected.country && (
            <span className="ml-auto text-blue-400">{selected.country}</span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Search className="h-4 w-4 animate-pulse" />
              Qidirilmoqda...
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Stansiya topilmadi
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {options.map((station) => (
                <li key={station.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(station)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Train className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {getStationName(station, locale)}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                          {station.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {station.country}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
