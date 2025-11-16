import { memo } from 'react';
import { type MarineData } from '../../services/marineForecast.service';
import {
  getWaveEmoji,
  getWaveCategory,
  formatDirection,
  getCardinalDirection,
} from '../../services/marineForecast.service';

interface MarineInfoPanelProps {
  marine: MarineData | null;
  isDark: boolean;
}

export const MarineInfoPanel = memo(function MarineInfoPanel({
  marine,
  isDark,
}: MarineInfoPanelProps) {
  if (!marine) return null;

  const waveColor = marine.waveHeight > 3 ? '#f97316' : '#10b981';
  const backgroundColor = isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = isDark ? '#e0e7ff' : '#1e293b';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      style={{
        backgroundColor,
        borderRadius: '12px',
        padding: '16px',
        marginTop: '12px',
        borderLeft: `4px solid ${waveColor}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '20px' }}>{getWaveEmoji(marine.waveHeight)}</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Conditions Marines
          </span>
        </div>
        <div style={{ fontSize: '12px', color: labelColor }}>
          {new Date(marine.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Main Wave Info Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {/* Wave Height */}
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
            borderRadius: '8px',
            borderLeft: `3px solid ${waveColor}`,
          }}
        >
          <div style={{ fontSize: '11px', color: labelColor, marginBottom: '4px' }}>
            Hauteur Vague
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: waveColor, marginBottom: '2px' }}>
            {marine.waveHeight.toFixed(2)}m
          </div>
          <div style={{ fontSize: '10px', color: labelColor }}>
            {getWaveCategory(marine.waveHeight)}
          </div>
        </div>

        {/* Water Temperature */}
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
            borderRadius: '8px',
            borderLeft: `3px solid #3b82f6`,
          }}
        >
          <div style={{ fontSize: '11px', color: labelColor, marginBottom: '4px' }}>
            Température Eau
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '2px' }}>
            {marine.waterTemperature.toFixed(1)}°C
          </div>
          <div style={{ fontSize: '10px', color: labelColor }}>
            {marine.waterTemperature > 20 ? '🌊 Chaude' : marine.waterTemperature > 15 ? '🌡️ Tempérée' : '❄️ Froide'}
          </div>
        </div>
      </div>

      {/* Wave Characteristics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {/* Wave Period */}
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
            borderRadius: '8px',
            borderLeft: `3px solid #8b5cf6`,
          }}
        >
          <div style={{ fontSize: '11px', color: labelColor, marginBottom: '4px' }}>
            Période Vague
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {marine.wavePeriod.toFixed(1)}s
          </div>
        </div>

        {/* Wave Direction */}
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
            borderRadius: '8px',
            borderLeft: `3px solid #ec4899`,
          }}
        >
          <div style={{ fontSize: '11px', color: labelColor, marginBottom: '4px' }}>
            Direction Vague
          </div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ec4899' }}>
            {formatDirection(marine.waveDirection)}
          </div>
        </div>
      </div>

      {/* Wind Wave vs Swell */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {/* Wind Wave */}
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
            borderRadius: '8px',
            borderTop: `2px solid #f59e0b`,
          }}
        >
          <div style={{ fontSize: '10px', color: labelColor, marginBottom: '2px', fontWeight: '600' }}>
            Vague Vent
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>
            {marine.windWaveHeight.toFixed(2)}m
          </div>
          <div style={{ fontSize: '9px', color: labelColor }}>
            {marine.wavePeriod.toFixed(1)}s
          </div>
        </div>

        {/* Swell */}
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
            borderRadius: '8px',
            borderTop: `2px solid #06b6d4`,
          }}
        >
          <div style={{ fontSize: '10px', color: labelColor, marginBottom: '2px', fontWeight: '600' }}>
            Houle
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#06b6d4', marginBottom: '2px' }}>
            {marine.swellWaveHeight.toFixed(2)}m
          </div>
          <div style={{ fontSize: '9px', color: labelColor }}>
            {marine.swellWavePeriod.toFixed(1)}s · {getCardinalDirection(marine.swellWaveDirection)}
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div
        style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(241, 245, 249, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: labelColor,
          lineHeight: '1.4',
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '4px', color: textColor }}>
          💡 Interprétation:
        </div>
        {getMarineInterpretation(marine.waveHeight, marine.waterTemperature)}
      </div>
    </div>
  );
});

/**
 * Generate interpretation text based on marine conditions
 */
function getMarineInterpretation(waveHeight: number, waterTemp: number): string {
  let interpretation = '';

  if (waveHeight < 0.5) {
    interpretation = 'Conditions parfaites pour les activités marines. Mer très calme.';
  } else if (waveHeight < 1) {
    interpretation = 'Bonnes conditions. Vagues légères, peu de danger.';
  } else if (waveHeight < 2) {
    interpretation = 'Conditions modérées. Vagues peu agitées, vigilance recommandée.';
  } else if (waveHeight < 3) {
    interpretation = 'Conditions agitées. Vagues significatives, attention requise pour les activités.';
  } else if (waveHeight < 4) {
    interpretation = 'Conditions très agitées. Vagues fortes, déconseillé pour les petits bateaux.';
  } else if (waveHeight < 6) {
    interpretation = 'Houleuse. Vagues hautes et dangereuses. Activités marines dangereuses.';
  } else {
    interpretation = '⚠️ Très houleuse. Conditions extrêmes. Restez en sécurité à terre.';
  }

  // Add water temperature context
  if (waterTemp < 5) {
    interpretation += ' Eau très froide - risque hypothermie.';
  } else if (waterTemp < 15) {
    interpretation += ' Eau froide - combinaison recommandée.';
  } else if (waterTemp > 25) {
    interpretation += ' Eau chaude et agréable.';
  }

  return interpretation;
}

export default MarineInfoPanel;
