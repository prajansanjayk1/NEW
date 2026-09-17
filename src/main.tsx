import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { StaffAuthProvider } from './contexts/StaffAuthContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StaffAuthProvider>
      <App />
    </StaffAuthProvider>
  </StrictMode>,
);
