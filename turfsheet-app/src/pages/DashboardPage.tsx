import { useState } from 'react';
import StaffWhiteboardView from '../components/whiteboard/StaffWhiteboardView';

interface DashboardPageProps {
  onCreateJob?: () => void;
}

export default function DashboardPage(_props: DashboardPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="flex flex-col h-full">
      <StaffWhiteboardView
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  );
}
