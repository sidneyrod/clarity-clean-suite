import * as React from "react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type PeriodPreset = 'today' | 'this_week' | 'last_week' | 'biweekly' | 'this_month' | 'last_month' | 'custom';

interface PeriodSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const periodLabels = {
  en: {
    today: 'Today',
    this_week: 'This Week',
    last_week: 'Last Week',
    biweekly: 'Last 2 Weeks',
    this_month: 'This Month',
    last_month: 'Last Month',
    custom: 'Custom Range',
    selectPeriod: 'Select Period',
    from: 'From',
    to: 'To',
    apply: 'Apply',
  },
  fr: {
    today: "Aujourd'hui",
    this_week: 'Cette Semaine',
    last_week: 'Semaine Dernière',
    biweekly: '2 Dernières Semaines',
    this_month: 'Ce Mois',
    last_month: 'Mois Dernier',
    custom: 'Période Personnalisée',
    selectPeriod: 'Sélectionner Période',
    from: 'De',
    to: 'À',
    apply: 'Appliquer',
  },
};

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const { language } = useLanguage();
  const labels = periodLabels[language] || periodLabels.en;
  
  const [selectedPreset, setSelectedPreset] = React.useState<PeriodPreset>('this_week');
  const [customStart, setCustomStart] = React.useState<Date | undefined>(value.startDate);
  const [customEnd, setCustomEnd] = React.useState<Date | undefined>(value.endDate);
  const [customOpen, setCustomOpen] = React.useState(false);

  const getPresetRange = (preset: PeriodPreset): DateRange => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        return { startDate: startOfDay(today), endDate: endOfDay(today) };
      case 'this_week':
        return { startDate: startOfWeek(today, { weekStartsOn: 1 }), endDate: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'last_week':
        const lastWeekStart = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
        return { startDate: lastWeekStart, endDate: addDays(lastWeekStart, 6) };
      case 'biweekly':
        return { startDate: subDays(today, 13), endDate: endOfDay(today) };
      case 'this_month':
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case 'last_month':
        const lastMonth = subDays(startOfMonth(today), 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'custom':
        return value;
      default:
        return { startDate: startOfWeek(today, { weekStartsOn: 1 }), endDate: endOfWeek(today, { weekStartsOn: 1 }) };
    }
  };

  const handlePresetSelect = (preset: PeriodPreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      onChange(range);
    } else {
      setCustomOpen(true);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({ startDate: startOfDay(customStart), endDate: endOfDay(customEnd) });
      setCustomOpen(false);
    }
  };

  const getDisplayLabel = (): string => {
    if (selectedPreset === 'custom') {
      return `${format(value.startDate, 'MMM d')} - ${format(value.endDate, 'MMM d, yyyy')}`;
    }
    return labels[selectedPreset];
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[180px] justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{getDisplayLabel()}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => handlePresetSelect('today')}>
            {labels.today}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('this_week')}>
            {labels.this_week}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('last_week')}>
            {labels.last_week}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('biweekly')}>
            {labels.biweekly}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePresetSelect('this_month')}>
            {labels.this_month}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('last_month')}>
            {labels.last_month}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePresetSelect('custom')}>
            {labels.custom}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Popover */}
      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.from}</label>
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  className={cn("p-0 pointer-events-auto")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{labels.to}</label>
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  disabled={(date) => customStart ? date < customStart : false}
                  className={cn("p-0 pointer-events-auto")}
                />
              </div>
            </div>
            <Button 
              onClick={handleCustomApply} 
              className="w-full"
              disabled={!customStart || !customEnd}
            >
              {labels.apply}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Display current range */}
      {selectedPreset !== 'custom' && (
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {format(value.startDate, 'MMM d')} - {format(value.endDate, 'MMM d, yyyy')}
        </span>
      )}
    </div>
  );
}

export default PeriodSelector;
