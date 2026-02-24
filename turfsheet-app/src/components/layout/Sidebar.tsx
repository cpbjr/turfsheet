import { Link, useLocation } from 'react-router-dom';
import {
  House, Calendar, Users, Briefcase, FolderKanban,
  BarChart3, MapPin, FlaskConical, Droplets, FileText,
  GraduationCap, Settings, Package, LogOut
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const topNav = [
    { id: 'dashboard', icon: House, label: 'Dashboard', path: '/' },
    { id: 'calendar', icon: Calendar, label: 'Calendar', path: '/calendar' },
    { id: 'staff', icon: Users, label: 'Staff', path: '/staff' },
    { id: 'equipment', icon: Package, label: 'Equipment', path: '/equipment' },
    { id: 'jobs', icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { id: 'projects', icon: FolderKanban, label: 'Projects', path: '/projects' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { id: 'maps', icon: MapPin, label: 'Maps', path: '/maps' },
    { id: 'pesticide', icon: FlaskConical, label: 'Pesticide Log', path: '/pesticide' },
    { id: 'irrigation', icon: Droplets, label: 'Irrigation', path: '/irrigation' },
  ];

  const bottomNav = [
    { id: 'docs', icon: FileText, label: 'Documents', path: '/docs' },
    { id: 'training', icon: GraduationCap, label: 'Training', path: '/training' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
    { id: 'logout', icon: LogOut, label: 'Logout', path: '/logout' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-[48px] bg-turf-green flex flex-col items-center py-4 h-screen z-100 shrink-0 shadow-lg">
      <nav className="flex flex-col justify-between h-full w-full">
        {/* Top Section */}
        <div className="flex flex-col items-center gap-4">
          {topNav.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 ${isActive(item.path)
                ? 'text-white bg-white/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
            </Link>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-4 mb-2">
          {bottomNav.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 ${isActive(item.path)
                ? 'text-white bg-white/20'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}

