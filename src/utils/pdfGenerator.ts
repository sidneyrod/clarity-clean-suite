/**
 * PDF Generation Utilities for Multi-Tenant Cleaning Management Platform
 * 
 * CRITICAL MULTI-TENANT BRANDING RULE:
 * - All generated documents (Contracts, Invoices, Reports) MUST use CLIENT COMPANY branding
 * - The platform owner (ARKELIUM) MUST NEVER appear on client documents
 * - Branding (logo, colors, company name) is dynamically loaded from Company Branding table
 * - Logo appears at TOP HEADER and as WATERMARK in background
 * - If no company logo exists, use neutral placeholder (never fallback to ARKELIUM)
 */

import { CompanyProfile, CompanyBranding } from '@/stores/companyStore';

export interface ContractPdfData {
  contractId: string;
  clientName: string;
  clientAddress: string;
  clientEmail?: string;
  clientPhone?: string;
  contractType: 'recurring' | 'one-time';
  startDate: string;
  endDate?: string;
  hoursPerWeek: number;
  hourlyRate: number;
  billingFrequency: string;
  cleaningDays: string[];
  timeWindow: string;
  serviceLocation: string;
  cleaningScope: string;
  specialNotes?: string;
  totalValue: number;
}

export interface EstimatePdfData {
  estimateId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceType: string;
  frequency: string;
  squareFootage: number;
  roomDetails: string;
  extras: string[];
  totalAmount: number;
  validUntil: string;
}

export interface PayrollReportData {
  periodStart: string;
  periodEnd: string;
  province: string;
  employees: {
    name: string;
    regularHours: number;
    overtimeHours: number;
    grossPay: number;
    netPay: number;
  }[];
  totals: {
    hours: number;
    gross: number;
    net: number;
  };
}

/**
 * Generate common PDF styles with company branding
 * Uses COMPANY branding (not platform branding)
 */
const getCommonStyles = (branding: CompanyBranding) => `
  @page { size: A4; margin: 2cm; }
  body { 
    font-family: 'Outfit', 'Segoe UI', sans-serif; 
    color: #1a1a1a; 
    line-height: 1.6; 
    position: relative;
    font-size: 11px;
  }
  .header { 
    text-align: center; 
    margin-bottom: 30px; 
    position: relative; 
  }
  .watermark { 
    position: fixed; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%);
    opacity: 0.06;
    z-index: -1;
    pointer-events: none;
  }
  .watermark img {
    max-width: 400px;
    max-height: 400px;
    object-fit: contain;
  }
  .watermark-text {
    font-size: 100px;
    font-weight: bold;
    color: ${branding.primaryColor || '#1a3d2e'};
    transform: rotate(-30deg);
    opacity: 0.04;
  }
  .logo { 
    max-width: 180px; 
    max-height: 80px;
    margin-bottom: 16px; 
    object-fit: contain;
  }
  .company-name { 
    font-size: 24px; 
    font-weight: 600; 
    color: ${branding.primaryColor || '#1a3d2e'}; 
  }
  .company-info { 
    font-size: 12px; 
    color: #666; 
    margin-top: 8px; 
  }
  .title { 
    font-size: 18px; 
    font-weight: 600; 
    margin: 30px 0 20px; 
    border-bottom: 2px solid ${branding.primaryColor || '#1a3d2e'}; 
    padding-bottom: 8px; 
  }
  .section { margin-bottom: 20px; }
  .section-title { 
    font-size: 13px; 
    font-weight: 600; 
    color: ${branding.primaryColor || '#1a3d2e'}; 
    margin-bottom: 10px;
    margin-top: 20px;
  }
  .clause { margin-bottom: 12px; }
  .clause-title { font-weight: 600; margin-bottom: 4px; }
  .clause-text { color: #333; text-align: justify; }
  .field { display: flex; margin-bottom: 8px; }
  .field-label { width: 150px; font-weight: 500; color: #555; }
  .field-value { flex: 1; }
  .total-box { 
    background: linear-gradient(135deg, ${branding.primaryColor || '#1a3d2e'}15, ${branding.primaryColor || '#1a3d2e'}08);
    border: 1px solid ${branding.primaryColor || '#1a3d2e'}30;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 30px 0;
  }
  .total-label { font-size: 12px; color: #666; }
  .total-value { font-size: 32px; font-weight: 700; color: ${branding.primaryColor || '#1a3d2e'}; }
  .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
  .signature-box { width: 45%; }
  .signature-line { border-bottom: 1px solid #333; margin-bottom: 8px; height: 40px; }
  .signature-label { font-size: 11px; color: #666; }
  .footer { 
    position: fixed; 
    bottom: 2cm; 
    left: 2cm; 
    right: 2cm; 
    text-align: center; 
    font-size: 10px; 
    color: #999; 
  }
  .client-info-box {
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
  }
  .date-line { text-align: right; margin-bottom: 20px; color: #666; }
`;

