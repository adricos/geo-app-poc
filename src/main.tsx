import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './styles.css';
import { App } from '@/app/app';
import { AppErrorBoundary } from '@/app/error-boundary';
import { AppProviders } from '@/app/providers/app-providers';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>,
);
