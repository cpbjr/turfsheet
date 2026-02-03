import { useState } from 'react';

export default function Sidebar() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
    { id: 'calendar', icon: 'fa-calendar', label: 'Calendar' },
    { id: 'staff', icon: 'fa-users', label: 'Staff' },
    { id: 'jobs', icon: 'fa-briefcase', label: 'Jobs' },
    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { id: 'settings', icon: 'fa-gear', label: 'Settings' },
  ];

  return (
    <aside className="w-sidebar bg-turf-green flex flex-col items-center py-5 z-100">
      {/* Logo */}
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-turf-green font-bold mb-8 text-sm">
        T
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeNav === item.id
                ? 'bg-white text-turf-green'
                : 'bg-transparent text-white hover:bg-white/20'
            }`}
            title={item.label}
          >
            <i className={`fa-solid ${item.icon}`}></i>
          </button>
        ))}
      </nav>
    </aside>
  );
}
