import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../lib/api';
import { User, Settings, Moon, Sun } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => userApi.getPreferences(),
  });

  const preferences = data?.data?.data?.preferences || {};

  return (
    <div className="h-full overflow-auto bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">Profil</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Informations personnelles
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom</label>
                <p className="text-white font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <p className="text-white font-medium">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rôle</label>
                <p className="text-white font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">Préférences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Thème</p>
                  <p className="text-sm text-gray-400">
                    {preferences.theme === 'dark' ? 'Sombre' : 'Clair'}
                  </p>
                </div>
                {preferences.theme === 'dark' ? (
                  <Moon className="w-6 h-6 text-blue-500" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-sm text-gray-400">
                    {preferences.notifications ? 'Activées' : 'Désactivées'}
                  </p>
                </div>
                <div className={`w-12 h-6 rounded-full ${
                  preferences.notifications ? 'bg-blue-600' : 'bg-gray-600'
                }`}></div>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Couches par défaut</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.defaultLayers?.map((layer: string) => (
                    <span
                      key={layer}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                    >
                      {layer}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
