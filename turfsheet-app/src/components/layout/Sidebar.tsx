import { useState } from 'react';
import {
  Flag, House, Calendar, Users, Briefcase,
  BarChart3, MapPin, MessageSquare, FileText,
  CreditCard, History, GraduationCap, Settings,
  Package, LogOut
} from 'lucide-react';

export default function Sidebar() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const topNav = [
    { id: 'home', icon: Flag, label: 'Home' },
    { id: 'dashboard', icon: House, label: 'Dashboard' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'staff', icon: Users, label: 'Staff' },
    { id: 'jobs', icon: Briefcase, label: 'Jobs' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'maps', icon: MapPin, label: 'Maps' },
    { id: 'messages', icon: MessageSquare, label: 'Messaging' },
  ];

  const bottomNav = [
    { id: 'history', icon: History, label: 'History' },
    { id: 'docs', icon: FileText, label: 'Documents' },
    { id: 'training', icon: GraduationCap, label: 'Training' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'logout', icon: LogOut, label: 'Logout' },
  ];

  return (
    <aside className="w-[48px] bg-turf-green flex flex-col items-center py-4 h-screen z-100 shrink-0 shadow-lg">
      <nav className="flex flex-col justify-between h-full w-full">
        {/* Top Section */}
        <div className="flex flex-col items-center gap-4">
          {topNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 ${activeNav === item.id
                  ? 'text-white bg-white/20'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
            </button>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-4 mb-2">
          {bottomNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 ${activeNav === item.id
                  ? 'text-white bg-white/20'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}
