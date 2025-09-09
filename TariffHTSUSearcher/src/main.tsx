import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SearchProvider } from './context/SearchContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/tailwind.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SearchProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SearchProvider>
    </React.StrictMode>
  );
}
