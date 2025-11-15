import { NowcastData } from '../../services/openMeteo.service';
import { AlertCircle, Cloud, CloudRain } from 'lucide-react';

interface NowcastPanelProps {
  nowcast: NowcastData | null;
  isDark: boolean;
}

export function NowcastPanel({ nowcast, isDark }: NowcastPanelProps) {
  if (!nowcast) return null;

  // Déterminer le message et l'icône basés sur l'intensité de pluie
  const getRainMessage = () => {
    if (nowcast.rainIntensity === 'none') {
      return 'Pas de pluie prévue pour les 15 prochaines minutes';
    }
    if (nowcast.precipitation === 0) {
      return 'Pas de pluie prévue pour les 15 prochaines minutes';
    }

    const rainTime = Math.round(nowcast.precipitation / 2); // Très approximatif
    if (nowcast.rainIntensity === 'light') {
      return `Légère pluie possible dans les 15 minutes (${nowcast.precipitation.toFixed(1)}mm/10min)`;
    }
    if (nowcast.rainIntensity === 'moderate') {
      return `⚠️ Pluie modérée attendue (${nowcast.precipitation.toFixed(1)}mm/10min)`;
    }
    return `🚨 Pluie forte attendue! (${nowcast.precipitation.toFixed(1)}mm/10min)`;
  };

  const getRainColor = () => {
    if (nowcast.rainIntensity === 'none') return '#10b981'; // Green
    if (nowcast.rainIntensity === 'light') return '#f59e0b'; // Amber
    if (nowcast.rainIntensity === 'moderate') return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRainIcon = () => {
    if (nowcast.rainIntensity === 'none') return '☀️';
    if (nowcast.rainIntensity === 'light') return '🌤️';
    if (nowcast.rainIntensity === 'moderate') return '🌧️';
    return '⛈️';
  };

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: `${getRainColor()}20`,
        borderRadius: '10px',
        borderLeft: `4px solid ${getRainColor()}`,
        borderTop: `2px solid ${getRainColor()}`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{getRainIcon()}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: getRainColor(), textTransform: 'uppercase' }}>
          ⚡ Nowcast (Prochains 15 min)
        </span>
      </div>

      {/* Message */}
      <div style={{ fontSize: '13px', color: isDark ? '#e0e7ff' : '#1e293b', fontWeight: '500', marginBottom: '8px', lineHeight: '1.5' }}>
        {getRainMessage()}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Precipitation */}
        <div
          style={{
            padding: '8px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Précipitations</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
            {nowcast.precipitation.toFixed(1)}
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>mm/10min</div>
        </div>

        {/* Rain Chance */}
        <div
          style={{
            padding: '8px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Probabilité</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827' }}>
            {nowcast.rainChance}%
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>pluie</div>
        </div>
      </div>

      {/* Alert */}
      {nowcast.rainIntensity !== 'none' && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>
            Apportez un parapluie! De la pluie est prévue
          </div>
        </div>
      )}
    </div>
  );
}