/**
 * Generate watermark HTML based on company branding
 * Uses company logo if available, otherwise neutral text watermark
 * NEVER uses ARKELIUM branding
 */
const getWatermarkHtml = (company: CompanyProfile, branding: CompanyBranding) => {
  if (branding.logoUrl) {
    return `
      <div class="watermark">
        <img src="${branding.logoUrl}" alt="" />
      </div>
    `;
  }
  // Neutral watermark with company name (no ARKELIUM branding)
  return `
    <div class="watermark">
      <div class="watermark-text">${company.companyName || ''}</div>
    </div>
  `;
};

/**
 * Generate header HTML with company logo and info
 * Uses CLIENT COMPANY branding (from company settings)
 */
const getHeaderHtml = (company: CompanyProfile, branding: CompanyBranding) => `
  <div class="header">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" class="logo" alt="${company.companyName}" />` : ''}
    <div class="company-name">${company.companyName || 'Company Name'}</div>
    <div class="company-info">
      ${company.address ? `${company.address}, ` : ''}${company.city || ''}, ${company.province || ''} ${company.postalCode || ''}<br>
      ${company.phone ? `${company.phone} | ` : ''}${company.email || ''}
    </div>
  </div>
`;

/**
 * Ontario Cleaning Agreement Legal Clauses
 * Standard legal template for cleaning service contracts
 */
const getOntarioCleaningAgreementClauses = (company: CompanyProfile, language: 'en' | 'fr' = 'en') => {
  if (language === 'fr') {
    return `
      <div class="section-title">1. Portée des Services</div>
      <div class="clause">
        <div class="clause-text">${company.companyName} ("Fournisseur") s'engage à effectuer des services de nettoyage réguliers à la propriété du Client. Les services comprennent l'aspiration, le lavage des sols, le dépoussiérage, la désinfection des salles de bains, le nettoyage des appareils de cuisine et l'enlèvement des déchets, conformément à une liste de contrôle de nettoyage standard. Des services supplémentaires peuvent être fournis sur accord mutuel et peuvent entraîner des frais supplémentaires.</div>
      </div>

      <div class="section-title">2. Durée</div>
      <div class="clause">
        <div class="clause-text">Chaque session est réservée individuellement. Aucune obligation contractuelle à long terme n'est requise.</div>
      </div>

      <div class="section-title">3. Paiement</div>
      <div class="clause">
        <div class="clause-text">Le paiement complet est dû à la fin de chaque service. Méthodes acceptées: Espèces, Carte de crédit, Virement électronique. La TPS/TVH s'applique.</div>
      </div>

      <div class="section-title">4. Produits de Nettoyage</div>
      <div class="clause">
        <div class="clause-text">Le Client doit fournir les produits de nettoyage sauf accord contraire. Des frais supplémentaires s'appliquent si le Fournisseur apporte les produits.</div>
      </div>

      <div class="section-title">5. Annulation et Report</div>
      <div class="clause">
        <div class="clause-text">Les annulations doivent être effectuées avec un préavis d'au moins 48 heures ouvrables pour éviter des frais de 50$. Des exceptions peuvent être accordées à la discrétion du Fournisseur.</div>
      </div>

      <div class="section-title">6. Rendez-vous Manqués</div>
      <div class="clause">
        <div class="clause-text">Les clients ont droit à trois (3) annulations de dernière minute ou absences par an sans pénalité. Après la troisième occurrence, des frais de 50$ seront facturés par instance.</div>
      </div>

      <div class="section-title">7. Animaux et Enfants</div>
      <div class="clause">
        <div class="clause-text">Les animaux doivent être sécurisés et les enfants tenus à l'écart pendant le nettoyage pour des raisons de sécurité et d'efficacité.</div>
      </div>

      <div class="section-title">8. Services Publics</div>
      <div class="clause">
        <div class="clause-text">Le Client doit assurer l'accès à l'électricité et à l'eau courante. En cas d'indisponibilité, des frais d'annulation peuvent s'appliquer.</div>
      </div>

      <div class="section-title">9. Accès à la Propriété</div>
      <div class="clause">
        <div class="clause-text">Le Client est responsable de fournir un accès en temps opportun (clés, codes, alarmes). En cas d'échec, 50% des frais du service prévu seront facturés.</div>
      </div>

      <div class="section-title">10. Assurance</div>
      <div class="clause">
        <div class="clause-text">Le Fournisseur détient une assurance responsabilité civile générale de 1 million de dollars. Preuve disponible sur demande. Les réclamations frauduleuses seront poursuivies légalement.</div>
      </div>

      <div class="section-title">11. Garantie de Satisfaction</div>
      <div class="clause">
        <div class="clause-text">Les préoccupations doivent être signalées dans les 24 heures avec des preuves photo/vidéo. Un nouveau nettoyage peut être offert. Aucun remboursement n'est émis.</div>
      </div>

      <div class="section-title">12. Politique de Bris</div>
      <div class="clause">
        <div class="clause-text">Le Fournisseur n'est pas responsable des articles instables ou mal fixés. Les dommages doivent être signalés dans les 24 heures.</div>
      </div>

      <div class="section-title">13. Fenêtre d'Arrivée</div>
      <div class="clause">
        <div class="clause-text">Le service peut avoir lieu dans une fenêtre de 60 minutes en raison de conditions externes.</div>
      </div>

      <div class="section-title">14. Résiliation</div>
      <div class="clause">
        <div class="clause-text">Chaque partie peut résilier ce Contrat avec un préavis écrit de 15 jours.</div>
      </div>

      <div class="section-title">15. Non-Sollicitation</div>
      <div class="clause">
        <div class="clause-text">Le Client s'engage à ne pas embaucher le personnel actuel ou ancien du Fournisseur pendant 6 mois après la dernière session. La violation entraîne des frais de 3 000$.</div>
      </div>

      <div class="section-title">16. Consentement Médiatique</div>
      <div class="clause">
        <div class="clause-text">Des photos/vidéos peuvent être prises avant et après le nettoyage à des fins promotionnelles. Les articles personnels et sensibles seront exclus.</div>
      </div>

      <div class="section-title">17. Responsabilités de l'Entreprise</div>
      <div class="clause">
        <div class="clause-text">Le Fournisseur s'engage à effectuer les services avec soin raisonnable, professionnalisme et transparence; protéger la propriété et la vie privée; répondre aux plaintes dans les 2 jours ouvrables; maintenir l'assurance; et se conformer à la Loi sur la protection du consommateur de 2002 (Ontario).</div>
      </div>

      <div class="section-title">18. Reconnaissance du Client</div>
      <div class="clause">
        <div class="clause-text">En planifiant une session de nettoyage, le Client confirme avoir lu et accepté les termes de ce Contrat.</div>
      </div>
    `;
  }

  return `
    <div class="section-title">1. Scope of Services</div>
    <div class="clause">
      <div class="clause-text">${company.companyName} ("Provider") agrees to perform routine cleaning services at the Client's property. Services include vacuuming, mopping, dusting, disinfecting bathrooms, cleaning kitchen appliances, and removing garbage, in accordance with a standard cleaning checklist. Additional services may be provided upon mutual agreement and may incur additional charges.</div>
    </div>

    <div class="section-title">2. Term</div>
    <div class="clause">
      <div class="clause-text">Each session is booked individually. No long-term contractual obligation is required.</div>
    </div>

    <div class="section-title">3. Payment</div>
    <div class="clause">
      <div class="clause-text">Full payment is due at the end of each service. Accepted methods: Cash, Credit Card, E-transfer. HST applies.</div>
    </div>

    <div class="section-title">4. Cleaning Supplies</div>
    <div class="clause">
      <div class="clause-text">The Client shall provide cleaning supplies unless agreed otherwise. An additional charge applies if the Provider brings supplies.</div>
    </div>

    <div class="section-title">5. Cancellation and Rescheduling</div>
    <div class="clause">
      <div class="clause-text">Cancellations must be made with at least 48 business hours' notice to avoid a $50 fee. Exceptions may be granted at the Provider's discretion.</div>
    </div>

    <div class="section-title">6. Missed Appointments and Last-Minute Cancellations</div>
    <div class="clause">
      <div class="clause-text">Clients are allowed up to three (3) last-minute cancellations or no-shows per year period without penalty. After the third occurrence, a $50 fee will be charged per instance.</div>
    </div>

    <div class="section-title">7. Pets and Children</div>
    <div class="clause">
      <div class="clause-text">Pets must be secured, and children kept away during cleaning for safety and efficiency.</div>
    </div>

    <div class="section-title">8. Utilities</div>
    <div class="clause">
      <div class="clause-text">Client must ensure access to electricity and running water. If unavailable, a cancellation fee may apply.</div>
    </div>

    <div class="section-title">9. Access to Property</div>
    <div class="clause">
      <div class="clause-text">Client is responsible for providing timely access (keys, codes, alarms). Failure results in a 50% fee of the scheduled service.</div>
    </div>

    <div class="section-title">10. Insurance</div>
    <div class="clause">
      <div class="clause-text">The Provider carries General Liability Insurance of $1 million. Proof available upon request. Fraudulent claims will be legally pursued.</div>
    </div>

    <div class="section-title">11. Satisfaction Guarantee</div>
    <div class="clause">
      <div class="clause-text">Concerns must be reported within 24 hours with photo/video evidence. Re-cleaning may be offered. Refunds are not issued.</div>
    </div>

    <div class="section-title">12. Breakage Policy</div>
    <div class="clause">
      <div class="clause-text">The Provider is not responsible for items that are unstable or improperly secured. Damage must be reported within 24 hours.</div>
    </div>

    <div class="section-title">13. Arrival Window</div>
    <div class="clause">
      <div class="clause-text">Service may occur within a 60-minute window due to external conditions.</div>
    </div>

    <div class="section-title">14. Termination</div>
    <div class="clause">
      <div class="clause-text">Either party may terminate this Agreement with 15 days' written notice.</div>
    </div>

    <div class="section-title">15. Non-Solicitation</div>
    <div class="clause">
      <div class="clause-text">Client agrees not to hire the Provider's current or former staff for 6 months after the last session. Violation incurs a $3,000 fee.</div>
    </div>

    <div class="section-title">16. Media Consent</div>
    <div class="clause">
      <div class="clause-text">Photos/videos may be taken before and after cleaning for promotional use. Personal and sensitive items will be excluded.</div>
    </div>

    <div class="section-title">17. Company Responsibilities to the Client</div>
    <div class="clause">
      <div class="clause-text">The Provider agrees to perform services with reasonable care, professionalism, and transparency; protect property and privacy; respond to complaints within 2 business days; maintain insurance; and comply with the Consumer Protection Act, 2002 (Ontario).</div>
    </div>

    <div class="section-title">18. Client Acknowledgement</div>
    <div class="clause">
      <div class="clause-text">By scheduling a cleaning session, the Client confirms that they have read and accepted the terms in this Agreement.</div>
    </div>
  `;
};

/**
 * Generate a contract PDF document using Ontario Cleaning Agreement template
 * Uses CLIENT COMPANY branding - NEVER ARKELIUM
 */
export const generateContractPdf = (
  data: ContractPdfData,
  company: CompanyProfile,
  branding: CompanyBranding,
  language: 'en' | 'fr' = 'en'
): string => {
  const labels = language === 'fr' ? {
    title: 'CONTRAT DE SERVICE DE NETTOYAGE',
    subtitle: '(Juridiction de l\'Ontario – Version Légalement Révisée)',
    client: 'Client',
    address: 'Adresse',
    date: 'Date',
    phone: 'Téléphone',
    email: 'Courriel',
    signature: 'Signature',
    addresses: 'INFORMATIONS DU CLIENT',
  } : {
    title: 'CLEANING AGREEMENT',
    subtitle: '(Ontario Jurisdiction – Legally Reviewed Version)',
    client: 'Client',
    address: 'Address',
    date: 'Date',
    phone: 'Phone',
    email: 'Email',
    signature: 'Signature',
    addresses: 'CLIENT INFORMATION',
  };

  const today = new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <style>${getCommonStyles(branding)}</style>
</head>
<body>
  ${getWatermarkHtml(company, branding)}
  ${getHeaderHtml(company, branding)}
  
  <h1 class="title">${labels.title}</h1>
  <p style="text-align: center; color: #666; margin-top: -15px; margin-bottom: 25px; font-size: 12px;">${labels.subtitle}</p>
  
  <div class="date-line">${labels.date}: ${today}</div>
  
  <div class="client-info-box">
    <div class="section-title" style="margin-top: 0;">${labels.addresses}</div>
    <div class="field">
      <span class="field-label">${labels.client}:</span>
      <span class="field-value"><strong>${data.clientName}</strong></span>
    </div>
    <div class="field">
      <span class="field-label">${labels.address}:</span>
      <span class="field-value">${data.clientAddress || data.serviceLocation}</span>
    </div>
    ${data.clientPhone ? `<div class="field"><span class="field-label">${labels.phone}:</span><span class="field-value">${data.clientPhone}</span></div>` : ''}
    ${data.clientEmail ? `<div class="field"><span class="field-label">${labels.email}:</span><span class="field-value">${data.clientEmail}</span></div>` : ''}
  </div>
  
  ${getOntarioCleaningAgreementClauses(company, language)}
  
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">${company.companyName} Representative</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">${labels.client} ${labels.signature}</div>
    </div>
  </div>
  
  <div class="footer">
    Contract #${data.contractId} | Generated on ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
  `;

  return html;
};

