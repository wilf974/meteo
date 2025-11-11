import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Map,
  Bell,
  CloudRain,
  TrendingUp,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  { path: '/map', icon: Map, label: 'Carte Interactive' },
  { path: '/dashboard', icon: TrendingUp, label: 'Tableau de bord' },
  { path: '/alerts', icon: Bell, label: 'Alertes' },
  { path: '/profile', icon: Users, label: 'Profil' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-[2000] lg:hidden bg-gray-800 hover:bg-gray-700 rounded-lg p-2 shadow-xl border border-gray-700 transition-all"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[1500] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-[1600]
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <CloudRain className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-white text-lg">MeteoPro</span>
            </div>
          )}

          {/* Bouton collapse (desktop uniquement) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                      ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 text-center">
              <p>Version 1.0.0</p>
              <p className="mt-1">© 2025 MeteoPro</p>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer pour pousser le contenu */}
      <div
        className={`
          hidden lg:block transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      />
    </>
  );
}
