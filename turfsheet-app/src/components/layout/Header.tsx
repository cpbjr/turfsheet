import { DateSelector } from '../DateSelector';

export default function Header() {
  return (
    <header className="h-[60px] bg-white border-b border-border-color flex items-center justify-between px-6 shrink-0">
      {/* Left: Title */}
      <h1 className="text-lg font-heading font-bold text-text-primary tracking-tight">
        TURFSHEET DASHBOARD
      </h1>

      {/* Right: Date selector and user controls */}
      <div className="flex items-center gap-5">
        {/* Date Selector Component */}
        <DateSelector />

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
