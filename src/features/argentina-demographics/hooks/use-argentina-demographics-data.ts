import { useQuery } from '@tanstack/react-query';
import type { Feature, FeatureCollection } from 'geojson';
import staticLocalidades from '../data/argentina-localidades.geojson.json';

export interface ArgentinaDemographicsData {
  geojson: FeatureCollection | null;
  populationExtent: [number, number];
  loading: boolean;
  error: Error | null;
}

type CityProperties = {
  id: string;
  nombre: string;
  provincia?: string;
  poblacion: number;
  rank?: number;
};

function enrichWithRank(fc: FeatureCollection): FeatureCollection {
  const features = fc.features as Array<Feature & { properties: CityProperties }>;
  const sorted = [...features].sort(
    (a, b) => (a.properties?.poblacion ?? 0) - (b.properties?.poblacion ?? 0),
  );
  const withRank = sorted.map((f, i) => ({
    ...f,
    properties: { ...f.properties, rank: i + 1 },
  }));
  return {
    type: 'FeatureCollection',
    features: withRank,
  };
}

function getExtent(fc: FeatureCollection): [number, number] {
  const features = fc.features as Array<Feature & { properties: { poblacion?: number } }>;
  const pops = features
    .map((f) => f.properties?.poblacion)
    .filter((p): p is number => typeof p === 'number');
  if (pops.length === 0) return [0, 1];
  return [Math.min(...pops), Math.max(...pops)];
}

/** City-level (localidades) static GeoJSON with population and rank. */
export function useArgentinaDemographicsData(): ArgentinaDemographicsData {
  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['argentina-localidades-geojson'],
    queryFn: async (): Promise<FeatureCollection> => {
      const fc = staticLocalidades as FeatureCollection;
      return enrichWithRank(fc);
    },
    staleTime: Infinity,
  });

  const geojson = raw ?? null;
  const populationExtent = geojson ? getExtent(geojson) : ([0, 1] as [number, number]);

  return {
    geojson,
    populationExtent,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
  };
}
