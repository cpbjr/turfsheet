import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar, Header, RightPanel } from './components/layout';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import StaffPage from './pages/StaffPage';
import Modal from './components/ui/Modal';
import JobForm from './components/jobs/JobForm';

function App() {
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

  const handleCreateJob = (data: any) => {
    console.log('New Job Data:', data);
    // Future: Logic to save job to state/backend
    setIsAddJobModalOpen(false);
  };

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
            <Routes>
              <Route
                path="/"
                element={<DashboardPage onCreateJob={() => setIsAddJobModalOpen(true)} />}
              />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/staff" element={<StaffPage />} />
              {/* Fallback to Dashboard */}
              <Route
                path="*"
                element={<DashboardPage onCreateJob={() => setIsAddJobModalOpen(true)} />}
              />
            </Routes>
          </section>

          {/* Right Panel */}
          <RightPanel />
        </div>
      </main>

      <Modal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        title="Create New Job"
      >
        <JobForm
          onSubmit={handleCreateJob}
          onCancel={() => setIsAddJobModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default App;
