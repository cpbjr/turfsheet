import { Sidebar, Header, RightPanel } from './components/layout';
import { Plus } from 'lucide-react';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Dashboard Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Task Board - Center */}
          <section className="flex-1 p-6 overflow-y-auto bg-bg-main">
            <div className="space-y-6">
              {/* First Jobs Section - EMPTY STATE */}
              <div>
                <h3 className="text-xs font-heading font-bold text-text-secondary uppercase mb-4 pb-2 border-b border-border-color">
                  First Jobs
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <p className="text-gray-500 mb-4">No jobs scheduled for this day</p>
                  <button className="bg-turf-green text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-turf-green-dark transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Job
                  </button>
                </div>
              </div>

              {/* Second Jobs Section - EMPTY STATE */}
              <div>
                <h3 className="text-xs font-heading font-bold text-text-secondary uppercase mb-4 pb-2 border-b border-border-color">
                  Second Jobs
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <p className="text-gray-500 mb-4">No jobs scheduled for this day</p>
                  <button className="bg-turf-green text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-turf-green-dark transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Job
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
