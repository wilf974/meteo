import { LayoutDashboard, TrendingUp, AlertTriangle, Cloud } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Alertes actives', value: '12', icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Zones surveillées', value: '5', icon: Cloud, color: 'text-blue-500' },
    { label: 'Prévisions', value: '24h', icon: TrendingUp, color: 'text-green-500' },
  ];

  return (
    <div className="h-full overflow-auto bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-12 h-12 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Activité récente
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-white">Nouvelle alerte créée</p>
                <p className="text-sm text-gray-400">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-white">Prévision mise à jour</p>
                <p className="text-sm text-gray-400">Il y a 5 heures</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