/**
 * Generate an estimate PDF document
 * Uses CLIENT COMPANY branding - NEVER ARKELIUM
 */
export const generateEstimatePdf = (
  data: EstimatePdfData,
  company: CompanyProfile,
  branding: CompanyBranding,
  language: 'en' | 'fr' = 'en'
): string => {
  const labels = language === 'fr' ? {
    title: 'DEVIS DE SERVICE',
    validUntil: 'Valide jusqu\'au',
  } : {
    title: 'SERVICE ESTIMATE',
    validUntil: 'Valid until',
  };

  const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <style>${getCommonStyles(branding)}</style>
</head>
<body>
  ${getWatermarkHtml(company, branding)}
  ${getHeaderHtml(company, branding)}
  
  <h1 class="title">${labels.title} #${data.estimateId}</h1>
  <p><strong>Client:</strong> ${data.clientName}</p>
  <p><strong>Service:</strong> ${data.serviceType} (${data.frequency})</p>
  <p><strong>Property:</strong> ${data.squareFootage} sq ft - ${data.roomDetails}</p>
  ${data.extras.length > 0 ? `<p><strong>Extras:</strong> ${data.extras.join(', ')}</p>` : ''}
  <div class="total-box">
    <div class="total-label">Total Estimate</div>
    <div class="total-value">$${data.totalAmount}</div>
    <div class="total-label">per visit</div>
  </div>
  <p>${labels.validUntil}: ${data.validUntil}</p>
  
  <div class="footer">
    Estimate #${data.estimateId} | Generated on ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
  `;

  return html;
};

/**
 * Generate a payroll report PDF
 * Uses CLIENT COMPANY branding - NEVER ARKELIUM
 */
export const generatePayrollReportPdf = (
  data: PayrollReportData,
  company: CompanyProfile,
  branding: CompanyBranding
): string => {
  const employeeRows = data.employees.map(emp => `
    <tr>
      <td>${emp.name}</td>
      <td>${emp.regularHours}h</td>
      <td>${emp.overtimeHours}h</td>
      <td>$${emp.grossPay.toLocaleString()}</td>
      <td>$${emp.netPay.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Outfit', sans-serif; }
    .header { text-align: center; color: ${branding.primaryColor || '#1a3d2e'}; margin-bottom: 30px; }
    .header img { max-width: 150px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
    th { background: ${branding.primaryColor || '#1a3d2e'}; color: white; }
    .total-row { background: #f5f5f5; font-weight: bold; }
    .watermark { 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%);
      opacity: 0.05;
      z-index: -1;
    }
    .watermark img { max-width: 350px; }
  </style>
</head>
<body>
  ${branding.logoUrl ? `<div class="watermark"><img src="${branding.logoUrl}" alt="" /></div>` : ''}
  <div class="header">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${company.companyName}" />` : ''}
    <h1>${company.companyName}</h1>
    <h2>Payroll Report</h2>
    <p>${data.periodStart} - ${data.periodEnd} | Province: ${data.province}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Regular Hours</th>
        <th>Overtime</th>
        <th>Gross Pay</th>
        <th>Net Pay</th>
      </tr>
    </thead>
    <tbody>
      ${employeeRows}
      <tr class="total-row">
        <td>TOTALS</td>
        <td>${data.totals.hours}h</td>
        <td>-</td>
        <td>$${data.totals.gross.toLocaleString()}</td>
        <td>$${data.totals.net.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
  `;

  return html;
};

/**
 * Open PDF in a new window for printing/saving
 */
export const openPdfPreview = (htmlContent: string, filename: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = filename;
  }
};

/**
 * Export data to CSV format
 */
export const exportToCsv = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const strValue = String(value ?? '');
      return strValue.includes(',') ? `"${strValue.replace(/"/g, '""')}"` : strValue;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
