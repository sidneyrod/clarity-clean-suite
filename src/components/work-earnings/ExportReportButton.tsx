import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCsv } from '@/utils/pdfGenerator';
import { WorkEarningsPeriod, GlobalSummary } from '@/hooks/useWorkEarnings';
import { useCompanyStore } from '@/stores/companyStore';
import html2pdf from 'html2pdf.js';

interface ExportReportButtonProps {
  period: WorkEarningsPeriod;
  globalSummary: GlobalSummary;
  getExportData: () => Promise<any[]>;
}

export function ExportReportButton({
  period,
  globalSummary,
  getExportData,
}: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { profile } = useCompanyStore();

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const data = await getExportData();
      
      if (data.length === 0) {
        toast.error('No data to export for the selected period');
        return;
      }

      const filename = `work-time-tracking-report-${period.startDate}-to-${period.endDate}`;
      exportToCsv(data, filename);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const data = await getExportData();
      
      if (data.length === 0) {
        toast.error('No data to export for the selected period');
        return;
      }

      const companyName = profile?.companyName || 'Company';
      const html = generateWorkTimeTrackingReportHtml(
        data,
        period,
        globalSummary,
        companyName
      );

      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const element = container.querySelector('body > *') || container;

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `work-time-tracking-${period.startDate}-to-${period.endDate}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        })
        .from(element as HTMLElement)
        .save();

      // Cleanup
      document.body.removeChild(container);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = async () => {
    setIsExporting(true);
    try {
      const data = await getExportData();
      
      if (data.length === 0) {
        toast.error('No data to export for the selected period');
        return;
      }

      const companyName = profile?.companyName || 'Company';
      const html = generateWorkTimeTrackingReportHtml(
        data,
        period,
        globalSummary,
        companyName
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      toast.success('Report opened for printing');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to generate print preview');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadPdf}>
          <FileText className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintPdf}>
          <Printer className="h-4 w-4 mr-2" />
          Print PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCsv}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function generateWorkTimeTrackingReportHtml(
  data: any[],
  period: WorkEarningsPeriod,
  summary: GlobalSummary,
  companyName: string
): string {
  const rows = data.map(row => `
    <tr>
      <td>${row.Date}</td>
      <td>${row.Cleaner}</td>
      <td>${row.Client}</td>
      <td>${row['Job ID']}</td>
      <td style="text-align: right;">${row['Hours Worked']}</td>
      <td style="text-align: right;">${row['Gross Service Amount']}</td>
      <td>${row['Payment Method']}</td>
      <td style="text-align: right;">${row['Cash Kept by Cleaner']}</td>
      <td style="text-align: right;">${row['Cash Delivered to Office']}</td>
      <td>${row.Status}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Work & Time Tracking Report - ${period.startDate} to ${period.endDate}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          font-size: 10px; 
          color: #1a1a1a;
          line-height: 1.4;
          margin: 0;
          padding: 15px;
          background: white;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          border-bottom: 2px solid #1a3d2e; 
          padding-bottom: 12px; 
          margin-bottom: 16px; 
        }
        .company-name { font-size: 18px; font-weight: 600; color: #1a3d2e; }
        .report-title { font-size: 14px; font-weight: 500; margin-top: 4px; }
        .period { font-size: 11px; color: #666; }
        .summary-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          flex: 1;
          background: #f8f9fb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .summary-label { font-size: 9px; color: #666; text-transform: uppercase; }
        .summary-value { font-size: 16px; font-weight: 600; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { 
          background: #f3f4f6; 
          text-align: left; 
          padding: 8px 6px; 
          font-weight: 600;
          border-bottom: 1px solid #d1d5db;
          text-transform: uppercase;
          font-size: 8px;
          letter-spacing: 0.5px;
        }
        td { 
          padding: 6px; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .footer { 
          margin-top: 24px; 
          padding-top: 12px; 
          border-top: 1px solid #e5e7eb;
        }
        .disclaimer {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 4px;
          padding: 10px;
          font-size: 9px;
          color: #92400e;
        }
        .generated-at {
          font-size: 9px;
          color: #9ca3af;
          text-align: right;
          margin-top: 8px;
        }
        @media print {
          @page { size: A4 landscape; margin: 1.5cm; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">${companyName}</div>
          <div class="report-title">Work & Time Tracking Report</div>
        </div>
        <div class="period">
          Period: ${period.startDate} to ${period.endDate}
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Jobs Completed</div>
          <div class="summary-value">${summary.totalJobsCompleted}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Hours Worked</div>
          <div class="summary-value">${summary.totalHoursWorked.toFixed(1)}h</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Gross Service Revenue</div>
          <div class="summary-value">$${summary.totalGrossServiceRevenue.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Cash Collected</div>
          <div class="summary-value">$${summary.totalCashCollected.toLocaleString()}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Cleaner</th>
            <th>Client</th>
            <th>Job ID</th>
            <th style="text-align: right;">Hours</th>
            <th style="text-align: right;">Amount</th>
            <th>Payment</th>
            <th style="text-align: right;">Cash Kept</th>
            <th style="text-align: right;">Cash Delivered</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        <div class="disclaimer">
          <strong>Important Notice:</strong> This report is operational and financial only. 
          Payroll calculation and tax compliance must be handled externally by the accountant. 
          This system does not calculate salaries, deductions, CPP, EI, or any payroll amounts.
        </div>
        <div class="generated-at">
          Generated on ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
  `;
}
