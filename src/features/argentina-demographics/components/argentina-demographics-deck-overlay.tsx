import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { DeckGL } from '@deck.gl/react';
import type { DeckGLRef } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { useMapOverlay } from '@/viewer/core/context/use-map-overlay';
import { useArgentinaDemographicsData } from '../hooks/use-argentina-demographics-data';
import { rankToRgba } from '../utils/rank-color';
import './argentina-demographics-tooltip.css';

const ARGENTINA_BOUNDS: [number, number, number, number] = [-73.5, -55, -53.5, -21];
const TOOLTIP_OFFSET = 12;
const TOOLTIP_HIDE_DELAY_MS = 80;

function formatTooltipFromObject(object: unknown): string | null {
  if (!object || typeof (object as { properties?: unknown }).properties !== 'object') return null;
  const f = object as { properties?: { nombre?: string; provincia?: string; poblacion?: number } };
  const nombre = f.properties?.nombre ?? 'Unknown';
  const prov = f.properties?.provincia;
  const pop = f.properties?.poblacion ?? 0;
  const label = prov ? `${nombre}, ${prov}` : nombre;
  return `${label}: ${pop.toLocaleString('es-AR')} hab.`;
}

/**
 * deck.gl overlay: Argentina cities (localidades) by population.
 * Must be rendered as a child of MapLibreViewer or MapboxViewer (uses MapOverlayContext).
 * Tooltips are driven by map mouse move + deck.pickObject so the map remains pannable.
 */
export function ArgentinaDemographicsDeckOverlay() {
  const overlay = useMapOverlay();
  const { geojson, populationExtent, loading, error } = useArgentinaDemographicsData();
  const n = geojson?.features?.length ?? 0;
  const deckRef = useRef<DeckGLRef>(null);
  const clearTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const didFitBounds = useRef(false);
  useEffect(() => {
    if (didFitBounds.current || !overlay?.requestFitBounds) return;
    didFitBounds.current = true;
    const t = setTimeout(() => {
      overlay.requestFitBounds(ARGENTINA_BOUNDS, { padding: 48, maxZoom: 4 });
    }, 150);
    return () => clearTimeout(t);
  }, [overlay?.requestFitBounds]);

  const handleMapPointerMove = useCallback(
    (x: number, y: number) => {
      if (clearTooltipTimeoutRef.current) {
        clearTimeout(clearTooltipTimeoutRef.current);
        clearTooltipTimeoutRef.current = null;
      }
      const info = deckRef.current?.pickObject({ x, y }) ?? null;
      const text = info?.object != null ? formatTooltipFromObject(info.object) : null;
      if (text) {
        setTooltip({ text, x: x + TOOLTIP_OFFSET, y: y + TOOLTIP_OFFSET });
      } else {
        clearTooltipTimeoutRef.current = setTimeout(() => {
          clearTooltipTimeoutRef.current = null;
          setTooltip(null);
        }, TOOLTIP_HIDE_DELAY_MS);
      }
    },
    [],
  );

  useEffect(() => {
    overlay?.setMapPointerMoveHandler(handleMapPointerMove);
    return () => {
      if (clearTooltipTimeoutRef.current) {
        clearTimeout(clearTooltipTimeoutRef.current);
        clearTooltipTimeoutRef.current = null;
      }
      overlay?.setMapPointerMoveHandler(null);
    };
  }, [overlay, handleMapPointerMove]);

  const layers = useMemo(() => {
    if (!geojson?.features?.length || n < 2) return [];
    const [minPop, maxPop] = populationExtent;
    return [
      new GeoJsonLayer({
        id: 'argentina-demographics',
        data: geojson,
        stroked: true,
        filled: true,
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        getLineColor: [255, 255, 255, 255],
        getFillColor: (d: { properties?: { rank?: number } }) => {
          const rank = d.properties?.rank ?? 1;
          const t = (rank - 1) / (n - 1);
          return rankToRgba(t);
        },
        getPointRadius: (d: { properties?: { poblacion?: number } }) => {
          const pop = d.properties?.poblacion ?? 0;
          if (pop <= 0) return 0;
          const t = maxPop > minPop ? (pop - minPop) / (maxPop - minPop) : 0;
          return 8 + t * 40;
        },
        pointRadiusUnits: 'pixels',
        pointRadiusMinPixels: 10,
        pointRadiusMaxPixels: 52,
        pointType: 'circle',
        pickable: true,
        updateTriggers: { getFillColor: geojson, getPointRadius: geojson },
      }),
    ];
  }, [geojson, populationExtent, n]);

  const deckViewState = useMemo(() => {
    const vs = overlay?.viewState;
    if (!vs) return undefined;
    return {
      longitude: vs.longitude,
      latitude: vs.latitude,
      zoom: vs.zoom,
      bearing: vs.bearing ?? 0,
      pitch: vs.pitch ?? 0,
    };
  }, [overlay?.viewState]);

  if (!overlay || loading || error || !deckViewState) {
    return null;
  }

  return (
    <>
      <DeckGL
        ref={deckRef}
        viewState={deckViewState}
        width={overlay.width}
        height={overlay.height}
        controller={false}
        layers={layers}
      />
      {tooltip && (
        <div
          className="argentina-demographics-tooltip"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}
