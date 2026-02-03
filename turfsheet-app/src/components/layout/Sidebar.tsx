import { useState } from 'react';

export default function Sidebar() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
    { id: 'calendar', icon: 'fa-calendar', label: 'Calendar' },
    { id: 'staff', icon: 'fa-users', label: 'Staff' },
    { id: 'jobs', icon: 'fa-briefcase', label: 'Jobs' },
    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { id: 'maps', icon: 'fa-map-location-dot', label: 'Maps' },
    { id: 'messages', icon: 'fa-message', label: 'Messaging' },
    { id: 'documents', icon: 'fa-file-invoice', label: 'Documents' },
    { id: 'billing', icon: 'fa-credit-card', label: 'Billing' },
    { id: 'settings', icon: 'fa-gear', label: 'Settings' },
  ];

  return (
    <aside className="w-[80px] bg-turf-green flex flex-col items-center py-12 h-screen z-100 shrink-0">
      {/* Logo Container - Sharp */}
      <div className="mb-20">
        <div className="w-14 h-14 bg-white flex items-center justify-center overflow-hidden shadow-sm hover:scale-110 transition-transform duration-500 cursor-pointer">
          <img src="/logo.png" alt="T" className="w-full h-full object-cover scale-110" />
        </div>
      </div>

      {/* Navigation - Spaced Out Vertically */}
      <nav className="flex flex-col justify-between flex-1 pb-16 w-full items-center">
        <div className="flex flex-col gap-10">
          {navItems.slice(0, 9).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-14 h-14 flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:brightness-110 ${activeNav === item.id
                  ? 'bg-white text-turf-green shadow-md translate-x-1'
                  : 'bg-transparent text-white hover:bg-white/10'
                }`}
              title={item.label}
            >
              <i className={`fa-solid ${item.icon} text-[1.3rem]`}></i>
            </button>
          ))}
        </div>
        {/* Settings at the very bottom */}
        <button
          onClick={() => setActiveNav('settings')}
          className={`w-14 h-14 flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:brightness-110 ${activeNav === 'settings'
              ? 'bg-white text-turf-green shadow-md translate-x-1'
              : 'bg-transparent text-white hover:bg-white/10'
            }`}
          title="Settings"
        >
          <i className="fa-solid fa-gear text-[1.3rem]"></i>
        </button>
      </nav>
    </aside>
  );
}
