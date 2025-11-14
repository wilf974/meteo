import { useAuthStore } from '../store/authStore';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <h2 className="text-sm md:text-lg font-semibold text-white truncate">
            Bienvenue, {user?.name}
          </h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-gray-300">
            <User className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 min-h-[44px] md:min-h-0 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm md:text-base">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
