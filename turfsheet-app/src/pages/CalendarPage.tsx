export default function CalendarPage() {
  return (
    <div className="p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary uppercase tracking-tight">
          Calendar
        </h1>
        <p className="text-sm text-text-secondary mt-2 font-sans">
          Comprehensive calendar view for staff schedules and tasks
        </p>
      </div>
      <div className="bg-white border border-border-color p-16 text-center shadow-sm">
        <div className="w-20 h-20 bg-turf-green/5 flex items-center justify-center mb-6 border border-turf-green/10 mx-auto">
          <i className="fa-solid fa-calendar-days text-4xl text-turf-green/30"></i>
        </div>
        <p className="text-text-secondary text-sm font-sans mb-2">
          Full calendar view coming soon
        </p>
      </div>
    </div>
  );
}
