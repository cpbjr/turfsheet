import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, List, Menu, ClipboardList } from 'lucide-react';
import { DateSelector } from '../DateSelector';
import { CompactWeather } from '../CompactWeather';

interface HeaderProps {
  onMenuClick: () => void;
  onDailyBoardClick: () => void;
}

export default function Header({ onMenuClick, onDailyBoardClick }: HeaderProps) {
  const location = useLocation();
  const isDashboardRoute = location.pathname === '/' || location.pathname === '/whiteboard' || location.pathname === '/classic';

  return (
    <header className="h-[60px] bg-white border-b border-border-color flex items-center justify-between px-4 md:px-6 shrink-0 z-50">
      {/* Left: Title + Dashboard View Toggle */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1.5 -ml-2 text-text-secondary hover:text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-turf-green"
        >
          <Menu className="w-6 h-6 stroke-[1.5]" />
        </button>

        <h1 className="text-base md:text-lg font-heading font-bold text-text-primary tracking-tight truncate max-w-[120px] sm:max-w-none">
          TURFSHEET
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
      <div className="flex items-center gap-2 md:gap-5">
        {/* Date Selector Component */}
        <div className="hidden md:block">
          <DateSelector />
        </div>

        {/* Compact Weather */}
        <div className="hidden md:block">
          <CompactWeather />
        </div>

        {/* View Daily Board (Mobile Only) */}
        <button
          onClick={onDailyBoardClick}
          className="xl:hidden flex items-center justify-center p-1.5 text-turf-green hover:bg-turf-green/10 rounded-md transition-colors"
          title="Daily Board"
        >
          <ClipboardList className="w-6 h-6 stroke-[1.5]" />
        </button>

        {/* User Profile Area */}
        <div className="flex items-center gap-3 md:gap-4 ml-1 md:ml-4">
          <button className="relative text-turf-green hover:text-turf-green-dark transition">
            <i className="fa-solid fa-bell text-lg md:text-xl"></i>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button className="text-text-secondary hover:text-gray-700 transition">
            <i className="fa-solid fa-circle-user text-2xl md:text-[1.75rem]"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
