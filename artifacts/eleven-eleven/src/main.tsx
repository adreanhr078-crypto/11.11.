import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './app/ErrorBoundary';
import { bootstrapApplication } from './app/bootstrap';
import {
  EmotionVisualProvider,
} from './features/emotion/useEmotionVisualSystem';

bootstrapApplication();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <EmotionVisualProvider>
        <App />
      </EmotionVisualProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
