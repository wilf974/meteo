import { useState, useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { format, addHours, subHours } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Timeline() {
  const { timelinePosition, setTimelinePosition, isPlaying, setIsPlaying } = useMapStore();

  // Animation automatique quand isPlaying est true
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimelinePosition(addHours(timelinePosition, 1));
    }, 1000); // Avance d'1 heure toutes les secondes

    return () => clearInterval(interval);
  }, [isPlaying, timelinePosition, setTimelinePosition]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    setTimelinePosition(subHours(timelinePosition, 3));
  };

  const handleNext = () => {
    setTimelinePosition(addHours(timelinePosition, 3));
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-gray-800 rounded-lg shadow-xl border border-gray-700 px-6 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <SkipBack className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>

        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <SkipForward className="w-5 h-5 text-white" />
        </button>

        <div className="ml-4 text-white font-medium">
          {format(timelinePosition, 'dd MMM yyyy - HH:mm', { locale: fr })}
        </div>
      </div>
    </div>
  );
}
