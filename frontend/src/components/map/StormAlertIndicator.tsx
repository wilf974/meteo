import { memo } from 'react';
import { AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { type StormAlert } from '../../services/stormAlert.service';

interface StormAlertIndicatorProps {
  alert: StormAlert | null;
  isDark: boolean;
}

export const StormAlertIndicator = memo(function StormAlertIndicator({
  alert,
  isDark,
}: StormAlertIndicatorProps) {
  if (!alert) return null;

  const severityConfig = {
    critical: {
      bgColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      borderColor: '#ef4444',
      textColor: '#ef4444',
      bgLight: 'rgba(239, 68, 68, 0.25)',
      icon: AlertTriangle,
      pulse: true,
    },
    high: {
      bgColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
      borderColor: '#f97316',
      textColor: '#f97316',
      bgLight: 'rgba(249, 115, 22, 0.25)',
      icon: AlertTriangle,
      pulse: true,
    },
    moderate: {
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      borderColor: '#f59e0b',
      textColor: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.25)',
      icon: AlertCircle,
      pulse: false,
    },
    low: {
      bgColor: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
      borderColor: '#667eea',
      textColor: '#667eea',
      bgLight: 'rgba(102, 126, 234, 0.25)',
      icon: Zap,
      pulse: false,
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1100,
        backgroundColor: config.bgColor,
        borderRadius: '12px',
        border: `2px solid ${config.borderColor}`,
        padding: '16px 20px',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        animation: config.pulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
      }}
    >
      {/* Alert Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Icon style={{ width: '20px', height: '20px', color: config.textColor }} />
        <span
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: config.textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Alerte Orage {alert.severity.toUpperCase()}
        </span>
      </div>

      {/* Message */}
      <div
        style={{
          fontSize: '13px',
          color: isDark ? '#e0e7ff' : '#1e293b',
          fontWeight: '500',
          marginBottom: '12px',
          lineHeight: '1.4',
        }}
      >
        {alert.message}
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        {/* Lightning Info */}
        {alert.strikeCount > 0 && (
          <div
            style={{
              padding: '8px',
              backgroundColor: config.bgLight,
              borderRadius: '8px',
              borderLeft: `3px solid ${config.borderColor}`,
            }}
          >
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Éclairs</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: config.textColor }}>
              {alert.strikeCount}
            </div>
            {alert.nearestStrikeDistance < 999 && (
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                {alert.nearestStrikeDistance.toFixed(0)}km
              </div>
            )}
          </div>
        )}

        {/* Rain Info */}
        {alert.rainIntensity !== 'none' && (
          <div
            style={{
              padding: '8px',
              backgroundColor: config.bgLight,
              borderRadius: '8px',
              borderLeft: `3px solid ${config.borderColor}`,
            }}
          >
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Pluie</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: config.textColor }}>
              {alert.precipitation.toFixed(1)}mm
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>{alert.rainChance}% chance</div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: config.borderColor,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Voir détails sur la carte
      </button>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
});

export default StormAlertIndicator;
