/**
 * Weather Export Service
 * Exports weather data in multiple formats
 */

import { type WeatherData } from './openMeteo.service';

export interface ExportData {
  location: { name: string; lat: number; lon: number };
  date: string;
  weather: WeatherData;
}

class WeatherExportService {
  /**
   * Export to JSON
   */
  exportJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to CSV
   */
  exportCSV(data: ExportData): string {
    const lines = [
      `Location: ${data.location.name} (${data.location.lat.toFixed(4)}°, ${data.location.lon.toFixed(4)}°)`,
      `Date: ${data.date}`,
      '',
      'Metric,Value,Unit',
      `Temperature,${data.weather.temperature.toFixed(1)},°C`,
      `Apparent Temperature,${data.weather.apparentTemperature.toFixed(1)},°C`,
      `Humidity,${data.weather.humidity},%`,
      `Wind Speed,${data.weather.windSpeed.toFixed(1)},km/h`,
      `Wind Direction,${data.weather.windDirection},°`,
      `Pressure,${data.weather.pressure.toFixed(1)},hPa`,
      `Precipitation,${data.weather.precipitation.toFixed(2)},mm`,
      `Cloud Cover,${data.weather.cloudCover},%`,
      `Visibility,${(data.weather.visibility / 1000).toFixed(1)},km`,
      `UV Index,${data.weather.uvIndex.toFixed(1)},`,
      `AQI,${data.weather.aqi},`,
    ];
    return lines.join('\n');
  }

  /**
   * Generate share link (simulated - in real app would save to server)
   */
  generateShareLink(data: ExportData): string {
    const encoded = encodeURIComponent(JSON.stringify(data));
    return `${window.location.origin}?shared=${encoded}`;
  }

  /**
   * Download file
   */
  downloadFile(content: string, filename: string, type: 'json' | 'csv') {
    const mimeType = type === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate QR code URL (using qr.io API)
   */
  getQRCodeURL(data: ExportData, size: number = 200): string {
    const url = this.generateShareLink(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  }

  /**
   * Copy to clipboard
   */
  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }
}

export const weatherExport = new WeatherExportService();
