import { Outlet } from 'react-router-dom';
import Sidebar from './layout/Sidebar';

export default function Layout() {
  return (
    <div className="h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
