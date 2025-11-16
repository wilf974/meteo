import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ComparisonLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string;
  addedAt: number;
}

interface ComparisonState {
  // Comparison management
  comparisonLocations: ComparisonLocation[];
  isComparisonMode: boolean;
  selectedForComparison: Set<string>;

  // Actions
  addComparisonLocation: (location: ComparisonLocation) => void;
  removeComparisonLocation: (id: string) => void;
  clearComparison: () => void;
  toggleLocationSelection: (id: string) => void;
  setComparisonMode: (enabled: boolean) => void;

  // Getters
  getComparisonLocation: (id: string) => ComparisonLocation | undefined;
  canAddMore: () => boolean;
}

const MAX_COMPARISON_LOCATIONS = 6;

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      comparisonLocations: [],
      isComparisonMode: false,
      selectedForComparison: new Set(),

      addComparisonLocation: (location: ComparisonLocation) => {
        set((state) => {
          if (state.comparisonLocations.length >= MAX_COMPARISON_LOCATIONS) {
            console.warn(`Cannot add more than ${MAX_COMPARISON_LOCATIONS} locations`);
            return state;
          }

          // Check if location already exists
          if (state.comparisonLocations.some((l) => l.id === location.id)) {
            console.warn('Location already in comparison');
            return state;
          }

          return {
            comparisonLocations: [...state.comparisonLocations, location],
          };
        });
      },

      removeComparisonLocation: (id: string) => {
        set((state) => ({
          comparisonLocations: state.comparisonLocations.filter((l) => l.id !== id),
          selectedForComparison: new Set(
            Array.from(state.selectedForComparison).filter((sel) => sel !== id)
          ),
        }));
      },

      clearComparison: () => {
        set({
          comparisonLocations: [],
          selectedForComparison: new Set(),
          isComparisonMode: false,
        });
      },

      toggleLocationSelection: (id: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedForComparison);
          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }
          return { selectedForComparison: newSelected };
        });
      },

      setComparisonMode: (enabled: boolean) => {
        set({ isComparisonMode: enabled });
      },

      getComparisonLocation: (id: string) => {
        return get().comparisonLocations.find((l) => l.id === id);
      },

      canAddMore: () => {
        return get().comparisonLocations.length < MAX_COMPARISON_LOCATIONS;
      },
    }),
    {
      name: 'comparison-store',
      version: 1,
    }
  )
);
