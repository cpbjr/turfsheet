import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import JobCard from '../components/jobs/JobCard';
import { supabase } from '../lib/supabase';
import type { Job, DayOfWeek, ScheduledJobQueueWithJob } from '../types';

const DAY_NAMES: DayOfWeek[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodayDayOfWeek(): DayOfWeek {
  return DAY_NAMES[new Date().getDay()];
}

interface ClassicDashboardProps {
  onCreateJob?: () => void;
}

export default function ClassicDashboard({ onCreateJob }: ClassicDashboardProps) {
  const [firstJobs, setFirstJobs] = useState<Job[]>([]);
  const [secondJobs, setSecondJobs] = useState<Job[]>([]);
  const [scheduledQueue, setScheduledQueue] = useState<ScheduledJobQueueWithJob[]>([]);
  const [today] = useState<string>(getTodayISO());
  const [todayDOW] = useState<DayOfWeek>(getTodayDayOfWeek());

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      setFirstJobs((data || []).filter((j) => j.section === 'First Jobs'));
      setSecondJobs((data || []).filter((j) => j.section === 'Second Jobs'));
    };

    fetchJobs();
  }, []);

  // Auto-populate scheduled job queue for today
  useEffect(() => {
    if (firstJobs.length === 0) return;

    const populateScheduledQueue = async () => {
      const scheduledToday = firstJobs.filter(
        (job) => job.is_scheduled && job.scheduled_days.includes(todayDOW)
      );

      if (scheduledToday.length > 0) {
        const rows = scheduledToday.map((job) => ({
          job_id: parseInt(job.id),
          queue_date: today,
          dismissed: false,
        }));

        const { error } = await supabase
          .from('scheduled_job_queue')
          .upsert(rows, { onConflict: 'job_id,queue_date', ignoreDuplicates: true });

        if (error) {
          console.error('Error populating scheduled queue:', error);
        }
      }

      await fetchScheduledQueue();
    };

    populateScheduledQueue();
  }, [firstJobs, today, todayDOW]);

  const fetchScheduledQueue = async () => {
    const { data, error } = await supabase
      .from('scheduled_job_queue')
      .select('*, job:jobs(*)')
      .eq('queue_date', today)
      .eq('dismissed', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled queue:', error);
      return;
    }
    setScheduledQueue((data || []) as ScheduledJobQueueWithJob[]);
  };

  const handleDismissScheduled = async (queueId: string) => {
    const { error } = await supabase
      .from('scheduled_job_queue')
      .update({ dismissed: true })
      .eq('id', queueId);

    if (error) {
      console.error('Error dismissing scheduled job:', error);
      return;
    }
    setScheduledQueue(scheduledQueue.filter((q) => q.id !== queueId));
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col space-y-24">
      {/* Scheduled Today Section */}
      {scheduledQueue.length > 0 && (
        <section>
          <h3 className="text-[0.75rem] font-heading font-black text-turf-green uppercase px-10 py-6 border-b border-turf-green/30 tracking-[0.3em] mb-8 bg-panel-white border border-turf-green/30">
            Scheduled Today — {todayLabel}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {scheduledQueue.map((item) => (
              <div key={item.id} className="relative">
                <JobCard
                  title={item.job.title}
                  crewNeeded={item.job.crew_needed}
                  priority={item.job.priority}
                  description={item.job.description}
                  section={item.job.section}
                />
                <button
                  onClick={() => handleDismissScheduled(item.id)}
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/20 rounded transition-colors text-xs font-bold"
                  title="Remove from today"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* First Jobs Section */}
      <section>
        <h3 className="text-[0.75rem] font-heading font-black text-text-secondary uppercase px-10 py-6 border-b border-border-color tracking-[0.3em] mb-8 bg-panel-white border border-border-color">
          First Jobs Portfolio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {firstJobs.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              crewNeeded={job.crew_needed}
              priority={job.priority}
              description={job.description}
              section={job.section}
            />
          ))}
          <button
            onClick={onCreateJob}
            className="border-2 border-dashed border-border-color bg-panel-white/50 p-8 flex flex-col items-center justify-center gap-4 group hover:border-turf-green transition-colors min-h-[250px]"
          >
            <div className="w-12 h-12 rounded-full border border-border-color flex items-center justify-center group-hover:border-turf-green group-hover:bg-turf-green/5 transition-all">
              <Plus className="w-6 h-6 text-text-muted group-hover:text-turf-green" />
            </div>
            <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest group-hover:text-turf-green">Add First Job</span>
          </button>
        </div>
      </section>

      {/* Accent Divider */}
      <div className="flex items-center gap-6">
        <div className="flex-1 h-[2px] bg-turf-green/20"></div>
        <div className="flex gap-4">
          <div className="w-2 h-2 bg-turf-green/40 rotate-45"></div>
          <div className="w-2 h-2 bg-turf-green/60 rotate-45"></div>
          <div className="w-2 h-2 bg-turf-green/40 rotate-45"></div>
        </div>
        <div className="flex-1 h-[2px] bg-turf-green/20"></div>
      </div>

      {/* Second Jobs Section */}
      <section>
        <h3 className="text-[0.75rem] font-heading font-black text-text-secondary uppercase px-10 py-6 border-b border-border-color tracking-[0.3em] mb-8 bg-panel-white border border-border-color">
          Second Jobs Portfolio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {secondJobs.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              crewNeeded={job.crew_needed}
              priority={job.priority}
              description={job.description}
              section={job.section}
            />
          ))}
          <button
            onClick={onCreateJob}
            className="border-2 border-dashed border-border-color bg-panel-white/50 p-8 flex flex-col items-center justify-center gap-4 group hover:border-turf-green transition-colors min-h-[250px]"
          >
            <div className="w-12 h-12 rounded-full border border-border-color flex items-center justify-center group-hover:border-turf-green group-hover:bg-turf-green/5 transition-all">
              <Plus className="w-6 h-6 text-text-muted group-hover:text-turf-green" />
            </div>
            <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest group-hover:text-turf-green">Add Second Job</span>
          </button>
        </div>
      </section>
    </div>
  );
}
