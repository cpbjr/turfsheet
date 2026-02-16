import { useState } from 'react';
import StaffWhiteboardView from '../components/whiteboard/StaffWhiteboardView';

export default function DashboardPage() {
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
