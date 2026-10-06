import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Fonts ship with the site (no Google Fonts request), so the survey makes
// no calls to outside services and loads faster on weak signal.
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
