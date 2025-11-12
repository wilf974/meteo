import { useEffect, useState, memo } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

const LoadingOverlay = memo(function LoadingOverlay({ isLoading, message = 'Chargement...' }: LoadingOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Delay showing loader to avoid flash for fast requests
      const timer = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease-in',
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '32px 48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          minWidth: '280px',
        }}
      >
        {/* Spinning loader */}
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />

        {/* Message */}
        <div
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {message}
        </div>

        {/* Weather emoji animation */}
        <div
          style={{
            fontSize: '32px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          🌤️
        </div>
      </div>
    </div>
  );
});

export default LoadingOverlay;
