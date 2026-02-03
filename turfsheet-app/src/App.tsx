import { Sidebar, Header, RightPanel } from './components/layout';

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
          <section className="flex-1 p-5 overflow-y-auto bg-bg-main">
            <div className="space-y-6">
              {/* First Jobs Section */}
              <div>
                <h3 className="text-xs font-heading font-bold text-text-secondary uppercase mb-4 pb-2 border-b border-border-color">
                  First Jobs
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Sample job card */}
                  <div className="bg-white border border-border-color rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
                    <div className="bg-turf-green text-white px-3 py-2 font-semibold text-sm flex justify-between items-center">
                      <span>Mow Greens</span>
                      <i className="fa-solid fa-xmark"></i>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Mow Direction:</label> Left to Right (8-2)
                      </div>
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Clean Up:</label> Clockwise
                      </div>
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">HOC:</label> 0.125"
                      </div>
                      <div className="font-bold text-turf-green text-xs mt-2">Crew Needed: 3</div>
                      <button className="text-turf-green text-xs cursor-pointer hover:text-turf-green-dark transition mt-1">
                        Assign Crew
                      </button>
                    </div>
                  </div>

                  {/* Additional sample cards */}
                  <div className="bg-white border border-border-color rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
                    <div className="bg-turf-green text-white px-3 py-2 font-semibold text-sm flex justify-between items-center">
                      <span>Mow Fairways</span>
                      <i className="fa-solid fa-xmark"></i>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Mow Direction:</label> 50:50 Split (Tuxedo)
                      </div>
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Clean Up:</label> Clockwise (Tan & Black)
                      </div>
                      <div className="font-bold text-turf-green text-xs mt-2">Crew Needed: 4</div>
                      <button className="text-turf-green text-xs cursor-pointer hover:text-turf-green-dark transition mt-1">
                        Assign Crew
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-border-color rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
                    <div className="bg-turf-green text-white px-3 py-2 font-semibold text-sm flex justify-between items-center">
                      <span>Mow Approaches</span>
                      <i className="fa-solid fa-xmark"></i>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Mow Direction:</label> Side to Side (3-9)
                      </div>
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Clean Up:</label> Clockwise
                      </div>
                      <div className="font-bold text-turf-green text-xs mt-2">Crew Needed: 2</div>
                      <button className="text-turf-green text-xs cursor-pointer hover:text-turf-green-dark transition mt-1">
                        Assign Crew
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-border-color rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
                    <div className="bg-turf-green text-white px-3 py-2 font-semibold text-sm flex justify-between items-center">
                      <span>Roll Greens</span>
                      <i className="fa-solid fa-xmark"></i>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="font-bold text-turf-green text-xs">Crew Needed: 2</div>
                      <button className="text-turf-green text-xs cursor-pointer hover:text-turf-green-dark transition mt-1">
                        Assign Crew
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Jobs Section */}
              <div>
                <h3 className="text-xs font-heading font-bold text-text-secondary uppercase mb-4 pb-2 border-b border-border-color">
                  Second Jobs
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div className="bg-white border border-border-color rounded shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
                    <div className="bg-turf-green text-white px-3 py-2 font-semibold text-sm flex justify-between items-center">
                      <span>Change Cups</span>
                      <i className="fa-solid fa-xmark"></i>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-xs">
                        <label className="font-bold text-gray-900">Notes:</label> Pin Sheet 4
                      </div>
                      <div className="font-bold text-turf-green text-xs mt-2">Crew Needed: 1</div>
                      <button className="text-turf-green text-xs cursor-pointer hover:text-turf-green-dark transition mt-1">
                        Assign Crew
                      </button>
                    </div>
                  </div>
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
