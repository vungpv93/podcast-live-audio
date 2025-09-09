import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

function ensureBrowserUuid() {
  let browserUuid = Cookies.get('duuid');
  if (!browserUuid) {
    browserUuid = uuidv4();
    Cookies.set('duuid', browserUuid, { expires: 365 });
  }
  return browserUuid;
}

const duuid = ensureBrowserUuid();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App duuid={duuid} />
    <Toaster
      toastOptions={{
        style: { color: '#713200', fontSize: 12, width: 300 },
        position: 'bottom-right',
      }}
    />
  </StrictMode>,
);
