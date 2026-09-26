import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StytchB2BUIClient } from '@stytch/vanilla-js/b2b';
import { StytchB2BProvider } from '@stytch/react/b2b';

import App from './App';
import './styles.css';

const publicToken = import.meta.env.VITE_STYTCH_PUBLIC_TOKEN?.trim();
const customBaseUrl = import.meta.env.VITE_STYTCH_CUSTOM_BASE_URL?.trim();

if (!publicToken) {
  throw new Error('VITE_STYTCH_PUBLIC_TOKEN is required');
}

if (!customBaseUrl || !/^https:\/\/[a-z0-9.-]+$/i.test(customBaseUrl)) {
  throw new Error('VITE_STYTCH_CUSTOM_BASE_URL must be an HTTPS origin');
}

const stytch = new StytchB2BUIClient(publicToken, { customBaseUrl });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StytchB2BProvider stytch={stytch}>
      <App />
    </StytchB2BProvider>
  </StrictMode>,
);
