import { Link, useLocation } from 'react-router-dom';
import {
  House, Calendar, Users, Briefcase, FolderKanban, AlertTriangle,
  MapPin, FlaskConical, Droplets, FileText,
  GraduationCap, Settings, LogOut, Tractor
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const topNav = [
    { id: 'dashboard', icon: House, label: 'Dashboard', path: '/' },
    { id: 'calendar', icon: Calendar, label: 'Calendar', path: '/calendar' },
    { id: 'staff', icon: Users, label: 'Staff', path: '/staff' },
    { id: 'jobs', icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { id: 'equipment', icon: Tractor, label: 'Equipment', path: '/equipment' },
    { id: 'pesticide', icon: FlaskConical, label: 'Chemicals', path: '/pesticide' },
    { id: 'irrigation', icon: Droplets, label: 'Irrigation', path: '/irrigation' },
    { id: 'maintenance', icon: AlertTriangle, label: 'Maintenance', path: '/maintenance' },
    { id: 'projects', icon: FolderKanban, label: 'Projects', path: '/projects' },
  ];

  const bottomNav = [
    { id: 'maps', icon: MapPin, label: 'Maps', path: '/maps' },
    { id: 'docs', icon: FileText, label: 'Documents', path: '/docs' },
    { id: 'training', icon: GraduationCap, label: 'Learning', path: '/training' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
    { id: 'logout', icon: LogOut, label: 'Logout', path: '/logout' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[90]" 
          onClick={onClose}
        />
      )}
      <aside className={`w-[64px] md:w-[48px] bg-turf-green flex flex-col items-center py-4 h-full z-[100] shrink-0 shadow-lg fixed md:static top-0 left-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <nav className="flex flex-col justify-between h-full w-full">
          {/* Top Section */}
          <div className="flex flex-col items-center gap-3 md:gap-4">
            {topNav.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={`w-12 h-12 md:w-10 md:h-10 flex items-center justify-center transition-all duration-200 rounded-md md:rounded-none ${isActive(item.path)
                  ? 'text-white bg-white/20'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                title={item.label}
              >
                <item.icon className="w-6 h-6 md:w-5 md:h-5 stroke-[1.5]" />
              </Link>
            ))}
          </div>

        {/* Separator */}
        <div className="w-6 border-t border-white/30 mx-auto" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-3 md:gap-4 mb-2">
          {bottomNav.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={onClose}
              className={`w-12 h-12 md:w-10 md:h-10 flex items-center justify-center transition-all duration-200 rounded-md md:rounded-none ${isActive(item.path)
                ? 'text-white bg-white/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              title={item.label}
            >
              <item.icon className="w-6 h-6 md:w-5 md:h-5 stroke-[1.5]" />
            </Link>
          ))}
        </div>
      </nav>
    </aside>
    </>
  );
}

