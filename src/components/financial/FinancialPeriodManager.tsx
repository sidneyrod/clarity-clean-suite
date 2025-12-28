import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Lock, Unlock, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFinancialPeriods, FinancialPeriod } from '@/hooks/useFinancialPeriods';
import { useRoleAccess } from '@/hooks/useRoleAccess';

const FinancialPeriodManager = () => {
  const { periods, currentPeriod, isLoading, createPeriod, closePeriod, reopenPeriod } = useFinancialPeriods();
  const { isAdmin } = useRoleAccess();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialPeriod | null>(null);
  
  // Create form
  const [periodName, setPeriodName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Close/Reopen form
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!periodName || !startDate || !endDate) return;
    
    setIsSubmitting(true);
    const result = await createPeriod(periodName, startDate, endDate);
    setIsSubmitting(false);
    
    if (result) {
      setShowCreateDialog(false);
      setPeriodName('');
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClose = async () => {
    if (!selectedPeriod || !reason.trim()) return;
    
    setIsSubmitting(true);
    const success = await closePeriod(selectedPeriod.id, reason);
    setIsSubmitting(false);
    
    if (success) {
      setShowCloseDialog(false);
      setSelectedPeriod(null);
      setReason('');
    }
  };

  const handleReopen = async () => {
    if (!selectedPeriod || !reason.trim()) return;
    
    setIsSubmitting(true);
    const success = await reopenPeriod(selectedPeriod.id, reason);
    setIsSubmitting(false);
    
    if (success) {
      setShowReopenDialog(false);
      setSelectedPeriod(null);
      setReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-500">Open</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      case 'reopened':
        return <Badge variant="secondary" className="bg-amber-500 text-white">Reopened</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Loading financial periods...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Financial Periods</h3>
          <p className="text-sm text-muted-foreground">
            Manage financial periods for governance and audit control
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Period
          </Button>
        )}
      </div>

      {currentPeriod && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Current Period: {currentPeriod.period_name}
              </CardTitle>
              {getStatusBadge(currentPeriod.status)}
            </div>
            <CardDescription>
              {format(new Date(currentPeriod.start_date), 'MMM d, yyyy')} - {format(new Date(currentPeriod.end_date), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          {isAdmin && (
            <CardContent className="pt-2">
              {currentPeriod.status === 'open' || currentPeriod.status === 'reopened' ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedPeriod(currentPeriod);
                    setShowCloseDialog(true);
                  }}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Close Period
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedPeriod(currentPeriod);
                    setShowReopenDialog(true);
                  }}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Reopen Period
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Periods</CardTitle>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No financial periods defined yet.
            </p>
          ) : (
            <div className="space-y-2">
              {periods.map((period) => (
                <div 
                  key={period.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{period.period_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(period.start_date), 'MMM d')} - {format(new Date(period.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(period.status)}
                    {isAdmin && period.id !== currentPeriod?.id && (
                      <>
                        {(period.status === 'open' || period.status === 'reopened') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setShowCloseDialog(true);
                            }}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        {period.status === 'closed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setShowReopenDialog(true);
                            }}
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Period Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Financial Period</DialogTitle>
            <DialogDescription>
              Define a new financial period for governance and control.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodName">Period Name</Label>
              <Input
                id="periodName"
                placeholder="e.g., January 2024, Q1 2024"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !periodName || !startDate || !endDate}>
              Create Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Period Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Close Financial Period
            </DialogTitle>
            <DialogDescription>
              Closing a period will prevent any modifications to financial records within this date range.
              This action is logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPeriod && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedPeriod.period_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedPeriod.start_date), 'MMM d, yyyy')} - {format(new Date(selectedPeriod.end_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="closeReason">Reason for Closing (Required)</Label>
              <Textarea
                id="closeReason"
                placeholder="Provide a reason for closing this period..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClose} 
              disabled={isSubmitting || !reason.trim()}
            >
              <Lock className="h-4 w-4 mr-2" />
              Close Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Period Dialog */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reopen Financial Period
            </DialogTitle>
            <DialogDescription>
              Reopening a period will allow modifications to financial records.
              This is a sensitive action and will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPeriod && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedPeriod.period_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedPeriod.start_date), 'MMM d, yyyy')} - {format(new Date(selectedPeriod.end_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reopenReason">Reason for Reopening (Required)</Label>
              <Textarea
                id="reopenReason"
                placeholder="Provide a justification for reopening this period..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReopenDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReopen} 
              disabled={isSubmitting || !reason.trim()}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Reopen Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialPeriodManager;
