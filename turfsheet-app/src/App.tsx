import { Sidebar, Header, RightPanel } from './components/layout';
import { Plus, Coffee, Moon } from 'lucide-react';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dashboard-bg text-text-primary">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Dashboard Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Task Board - Center */}
          <section className="flex-1 p-12 overflow-y-auto">
            <div className="flex flex-col space-y-24">
              {/* First Jobs Section - EMPTY STATE */}
              <div className="bg-panel-white border border-border-color shadow-[4px_4px_0px_#73A65710]">
                <h3 className="text-[0.75rem] font-heading font-black text-text-secondary uppercase px-10 py-6 border-b border-border-color tracking-[0.3em]">
                  First Jobs Portfolio
                </h3>
                <div className="p-24 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-turf-green/5 flex items-center justify-center mb-10 border border-turf-green/10">
                    <Coffee className="w-10 h-10 text-turf-green/30 stroke-[1.2]" />
                  </div>
                  <p className="text-text-secondary mb-12 font-sans font-bold text-2xl tracking-tight max-w-sm">Morning routines are complete. No active jobs yet.</p>
                  <button className="bg-turf-green text-white px-14 py-5 shadow-sm flex items-center gap-4 mx-auto font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.8rem] uppercase tracking-[0.3em]">
                    <Plus className="w-6 h-6" />
                    Create Job
                  </button>
                </div>
              </div>

              {/* Accent Divider - Solid Green Bar (NO TEXT) */}
              <div className="bg-turf-green min-h-[50px] flex items-center justify-center shadow-lg">
                <div className="flex gap-10">
                  <div className="w-3.5 h-3.5 bg-white/20"></div>
                  <div className="w-3.5 h-3.5 bg-white/40"></div>
                  <div className="w-3.5 h-3.5 bg-white/70"></div>
                </div>
              </div>

              {/* Second Jobs Section - EMPTY STATE */}
              <div className="bg-panel-white border border-border-color shadow-[4px_4px_0px_#73A65710]">
                <h3 className="text-[0.75rem] font-heading font-black text-text-secondary uppercase px-10 py-6 border-b border-border-color tracking-[0.3em]">
                  Second Jobs Portfolio
                </h3>
                <div className="p-24 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-turf-green/5 flex items-center justify-center mb-10 border border-turf-green/10">
                    <Moon className="w-10 h-10 text-turf-green/30 stroke-[1.2]" />
                  </div>
                  <p className="text-text-secondary mb-12 font-sans font-bold text-2xl tracking-tight max-w-sm">Afternoon schedule is open for new assignments.</p>
                  <button className="bg-turf-green text-white px-14 py-5 shadow-sm flex items-center gap-4 mx-auto font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.8rem] uppercase tracking-[0.3em]">
                    <Plus className="w-6 h-6" />
                    Create Job
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right Panel */}
          <RightPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
