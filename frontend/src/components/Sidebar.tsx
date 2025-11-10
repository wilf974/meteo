import { NavLink } from 'react-router-dom';
import { Map, LayoutDashboard, Bell, User, CloudRain } from 'lucide-react';

const navItems = [
  { to: '/map', icon: Map, label: 'Carte' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/alerts', icon: Bell, label: 'Alertes' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-700">
        <CloudRain className="w-8 h-8 text-blue-500" />
        <h1 className="text-xl font-bold text-white">MeteoProApp</h1>
      </div>
      <nav className="p-4 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
