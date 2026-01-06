import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, X, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toSafeLocalDate } from '@/lib/dates';

interface OverdueJob {
  id: string;
  client_name: string;
  cleaner_name: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  minutes_overdue: number;
}

interface OverdueJobAlertProps {
  onDismiss?: () => void;
}

const OverdueJobAlert = ({ onDismiss }: OverdueJobAlertProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [overdueJobs, setOverdueJobs] = useState<OverdueJob[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const labels = {
    en: {
      title: 'Jobs Overdue',
      subtitle: 'The following jobs are still in progress past their expected completion time',
      viewJob: 'View',
      dismiss: 'Dismiss',
      hoursOverdue: 'hours overdue',
      minutesOverdue: 'min overdue',
    },
    fr: {
      title: 'Tâches en retard',
      subtitle: 'Les tâches suivantes sont toujours en cours après leur heure prévue de fin',
      viewJob: 'Voir',
      dismiss: 'Fermer',
      hoursOverdue: 'heures de retard',
      minutesOverdue: 'min de retard',
    }
  };

  const t = labels[language] || labels.en;

  useEffect(() => {
    const checkOverdueJobs = async () => {
      if (!user?.profile?.company_id) return;

      try {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');

        // Fetch in-progress jobs
        const { data: inProgressJobs, error } = await supabase
          .from('jobs')
          .select(`
            id,
            scheduled_date,
            start_time,
            duration_minutes,
            clients:client_id (name),
            profiles:cleaner_id (first_name, last_name)
          `)
          .eq('company_id', user.profile.company_id)
          .eq('status', 'in-progress')
          .lte('scheduled_date', today);

        if (error) {
          console.error('Error fetching in-progress jobs:', error);
          return;
        }

        // Filter for overdue jobs (past expected end time + 60 min tolerance)
        const overdue: OverdueJob[] = [];
        const TOLERANCE_MINUTES = 60;

        for (const job of inProgressJobs || []) {
          if (!job.start_time || !job.duration_minutes) continue;

          const jobDate = toSafeLocalDate(job.scheduled_date);
          const [hours, minutes] = job.start_time.split(':').map(Number);
          
          const startTime = new Date(jobDate);
          startTime.setHours(hours, minutes, 0, 0);
          
          const expectedEndTime = new Date(startTime.getTime() + job.duration_minutes * 60 * 1000);
          const toleranceEndTime = new Date(expectedEndTime.getTime() + TOLERANCE_MINUTES * 60 * 1000);

          if (now > toleranceEndTime) {
            const minutesOverdue = differenceInMinutes(now, expectedEndTime);
            
            overdue.push({
              id: job.id,
              client_name: (job.clients as any)?.name || 'Unknown Client',
              cleaner_name: job.profiles 
                ? `${(job.profiles as any).first_name || ''} ${(job.profiles as any).last_name || ''}`.trim()
                : 'Unassigned',
              scheduled_date: job.scheduled_date,
              start_time: job.start_time,
              duration_minutes: job.duration_minutes,
              minutes_overdue: minutesOverdue,
            });
          }
        }

        setOverdueJobs(overdue);

        // Create notifications for overdue jobs (if not already created today)
        if (overdue.length > 0) {
          for (const job of overdue) {
            // Check if notification already exists for this job today
            const { data: existingNotif } = await supabase
              .from('notifications')
              .select('id')
              .eq('company_id', user.profile.company_id)
              .eq('type', 'system')
              .ilike('title', '%overdue%')
              .gte('created_at', today)
              .limit(1);

            if (!existingNotif || existingNotif.length === 0) {
              await supabase.from('notifications').insert({
                company_id: user.profile.company_id,
                role_target: 'admin',
                title: 'Job Overdue Alert',
                message: `Job for ${job.client_name} is ${Math.round(job.minutes_overdue / 60)}+ hours overdue. Assigned to: ${job.cleaner_name}`,
                type: 'system',
                severity: 'warning',
                metadata: { job_id: job.id, client_name: job.client_name }
              } as any);
            }
          }
        }
      } catch (err) {
        console.error('Error checking overdue jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkOverdueJobs();
    
    // Check every 10 minutes
    const interval = setInterval(checkOverdueJobs, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.profile?.company_id]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const formatOverdueTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}+ ${t.hoursOverdue}`;
    }
    return `${minutes} ${t.minutesOverdue}`;
  };

  if (isLoading || dismissed || overdueJobs.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{t.title} ({overdueJobs.length})</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">{t.subtitle}</p>
        <div className="space-y-2">
          {overdueJobs.slice(0, 3).map((job) => (
            <div 
              key={job.id}
              className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-destructive/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{job.client_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{job.cleaner_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-destructive/20 text-destructive border-destructive/30">
                    {formatOverdueTime(job.minutes_overdue)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => navigate(`/schedule?view=day&date=${job.scheduled_date}`)}
              >
                {t.viewJob}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
        {overdueJobs.length > 3 && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 text-destructive"
            onClick={() => navigate('/schedule?status=in-progress')}
          >
            View all {overdueJobs.length} overdue jobs
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default OverdueJobAlert;
