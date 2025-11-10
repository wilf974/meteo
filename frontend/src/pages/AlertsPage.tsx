import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Bell, Plus, Trash2, Edit } from 'lucide-react';

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alerte supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const alerts = data?.data?.data?.alerts || [];

  return (
    <div className="h-full overflow-auto bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Alertes météo</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            <span>Nouvelle alerte</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Aucune alerte configurée</p>
            <p className="text-gray-500 mt-2">
              Créez votre première alerte pour être notifié des conditions météo importantes
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {alert.name}
                    </h3>
                    {alert.description && (
                      <p className="text-gray-400 mb-4">{alert.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${
                        alert.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {alert.notificationChannels.email && (
                        <span className="text-gray-400">📧 Email</span>
                      )}
                      {alert.notificationChannels.push && (
                        <span className="text-gray-400">🔔 Push</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Edit className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(alert.id)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
