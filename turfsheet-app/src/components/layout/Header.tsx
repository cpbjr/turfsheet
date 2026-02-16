import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { DateSelector } from '../DateSelector';
import { CompactWeather } from '../CompactWeather';

export default function Header() {
  const location = useLocation();
  const isDashboardRoute = location.pathname === '/' || location.pathname === '/whiteboard' || location.pathname === '/classic';

  return (
    <header className="h-[60px] bg-white border-b border-border-color flex items-center justify-between px-6 shrink-0">
      {/* Left: Title + Dashboard View Toggle */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-heading font-bold text-text-primary tracking-tight">
          TURFSHEET DASHBOARD
        </h1>

        {/* Dashboard View Toggle (only show on dashboard routes) */}
        {isDashboardRoute && (
          <div className="flex items-center gap-1 bg-dashboard-bg/50 rounded p-1">
            <Link
              to="/whiteboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans font-medium transition-colors ${
                location.pathname === '/' || location.pathname === '/whiteboard'
                  ? 'bg-white text-turf-green shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Staff Whiteboard View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Whiteboard</span>
            </Link>
            <Link
              to="/classic"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans font-medium transition-colors ${
                location.pathname === '/classic'
                  ? 'bg-white text-turf-green shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Classic Portfolio View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Classic</span>
            </Link>
          </div>
        )}
      </div>

      {/* Right: Date selector and user controls */}
      <div className="flex items-center gap-5">
        {/* Date Selector Component */}
        <DateSelector />

        {/* Compact Weather */}
        <CompactWeather />

        {/* User Profile Area */}
        <div className="flex items-center gap-4 ml-4">
          <button className="relative text-turf-green hover:text-turf-green-dark transition">
            <i className="fa-solid fa-bell text-lg"></i>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button className="text-text-secondary hover:text-gray-700 transition">
            <i className="fa-solid fa-circle-user text-2xl"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
