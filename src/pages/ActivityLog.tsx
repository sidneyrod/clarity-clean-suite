import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Users, FileText, Calendar, DollarSign, Settings, LogIn, LogOut, CalendarOff } from 'lucide-react';
import { useActivityStore, ActivityType } from '@/stores/activityStore';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const activityConfig: Record<ActivityType, { icon: typeof Activity; color: string; label: string }> = {
  user_created: { icon: Users, color: 'text-success', label: 'User Created' },
  user_updated: { icon: Users, color: 'text-info', label: 'User Updated' },
  user_deleted: { icon: Users, color: 'text-destructive', label: 'User Deleted' },
  client_created: { icon: User, color: 'text-success', label: 'Client Created' },
  client_updated: { icon: User, color: 'text-info', label: 'Client Updated' },
  client_deleted: { icon: User, color: 'text-destructive', label: 'Client Deleted' },
  contract_created: { icon: FileText, color: 'text-success', label: 'Contract Created' },
  contract_updated: { icon: FileText, color: 'text-info', label: 'Contract Updated' },
  contract_deleted: { icon: FileText, color: 'text-destructive', label: 'Contract Deleted' },
  job_created: { icon: Calendar, color: 'text-success', label: 'Job Created' },
  job_updated: { icon: Calendar, color: 'text-info', label: 'Job Updated' },
  job_completed: { icon: Calendar, color: 'text-primary', label: 'Job Completed' },
  job_cancelled: { icon: Calendar, color: 'text-warning', label: 'Job Cancelled' },
  estimate_created: { icon: DollarSign, color: 'text-success', label: 'Estimate Created' },
  estimate_updated: { icon: DollarSign, color: 'text-info', label: 'Estimate Updated' },
  estimate_deleted: { icon: DollarSign, color: 'text-destructive', label: 'Estimate Deleted' },
  estimate_sent: { icon: DollarSign, color: 'text-primary', label: 'Estimate Sent' },
  payroll_created: { icon: DollarSign, color: 'text-success', label: 'Payroll Created' },
  payroll_approved: { icon: DollarSign, color: 'text-primary', label: 'Payroll Approved' },
  payroll_paid: { icon: DollarSign, color: 'text-success', label: 'Payroll Paid' },
  settings_updated: { icon: Settings, color: 'text-info', label: 'Settings Updated' },
  login: { icon: LogIn, color: 'text-success', label: 'Login' },
  logout: { icon: LogOut, color: 'text-muted-foreground', label: 'Logout' },
  absence_requested: { icon: CalendarOff, color: 'text-warning', label: 'Absence Requested' },
  absence_approved: { icon: CalendarOff, color: 'text-success', label: 'Absence Approved' },
  absence_rejected: { icon: CalendarOff, color: 'text-destructive', label: 'Absence Rejected' },
};

const ActivityLog = () => {
  const { t } = useLanguage();
  const { logs } = useActivityStore();

  return (
    <div className="container px-4 py-8 lg:px-8 space-y-6">
      <PageHeader title="Activity Log" description="Track all actions and changes in the system" />
      
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => {
                const config = activityConfig[log.type];
                const Icon = config.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-muted", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{log.description}</p>
                        <Badge variant="outline" className="shrink-0">{config.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{log.userName}</span>
                        <span>•</span>
                        <span title={format(new Date(log.timestamp), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;
