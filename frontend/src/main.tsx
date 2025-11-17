import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import App from './App';
import './index.css';
import './styles/theme.css';
import './styles/mobile.css'; // Optimisations mobiles
import { registerServiceWorker, setupNetworkDetection, skipWaiting } from './utils/pwa';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position={window.innerWidth < 768 ? "top-center" : "top-right"}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              maxWidth: window.innerWidth < 768 ? 'calc(100vw - 32px)' : '400px',
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log('Service Worker registered successfully');
    },
    onUpdate: (registration) => {
      toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>Nouvelle version disponible!</div>
          <div style={{ fontSize: '14px' }}>Cliquez pour mettre à jour</div>
          <button
            onClick={() => {
              skipWaiting();
              window.location.reload();
              toast.dismiss(t.id);
            }}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Mettre à jour maintenant
          </button>
        </div>
      ), {
        duration: Infinity,
        icon: '🔄',
      });
    },
    onOffline: () => {
      toast.error('Mode hors ligne - Données en cache utilisées', {
        icon: '📡',
        duration: 5000,
      });
    },
    onOnline: () => {
      toast.success('Connexion rétablie', {
        icon: '✅',
        duration: 3000,
      });
    },
  });

  // Setup network detection
  setupNetworkDetection({
    onOffline: () => {
      toast.error('Mode hors ligne - Données en cache utilisées', {
        icon: '📡',
        duration: 5000,
      });
    },
    onOnline: () => {
      toast.success('Connexion rétablie', {
        icon: '✅',
        duration: 3000,
      });
    },
  });
}
