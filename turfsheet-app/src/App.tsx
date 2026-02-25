import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { Sidebar, Header, RightPanel } from './components/layout';
import DashboardPage from './pages/DashboardPage';
import ClassicDashboard from './pages/ClassicDashboard';
import JobsPage from './pages/JobsPage';
import StaffPage from './pages/StaffPage';
import Settings from './pages/Settings';
import ProjectsPage from './pages/ProjectsPage';
import EquipmentPage from './pages/EquipmentPage';
import CalendarPage from './pages/CalendarPage';
import PesticidePage from './pages/PesticidePage';
import IrrigationPage from './pages/IrrigationPage';
import MaintenancePage from './pages/MaintenancePage';
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
    <SettingsProvider>
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
                  element={<DashboardPage />}
                />
                <Route
                  path="/whiteboard"
                  element={<DashboardPage />}
                />
                <Route
                  path="/classic"
                  element={<ClassicDashboard onCreateJob={() => setIsAddJobModalOpen(true)} />}
                />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/pesticide" element={<PesticidePage />} />
                <Route path="/irrigation" element={<IrrigationPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/settings" element={<Settings />} />
                {/* Fallback to Dashboard */}
                <Route
                  path="*"
                  element={<DashboardPage />}
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
    </SettingsProvider>
  );
}

export default App;
