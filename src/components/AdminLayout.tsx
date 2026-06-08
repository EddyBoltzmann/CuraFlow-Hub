/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CMSArticle, AppUser, FAQ, Announcement, AuditLog, HealthLog, AppointmentBooking, AhomkaEntry 
} from '../types';
import { jsPDF } from 'jspdf';
import { 
  Activity, Users, FileText, HelpCircle, Bell, Settings, Plus, Trash2, 
  Check, ShieldAlert, Sparkles, AlertTriangle, Play, Info, EyeOff, Layout, Globe, Server, Download, RefreshCw, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

interface AdminLayoutProps {
  session: AppUser;
  users: AppUser[];
  loggedInUserIds: string[];
  onSimulateTokenRefresh?: () => void;
  articles: CMSArticle[];
  faqs: FAQ[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  logs: HealthLog[];
  bookings: AppointmentBooking[];
  ahomkaEntries: AhomkaEntry[];
  onAddArticle: (title: string, category: string, summary: string, author: string, content: string, bannerUrl?: string) => void;
  onArchiveArticle: (id: string, isArchived: boolean) => void;
  onModifyUserStatus: (id: string, isSuspended: boolean) => void;
  onVerifyClinician: (id: string) => void;
  onAddFAQ: (question: string, answer: string, category: string) => void;
  onDeployAnnouncement: (title: string, content: string, targetRole: 'all' | 'patient' | 'provider') => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onBroadcastPlatformNotification: (text: string) => void;
  onAddUser?: (user: AppUser) => void;
  onDeleteUser?: (id: string) => void;
}

const ENGAGEMENT_DATA_30_DAYS = [
  { date: 'May 10', activeUsers: 14, platformActions: 58 },
  { date: 'May 11', activeUsers: 15, platformActions: 72 },
  { date: 'May 12', activeUsers: 19, platformActions: 89 },
  { date: 'May 13', activeUsers: 18, platformActions: 80 },
  { date: 'May 14', activeUsers: 22, platformActions: 110 },
  { date: 'May 15', activeUsers: 25, platformActions: 142 },
  { date: 'May 16', activeUsers: 21, platformActions: 115 },
  { date: 'May 17', activeUsers: 23, platformActions: 130 },
  { date: 'May 18', activeUsers: 28, platformActions: 165 },
  { date: 'May 19', activeUsers: 30, platformActions: 190 },
  { date: 'May 20', activeUsers: 35, platformActions: 240 },
  { date: 'May 21', activeUsers: 32, platformActions: 210 },
  { date: 'May 22', activeUsers: 34, platformActions: 225 },
  { date: 'May 23', activeUsers: 39, platformActions: 280 },
  { date: 'May 24', activeUsers: 42, platformActions: 310 },
  { date: 'May 25', activeUsers: 38, platformActions: 275 },
  { date: 'May 26', activeUsers: 45, platformActions: 340 },
  { date: 'May 27', activeUsers: 48, platformActions: 385 },
  { date: 'May 28', activeUsers: 50, platformActions: 420 },
  { date: 'May 29', activeUsers: 47, platformActions: 390 },
  { date: 'May 30', activeUsers: 52, platformActions: 440 },
  { date: 'May 31', activeUsers: 55, platformActions: 490 },
  { date: 'Jun 01', activeUsers: 58, platformActions: 520 },
  { date: 'Jun 02', activeUsers: 54, platformActions: 480 },
  { date: 'Jun 03', activeUsers: 60, platformActions: 550 },
  { date: 'Jun 04', activeUsers: 63, platformActions: 590 },
  { date: 'Jun 05', activeUsers: 66, platformActions: 640 },
  { date: 'Jun 06', activeUsers: 62, platformActions: 580 },
  { date: 'Jun 07', activeUsers: 70, platformActions: 690 },
  { date: 'Jun 08', activeUsers: 74, platformActions: 735 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white rounded-xl p-3 shadow-2xl space-y-1.5 text-left border-l-4 border-l-indigo-600 font-sans min-w-[170px]">
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
          {label}
        </div>
        <div className="space-y-1 text-xs">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-350 font-medium" style={{ color: item.color }}>
                {item.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminLayout({
  session, users, loggedInUserIds, onSimulateTokenRefresh, articles, faqs, announcements, auditLogs, logs, bookings, ahomkaEntries,
  onAddArticle, onArchiveArticle, onModifyUserStatus, onVerifyClinician,
  onAddFAQ, onDeployAnnouncement, onTriggerToast, onBroadcastPlatformNotification,
  onAddUser, onDeleteUser
}: AdminLayoutProps) {
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [timeRange, setTimeRange] = useState<'30' | '15' | '7'>('30');
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AppUser | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'normal' | 'high-risk'>('all');

  const filteredLogs = logs.filter(log => {
    if (alertFilter === 'high-risk') return log.isHighRisk === true;
    if (alertFilter === 'normal') return log.isHighRisk === false || !log.isHighRisk;
    return true;
  });

  // Super Admin provisioning panel input states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'provider' | 'patient'>('admin');

  const handleAdminAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      onTriggerToast('Please complete all credential fields.', 'error');
      return;
    }
    const duplicated = users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase());
    if (duplicated) {
      onTriggerToast('An account is already linked to this email address.', 'error');
      return;
    }

    const brandNewUser: AppUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      status: 'Active',
      verified: true,
      password: newUserPassword.trim(),
      avatar: newUserRole === 'patient' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
        : newUserRole === 'provider'
          ? 'https://images.unsplash.com/photo-1622253692010-333f2da6531d?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    };

    if (onAddUser) {
      onAddUser(brandNewUser);
      onTriggerToast(`Successfully provisioned new ${newUserRole} account: ${newUserName}`, 'success');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('admin');
    }
  };

  // Patient selecting for downloading clinical summary logs
  const patients = users.filter(u => u.role === 'patient');
  const [selectedDownloadPatientId, setSelectedDownloadPatientId] = useState<string>(patients[0]?.id || '');

  // Sliced user engagement and activity metrics
  const slicedData = ENGAGEMENT_DATA_30_DAYS.slice(-parseInt(timeRange));
  const totalActions = slicedData.reduce((acc, curr) => acc + curr.platformActions, 0);
  const peakUsers = Math.max(...slicedData.map(d => d.activeUsers), 0);
  const avgUsers = slicedData.length > 0 
    ? Math.round(slicedData.reduce((acc, curr) => acc + curr.activeUsers, 0) / slicedData.length) 
    : 0;

  const handleDownloadHealthSummary = () => {
    const selectedPat = users.find(u => u.id === selectedDownloadPatientId);
    if (!selectedPat) {
      onTriggerToast('Please select an active patient first.', 'error');
      return;
    }

    const doc = new jsPDF();
    
    // Theme Colors
    const primaryColorHex = '#4F46E5'; 
    const textColorHex = '#1E293B';    

    // Title Banner Background Rect (Indigo banner styling)
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("GAP PATIENT CLINICAL SUMMARY", 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("SECURE AUTOMATED TELEMETRY & CAREGIVER CONSULTATION SUMMARY", 14, 26);
    doc.text(`DATE GENERATED: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} (UTC)`, 14, 32);

    let y = 56;

    // SECTION I: Demographics & Profiles
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("I. PATIENT CLINICAL IDENTITY PROFILE", 14, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    
    // Grid structure
    // Row 1
    doc.setFont("helvetica", "bold");
    doc.text("Full Client Name:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedPat.name || "N/A", 48, y);
    
    doc.setFont("helvetica", "bold");
    doc.text("Insurance Carrier:", 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedPat.insuranceProvider || "N/A", 146, y);

    y += 6;

    // Row 2
    doc.setFont("helvetica", "bold");
    doc.text("Registry Account Email:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedPat.email || "N/A", 52, y);

    doc.setFont("helvetica", "bold");
    doc.text("Insurance Member ID:", 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedPat.insuranceMemberId || "No mapping", 150, y);

    y += 6;

    // Row 3
    doc.setFont("helvetica", "bold");
    doc.text("Primary Contact Priority:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedPat.emergencyContactName || "N/A"} (${selectedPat.emergencyContactRelation || "N/A"})`, 54, y);

    doc.setFont("helvetica", "bold");
    doc.text("Insurance Group ID:", 110, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedPat.insuranceGroupId || "No mapping", 148, y);

    y += 6;

    // Row 4
    doc.setFont("helvetica", "bold");
    doc.text("Emergency Action Tel:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(selectedPat.emergencyContactPhone || "N/A", 52, y);

    doc.setFont("helvetica", "bold");
    doc.text("Registered Residence:", 110, y);
    doc.setFont("helvetica", "normal");
    const fullAddressString = `${selectedPat.addressStreet || ""}, ${selectedPat.addressCity || ""}, ${selectedPat.addressState || ""} ${selectedPat.addressZip || ""}`.trim();
    doc.text(fullAddressString || "Not mapped", 150, y);

    y += 18;

    // SECTION II: Biometrics Table
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("II. CHRONOLOGICAL BIOMETRIC LOGS HISTORY", 14, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 8;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    
    // Header block
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Timestamp Date", 16, y + 4);
    doc.text("Metric Measured", 55, y + 4);
    doc.text("Reported Value", 110, y + 4);
    doc.text("Alert Threshold Status", 146, y + 4);
    y += 6;

    doc.setFont("helvetica", "normal");
    
    if (logs.length === 0) {
      doc.text("Null telemetry logs submitted.", 16, y + 6);
      y += 12;
    } else {
      logs.forEach((log) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 6, 'F');
          doc.setFont("helvetica", "bold");
          doc.text("Timestamp Date", 16, y + 4);
          doc.text("Metric Measured", 55, y + 4);
          doc.text("Reported Value", 110, y + 4);
          doc.text("Alert Threshold Status", 146, y + 4);
          y += 6;
          doc.setFont("helvetica", "normal");
        }
        
        doc.text(log.timestamp || "N/A", 16, y + 4);
        doc.text(log.metric || "N/A", 55, y + 4);
        doc.text(log.value || "N/A", 110, y + 4);
        doc.text(log.isHighRisk ? "🚨 CLINICAL ALARM (HIGH RISK)" : "✓ STABLE IN-RANGE", 146, y + 4);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 5.5, 196, y + 5.5);
        y += 6;
      });
      y += 6;
    }

    // SECTION III: Consultations History
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("III. CAREGIVER ENCOUNTERS & CONSULTATION BOOKINGS", 14, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);

    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Scheduled Date/Time", 16, y + 4);
    doc.text("Clinician Care Specialist", 62, y + 4);
    doc.text("Modal Channel", 120, y + 4);
    doc.text("Encounter Status", 156, y + 4);
    y += 6;

    doc.setFont("helvetica", "normal");

    if (bookings.length === 0) {
      doc.text("No encounters active on client timeline.", 16, y + 6);
      y += 12;
    } else {
      bookings.forEach((booking) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 6, 'F');
          doc.setFont("helvetica", "bold");
          doc.text("Scheduled Date/Time", 16, y + 4);
          doc.text("Clinician Care Specialist", 62, y + 4);
          doc.text("Modal Channel", 120, y + 4);
          doc.text("Encounter Status", 156, y + 4);
          y += 6;
          doc.setFont("helvetica", "normal");
        }

        doc.text(booking.dateTime || "N/A", 16, y + 4);
        doc.text(`${booking.providerName || "Jenkins"} (${booking.specialty || "Care"})`, 62, y + 4);
        doc.text(booking.mode || "Video", 120, y + 4);
        doc.text(booking.status || "Completed", 156, y + 4);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 5.5, 196, y + 5.5);
        y += 6;
      });
      y += 6;
    }

    // Footnote compliance banner on fresh page or bottom spacing
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 8;
    doc.setFillColor(254, 242, 242); 
    doc.setDrawColor(239, 68, 68);
    doc.rect(14, y, 182, 20, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text("HIPAA TRANSCRIPTION COMPLIANCE & PRIVACY NOTICE:", 18, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("This data export document contains highly confidential Patient Protected Health Information (PHI) under federal guidance.", 18, y + 10);
    doc.text("Authorized admin downloads are permanently logged with audit trail reference. Unauthorized reproduction is strictly forbidden.", 18, y + 14);

    doc.save(`clinical_outcome_summary_${selectedPat.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`);
    onTriggerToast(`Health Summary PDF generated successfully for patient ${selectedPat.name}!`, 'success');
  };

  const handleExportToCSV = () => {
    const selectedPat = users.find(u => u.id === selectedDownloadPatientId);
    if (!selectedPat) {
      onTriggerToast('Please select an active patient first.', 'error');
      return;
    }

    // Filter Ahomka entries for this specific patient
    const patientEntries = ahomkaEntries.filter(entry => 
      entry.patientId === selectedPat.id || (!entry.patientId && selectedPat.id === 'usr-1')
    );

    // Calculate Average Systolic, Diastolic & Pulse
    const bpEntries = patientEntries.filter(e => e.systolic !== undefined && e.diastolic !== undefined);
    const pulseEntries = patientEntries.filter(e => e.pulse !== undefined);

    const avgSystolic = bpEntries.length > 0 
      ? Math.round(bpEntries.reduce((acc, curr) => acc + (curr.systolic || 0), 0) / bpEntries.length) 
      : null;
    const avgDiastolic = bpEntries.length > 0
      ? Math.round(bpEntries.reduce((acc, curr) => acc + (curr.diastolic || 0), 0) / bpEntries.length)
      : null;
    const avgPulse = pulseEntries.length > 0
      ? Math.round(pulseEntries.reduce((acc, curr) => acc + (curr.pulse || 0), 0) / pulseEntries.length)
      : null;

    const avgBpStr = (avgSystolic && avgDiastolic) ? `${avgSystolic}/${avgDiastolic}` : 'N/A';
    const avgPulseStr = avgPulse ? `${avgPulse}` : 'N/A';

    // Define headers exactly as requested
    const headers = ["Patient Name", "Email", "Average Blood Pressure (mmHg)", "Average Pulse Rate (bpm)"];
    
    // Format rows
    const csvRows = [
      headers.join(','), // Header row
      [
        `"${selectedPat.name.replace(/"/g, '""')}"`,
        `"${selectedPat.email.replace(/"/g, '""')}"`,
        `"${avgBpStr}"`,
        `"${avgPulseStr}"`
      ].join(',')
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `patient_summary_${selectedPat.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onTriggerToast(`CSV Clinical Metrics Summary exported for ${selectedPat.name}!`, 'success');
  };

  const handleExportAllPatientsToCSV = () => {
    if (patients.length === 0) {
      onTriggerToast('No registered patients found.', 'error');
      return;
    }

    const headers = ["Patient Name", "Email", "Average Blood Pressure (mmHg)", "Average Pulse Rate (bpm)", "Total Records Logged"];
    
    const rows = patients.map(pat => {
      const patientEntries = ahomkaEntries.filter(entry => 
        entry.patientId === pat.id || (!entry.patientId && pat.id === 'usr-1')
      );

      const bpEntries = patientEntries.filter(e => e.systolic !== undefined && e.diastolic !== undefined);
      const pulseEntries = patientEntries.filter(e => e.pulse !== undefined);

      const avgSystolic = bpEntries.length > 0 
        ? Math.round(bpEntries.reduce((acc, curr) => acc + (curr.systolic || 0), 0) / bpEntries.length) 
        : null;
      const avgDiastolic = bpEntries.length > 0
        ? Math.round(bpEntries.reduce((acc, curr) => acc + (curr.diastolic || 0), 0) / bpEntries.length)
        : null;
      const avgPulse = pulseEntries.length > 0
        ? Math.round(pulseEntries.reduce((acc, curr) => acc + (curr.pulse || 0), 0) / pulseEntries.length)
        : null;

      const avgBpStr = (avgSystolic && avgDiastolic) ? `${avgSystolic}/${avgDiastolic}` : 'N/A';
      const avgPulseStr = avgPulse ? `${avgPulse}` : 'N/A';

      return [
        `"${pat.name.replace(/"/g, '""')}"`,
        `"${pat.email.replace(/"/g, '""')}"`,
        `"${avgBpStr}"`,
        `"${avgPulseStr}"`,
        patientEntries.length
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "all_patients_clinical_vitals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onTriggerToast(`Full Patient Registry CSV populated with clinical outcome averages exported!`, 'success');
  };

  // CMS Article Builder Form state
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('Sleep');
  const [artSummary, setArtSummary] = useState('');
  const [artAuthor, setArtAuthor] = useState('Clinical Editorial Group');
  const [artContent, setArtContent] = useState('');
  const [artBanner, setArtBanner] = useState('');

  // FAQs Form state
  const [faqQuestion, setFAQQuestion] = useState('');
  const [faqAnswer, setFAQAnswer] = useState('');
  const [faqCategory, setFAQCategory] = useState('General');

  // Announcements state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState<'all' | 'patient' | 'provider'>('all');

  // Broadcast notification state
  const [broadcastText, setBroadcastText] = useState('');

  // General Settings
  const [auditLogLevel, setAuditLogLevel] = useState('Verbose Clinical Auditing');

  // Actions
  const handleArticlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim() || !artContent.trim()) {
      onTriggerToast('Provide title and article context', 'error');
      return;
    }
    const defaultBanner = artBanner.trim() || 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80';
    onAddArticle(artTitle.trim(), artCategory, artSummary.trim() || 'Medical review bulletin', artAuthor.trim(), artContent.trim(), defaultBanner);
    
    // Clear
    setArtTitle('');
    setArtSummary('');
    setArtContent('');
    setArtBanner('');
    onTriggerToast('Educational medical journal published to live registry!', 'success');
  };

  const handleFAQPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    onAddFAQ(faqQuestion.trim(), faqAnswer.trim(), faqCategory);
    setFAQQuestion('');
    setFAQAnswer('');
    onTriggerToast('Security FAQ published successfully', 'success');
  };

  const handleAnnouncementPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    onDeployAnnouncement(annTitle.trim(), annContent.trim(), annTarget);
    setAnnTitle('');
    setAnnContent('');
    onTriggerToast(`Announcement targeted to "${annTarget}" published!`, 'success');
  };

  const handleTransmitBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onBroadcastPlatformNotification(broadcastText.trim());
    setBroadcastText('');
    onTriggerToast('Emergency notice broadcasted to all active portals!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      
      {/* Admin navigation rails sidebar */}
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r bg-white dark:bg-slate-900 p-4 space-y-1.5 flex md:flex-col shrink-0">
        <div className="w-full space-y-1">
          <button 
            id="tab-adm-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Admin Metrics console</span>
          </button>
          
          <button 
            id="tab-adm-users"
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            <span>Users Registry</span>
          </button>

          <button 
            id="tab-adm-cms"
            onClick={() => setActiveTab('cms')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'cms' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4" />
            <span>Articles Publisher</span>
          </button>

          <button 
            id="tab-adm-broadcaster"
            onClick={() => setActiveTab('broadcaster')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'broadcaster' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Bell className="w-4 h-4" />
            <span>Broadcaster Desk</span>
          </button>

          <button 
            id="tab-adm-faq"
            onClick={() => setActiveTab('faq')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'faq' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ Composer</span>
          </button>

          <button 
            id="tab-adm-auditing"
            onClick={() => setActiveTab('auditing')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'auditing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Globe className="w-4 h-4" />
            <span>Audit Diagnostics</span>
          </button>
        </div>
      </aside>

      {/* Admin tabs rendering viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100">
        
        {/* TAB 1: Admin Performance KPIs & Telemetry charts */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            <div className="bg-[#1E1B4B] text-indigo-100 rounded-2xl shadow-xl p-6 border border-indigo-900/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 w-48">
                <Layout className="w-full h-full text-indigo-50" />
              </div>
              <div className="relative">
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Super Administrator Terminal</span>
                <h2 className="font-display text-xl font-bold mt-2.5">Platform Operations Telemetry Controls</h2>
                <p className="text-xs text-indigo-300 mt-1">Audit active registration lists, license credential verifications, and deploy system-wide broadcasts.</p>
              </div>
            </div>

            {/* Platform statistics widgets grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Active Users</p>
                <p className="text-2xl font-black mt-1 text-slate-950 dark:text-white">{users.length}</p>
                <div className="text-[9px] text-green-500 font-bold bg-green-50 px-1.5 py-0.5 rounded mt-2 inline-block">100% HIPAA Integrity</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinician Licences</p>
                <p className="text-2xl font-black mt-1 text-slate-950 dark:text-white">
                  {users.filter(u => u.role === 'provider').length}
                </p>
                <div className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded mt-2 inline-block">Licenses audited</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CMS articles published</p>
                <p className="text-2xl font-black mt-1 text-slate-950 dark:text-white">{articles.length}</p>
                <div className="text-[9px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded mt-2 inline-block">Journal guides</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">API Workload Standing</p>
                <p className="text-2xl font-black mt-1 text-slate-950 dark:text-white">99.9%</p>
                <div className="text-[9px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">Zero Outages</div>
              </div>

            </div>

            {/* User Engagement & Platform Activity Line Chart Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>User Engagement & Daily Platform Activity Trends</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Visual telemetry analyzing user sessions, encrypted transaction workloads, and daily HIPAA logs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Window:</span>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 py-1.5 px-3 rounded-xl text-[11px] font-bold text-slate-850 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="30">Last 30 Days</option>
                    <option value="15">Last 15 Days</option>
                    <option value="7">Last 7 Days</option>
                  </select>
                </div>
              </div>

              {/* Mini KPIs Grid customized to the range */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Accumulated Actions</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{totalActions.toLocaleString()}</p>
                  <span className="text-[9px] text-indigo-505 dark:text-indigo-400 font-semibold block">HIPAA audits logged</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Peak Daily Users</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{peakUsers}</p>
                  <span className="text-[9px] text-green-505 dark:text-green-400 font-semibold block">Concurrent session keys</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Average Active Users</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{avgUsers}</p>
                  <span className="text-[9px] text-emerald-505 dark:text-emerald-400 font-semibold block">Rolling active standard</span>
                </div>
              </div>

              {/* The Recharts Line Chart */}
              <div className="w-full h-[260px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={slicedData}
                    margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={9} 
                      stroke="#94a3b8" 
                      tickLine={false}
                      axisLine={false} 
                    />
                    <YAxis 
                      fontSize={9} 
                      stroke="#94a3b8" 
                      tickLine={false}
                      axisLine={false} 
                      yAxisId="left"
                    />
                    <YAxis 
                      fontSize={9} 
                      stroke="#94a3b8" 
                      tickLine={false}
                      axisLine={false} 
                      yAxisId="right"
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} 
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      name="Active Users"
                      dataKey="activeUsers"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 2, strokeWidth: 1.5 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      name="Platform Actions"
                      dataKey="platformActions"
                      stroke="#0ea5e9"
                      strokeWidth={2.5}
                      dot={{ r: 2, strokeWidth: 1.5 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grid for Parameters Tuning and Patient/Provider Donuts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Platform Security Parameters Tuning */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Platform Security Parameters Tuning</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Configure real-time system diagnostics logging levels</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Administrative logging levels</label>
                    <select 
                      value={auditLogLevel}
                      onChange={(e) => {
                        setAuditLogLevel(e.target.value);
                        onTriggerToast(`Log level shifted to: ${e.target.value}`);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="Verbose Clinical Auditing" className="text-slate-900">Verbose HIPAA Clinical Audits (Recommended)</option>
                      <option value="Standard Operations Diagnostics" className="text-slate-900">Standard Platform Diagnostics</option>
                      <option value="Essential Security Failures" className="text-slate-900">Emergency Errors Only</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-400 flex items-center gap-1.5 mt-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>HIPAA Compliance Level: Active Encryption Enabled</span>
                </div>
              </div>

              {/* Right Column: User breakdown donut chart */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>User Directory Breakdown</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Proportional analysis of active patient portfolios versus registered providers.
                  </p>
                </div>

                {/* Donut chart widget */}
                <div className="h-[180px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const patientsCount = users.filter(u => u.role === 'patient').length;
                          const providersCount = users.filter(u => u.role === 'provider').length;
                          const totalCount = patientsCount + providersCount;
                          return totalCount > 0 
                            ? [
                                { name: 'Patients', value: patientsCount },
                                { name: 'Providers', value: providersCount }
                              ]
                            : [
                                { name: 'Awaiting Patients', value: 1 },
                                { name: 'Awaiting Providers', value: 1 }
                              ];
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(() => {
                          const patientsCount = users.filter(u => u.role === 'patient').length;
                          const providersCount = users.filter(u => u.role === 'provider').length;
                          const totalCount = patientsCount + providersCount;
                          const COLORS = totalCount > 0 ? ['#6366f1', '#10b981'] : ['#cbd5e1', '#e2e8f0'];
                          return COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ));
                        })()}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E1B4B', 
                          border: 'none', 
                          borderRadius: '8px', 
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={32} 
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10.5px', fontWeight: 'bold' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered label inside donut hole */}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Total</span>
                    <span className="text-[17px] font-black text-slate-900 dark:text-white">
                      {users.filter(u => u.role === 'patient' || u.role === 'provider').length}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Real-Time Biometric Clinical Alert Logs Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                    <span>Real-Time Biometric Clinical Alert Logs</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Active system-wide electronic sensor diaries filtered by custom severity limits.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Risk Severity:</span>
                  <select
                    value={alertFilter}
                    onChange={(e) => setAlertFilter(e.target.value as 'all' | 'normal' | 'high-risk')}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Logs ({logs.length})</option>
                    <option value="normal">Normal ({logs.filter(l => !l.isHighRisk).length})</option>
                    <option value="high-risk">High-Risk ({logs.filter(l => l.isHighRisk).length})</option>
                  </select>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-[11px] font-semibold">No telemetry alert logs matching current filter standard.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-2.5">Timeline</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Recorded Value</th>
                        <th className="px-4 py-2.5">Trend Vector</th>
                        <th className="px-4 py-2.5">Witness/Logger</th>
                        <th className="px-4 py-2.5">Annotations</th>
                        <th className="px-4 py-2.5 text-right">Clinical Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-200">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 text-slate-950 dark:text-white whitespace-nowrap font-bold text-[11px]">{log.timestamp}</td>
                          <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200">{log.metric}</td>
                          <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400">{log.value}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              log.trend === 'Elevated' 
                                ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/25 dark:text-orange-400' 
                                : log.trend === 'Decline' 
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400'
                                  : 'bg-green-50 text-green-700 dark:bg-green-950/25 dark:text-green-400'
                            }`}>
                              {log.trend}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 dark:text-slate-400 text-[11px]">{log.verifiedBy}</td>
                          <td className="px-4 py-3 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-350" title={log.notes}>{log.notes || 'No notes.'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              log.isHighRisk 
                                ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400' 
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-green-400'
                            }`}>
                              {log.isHighRisk ? '🚨 High-Risk' : '✓ Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Download Patient Health Summary Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-4 animate-fade-in">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Download Patient Clinician Summary</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Select any registered patient below to compile and download their comprehensive historical biometrics and tele-care encounters report.</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label id="selected-download-patient-label" className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Select Targeted Patient</label>
                  <select 
                    id="patient-select-download"
                    value={selectedDownloadPatientId}
                    onChange={(e) => setSelectedDownloadPatientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id} className="text-slate-900">{p.name} ({p.email})</option>
                    ))}
                    {patients.length === 0 && (
                      <option value="" className="text-slate-900">No patients registered</option>
                    )}
                  </select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    id="download-health-summary-btn"
                    onClick={handleDownloadHealthSummary}
                    disabled={patients.length === 0}
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none font-sans cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generate Health Summary PDF</span>
                  </button>
                  <button 
                    id="export-health-summary-csv-btn"
                    onClick={handleExportToCSV}
                    disabled={patients.length === 0}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none font-sans cursor-pointer"
                    title="Export Selected Patient Name, Email, Average Blood Pressure, and Average Pulse Rate to CSV"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export Patient CSV</span>
                  </button>
                  <button 
                    id="export-all-patients-csv-btn"
                    onClick={handleExportAllPatientsToCSV}
                    disabled={patients.length === 0}
                    className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none font-sans cursor-pointer"
                    title="Export All Patients Clinical Outcomes Registry to CSV spreadsheet"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export All Patients CSV</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Users Registry, with suspension and pending licensing handles */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Outpatient Identity & Licensing controls</h4>
                <p className="text-[10px] text-slate-400">Approve clinician licenses, suspend or restore workspaces</p>
              </div>

              {/* Global Session Protection Terminal widget */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-xl w-full">
                <div className="space-y-1">
                  <span className="text-[9px] bg-indigo-150 dark:bg-indigo-950/40 border border-indigo-250 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                    ACTIVE SESSION PROTECTION HUB
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    Active Isolated Tunnels: <span className="font-mono text-indigo-600 dark:text-indigo-400">{loggedInUserIds.length} users active</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Cryptographic key boundaries verified under HIPAA auditing standards.
                  </p>
                </div>

                {onSimulateTokenRefresh && (
                  <button
                    onClick={onSimulateTokenRefresh}
                    className="py-1.5 px-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] hover:bg-slate-50 font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none self-start sm:self-center"
                    title="Rotate global keys for all active sessions"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-505 animate-spin" />
                    <span>Rotate Keys</span>
                  </button>
                )}
              </div>
            </div>

            {session.isSuperAdmin && (
              <div className="bg-indigo-50/30 dark:bg-slate-900/40 p-5 rounded-xl border border-indigo-150/40 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse shrink-0"></span>
                  <div className="flex flex-col">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                      Super Admin Command Center: Account/Workspace Provisioning
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Legally authorize and instantly dispatch verified credentials for other clinicians, general administrators, or outpatient profiles.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleAdminAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-205 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none py-2 px-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. j.doe@curaflow.com"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none py-2 px-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Access Password</label>
                    <input 
                      type="text"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Boltzmann_12"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none py-2 px-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Profile Role</label>
                    <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none py-2 px-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all h-[36px] shadow-xs cursor-pointer"
                    >
                      <option value="admin">Platform General Administrator</option>
                      <option value="provider">Provider / Doctor Workspace</option>
                      <option value="patient">Patient Profile</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4 flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="submit"
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Provision Staff Account</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3">Member Details</th>
                    <th className="px-6 py-3">Assigned Role</th>
                    <th className="px-6 py-3">Diagnostic Status</th>
                    <th className="px-6 py-3">Session Protection</th>
                    <th className="px-6 py-3">Licensing verification</th>
                    <th className="px-6 py-3 text-right">Administrative control handles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-300' : u.role === 'provider' ? 'bg-emerald-100 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'Active' ? 'bg-green-50 dark:bg-emerald-950/20 border border-green-200 dark:border-emerald-900 text-green-700 dark:text-emerald-400' : u.status === 'Suspended' ? 'bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-400 font-bold'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {(() => {
                          const isActive = loggedInUserIds.includes(u.id);
                          return (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-green-200 dark:border-emerald-900 text-green-700 dark:text-emerald-400 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {isActive ? 'Encrypted Active' : 'Encrypted Not Active'}
                              </span>
                              <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider pl-1 font-mono">
                                {isActive ? 'Logged In' : 'Logged Out'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-3.5">
                        {u.role === 'provider' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${u.verified ? 'bg-emerald-50 dark:bg-emerald-950/20 text-green-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-amber-700 dark:text-amber-400 animate-pulse'}`}>
                            {u.verified ? '✓ Verified Clinician' : 'Pending Verification'}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Exempt</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2 shrink-0">
                        {u.role === 'provider' && !u.verified && (
                          <button 
                            onClick={() => {
                              onVerifyClinician(u.id);
                              onTriggerToast(`Clinician license verified successfully: ${u.name}`, 'success');
                            }}
                            className="bg-emerald-600 text-white px-2.5 py-1 font-bold rounded hover:bg-emerald-700 text-[10px] transition"
                          >
                            Approve License
                          </button>
                        )}
                        
                        {u.id !== session.id && (
                          <div className="inline-flex items-center gap-2">
                            <button 
                              onClick={() => {
                                onModifyUserStatus(u.id, u.status !== 'Suspended');
                                onTriggerToast(`Identity profile state toggled: ${u.name}`, 'info');
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded transition ${u.status === 'Suspended' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-105 dark:hover:bg-red-950/30'}`}
                            >
                              {u.status === 'Suspended' ? 'Restore Workspace' : 'Suspend Account'}
                            </button>
                            <button 
                              onClick={() => {
                                setPendingDeleteUser(u);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded inline-flex items-center gap-1 transition bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/25 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete Profile</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CMS Console editor publish */}
        {activeTab === 'cms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CMS formulation */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs self-start">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2">Publish Medical Journal</h4>
              <p className="text-[10px] text-slate-400 mb-4">Populate educational content carousel available to patients</p>
                      <form onSubmit={handleArticlePublish} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Article Title</label>
                  <input 
                    id="adm-cms-title"
                    type="text" 
                    value={artTitle}
                    onChange={(e) => setArtTitle(e.target.value)}
                    placeholder="e.g. Diurnal Glycemic Sensitivity Indices"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Category Subject</label>
                    <select 
                      value={artCategory}
                      onChange={(e) => setArtCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="Sleep">Sleep Science</option>
                      <option value="Nutrition">Nutrition Planning</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Mental Health">Mental Health</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Author Credit</label>
                    <input type="text" value={artAuthor} onChange={(e) => setArtAuthor(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Banner Image URL</label>
                  <input type="text" value={artBanner} onChange={(e) => setArtBanner(e.target.value)} placeholder="Unsplash URL or default" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Brief Abstract Summary</label>
                  <textarea value={artSummary} onChange={(e) => setArtSummary(e.target.value)} rows={2} placeholder="Explain key takeaways in standard terms..." className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Journal Full Body Context</label>
                  <textarea value={artContent} onChange={(e) => setArtContent(e.target.value)} rows={4} placeholder="Full markdown medical literature context..." className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" required />
                </div>

                <button 
                  id="adm-cms-submit"
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Article</span>
                </button>
              </form>
            </div>

            {/* list console with archiving controls */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Educational Resources Directory</h4>
                <p className="text-[10px] text-slate-400">Toggle archiving to filter out stale patient guides</p>
              </div>

              <div className="space-y-3">
                {articles.map(art => (
                  <div key={art.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs transition hover:border-indigo-200">
                    <div className="space-y-1.5 max-w-md">
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-455 font-bold tracking-widest uppercase">{art.category}</span>
                      <h5 className="font-bold text-slate-900 dark:text-white leading-snug">{art.title}</h5>
                      <p className="text-slate-400 dark:text-slate-500 text-[10.5px] leading-relaxed truncate">{art.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {art.isArchived ? (
                        <span className="text-[9px] bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-bold">Archived</span>
                      ) : (
                        <span className="text-[9px] bg-green-50 dark:bg-emerald-950/20 text-green-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">Live</span>
                      )}
                      
                      <button 
                        onClick={() => {
                          onArchiveArticle(art.id, !art.isArchived);
                          onTriggerToast(`Article archive status toggled`, 'info');
                        }}
                        className={`p-1 px-3.5 rounded text-[10px] font-bold transition ${art.isArchived ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'}`}
                      >
                        {art.isArchived ? 'Activate' : 'Archive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: Broadcaster Desk emergency notifications push */}
        {activeTab === 'broadcaster' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Broadcaster deployment container */}
            <div className="bg-[#581C87] text-purple-100 rounded-2xl p-6 shadow-xl border border-purple-900/45 self-start space-y-4">
              <div>
                <h4 className="font-bold text-xs text-purple-50">Transmit Emergency Broadcast Notice</h4>
                <p className="text-[10px] text-purple-200 mt-1">Simulates pushing an instant alert warning dynamically across screens</p>
              </div>

              <form onSubmit={handleTransmitBroadcast} className="space-y-3.5">
                <textarea 
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="e.g. NOTICE: Multi-variant flu immunization schedules are now available in card divisions..."
                  className="w-full bg-purple-900/40 rounded-xl p-3 text-xs text-white border-none focus:ring-1 focus:ring-purple-300 placeholder-purple-350"
                  rows={3}
                  required
                />
                
                <button 
                  type="submit" 
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Globe className="w-4 h-4 animate-spin-slow" />
                  <span>Deploy Broadcast Notice!</span>
                </button>
              </form>
            </div>

            {/* Announcements targets lists */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-xs space-y-6">
              
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Compose Target-Role Announcements</h4>
                
                <form onSubmit={handleAnnouncementPublish} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Announcement Header</label>
                      <input type="text" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Summer checkup campaigns" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Target Role Grouping</label>
                      <select value={annTarget} onChange={(e) => setAnnTarget(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white">
                        <option value="all">Broad Public (All Roles)</option>
                        <option value="patient">Outpatients exclusive</option>
                        <option value="provider">Clinicians exclusive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Announcement content bulletin</label>
                    <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" placeholder="Full context bulletins..." rows={2} required />
                  </div>

                  <button type="submit" className="bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                    Deploy Announcement
                  </button>
                </form>
              </div>

              {/* lists */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 font-sans">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Live Announcements feed</span>
                <div className="space-y-3">
                  {announcements.map(an => (
                    <div key={an.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between text-xs">
                      <div>
                        <span className="text-[8.5px] bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded capitalize">Target: {an.targetRole}</span>
                        <h5 className="font-bold text-slate-900 dark:text-white mt-1">{an.title}</h5>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{an.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{an.date}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: FAQs Manager */}
        {activeTab === 'faq' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs self-start">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2">Publish FAQ Article</h4>
              <form onSubmit={handleFAQPublish} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Frequently Asked Question</label>
                  <input type="text" value={faqQuestion} onChange={(e) => setFAQQuestion(e.target.value)} placeholder="How do I check diastolic standards?" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Answer Context</label>
                  <textarea value={faqAnswer} onChange={(e) => setFAQAnswer(e.target.value)} rows={3} placeholder="Provide simplified patient-facing diagnostic guidelines..." className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">FAQ Category</label>
                  <select value={faqCategory} onChange={(e) => setFAQCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white">
                    <option value="General">General Inquiries</option>
                    <option value="Security">HIPAA & Security</option>
                    <option value="Billing">Insurance & Plans</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition">
                  Publish FAQ
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 font-sans">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Live FAQ Directory</span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {faqs.map(f => (
                  <div key={f.id} className="py-3.5 first:pt-0 last:pb-0 text-xs text-slate-700 dark:text-slate-300">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">Q:</span>
                      <span>{f.question}</span>
                    </h5>
                    <p className="text-slate-500 dark:text-slate-350 leading-relaxed mt-1.5 pl-4">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: HIPAA Diagnostics and telemetries audit Sequential trails */}
        {activeTab === 'auditing' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b shrink-0">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-4.5 h-4.5 text-indigo-600" />
                  <span>HIPAA Compliance Diagnostics Audit Log</span>
                </h4>
                <p className="text-[10px] text-slate-400">Sequential chronological telemetries tracking administrative operations</p>
              </div>
              <span className="text-[9px] font-mono select-none px-2.5 py-1 rounded bg-slate-900 text-slate-100 font-bold">Standard format trail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Identity User</th>
                    <th className="px-4 py-3">Audit Operation Actions</th>
                    <th className="px-4 py-3">Detailed audits reports summary</th>
                    <th className="px-4 py-3">Auditor Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {auditLogs.map(aud => (
                    <tr key={aud.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-950 dark:text-white whitespace-nowrap font-bold">{aud.timestamp}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-bold">{aud.userName} ({aud.userRole})</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-black text-[9.5px]">
                          {aud.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[220px] font-sans text-xs text-slate-900 dark:text-slate-100 font-medium">{aud.details}</td>
                      <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">{aud.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Master Cache Purge Control Area */}
            <div className="bg-slate-50 dark:bg-slate-950/25 rounded-xl border border-dashed border-red-250 dark:border-rose-950/40 p-5 mt-6 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-950/20 text-rose-600 dark:text-rose-450 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-rose-600 dark:text-rose-450">
                    System Administration Database Purging Desk
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    If your active session is displaying leftover cached samples in your browser's local storage profile (such as active patients or logs from previous demo workflows), click below to instantly purge all stored persistent cache structures. This hard-reset operation clears the sandbox directory and spins up a completely clean, pristine clinical environment under production guidelines.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you absolutely sure you want to permanently delete all offline clinical logs, community message buffers, pending user memberships, and local session caches? This will reload the workspace onto a pristine baseline.')) {
                    localStorage.removeItem('curaflow_users');
                    localStorage.removeItem('curaflow_logs');
                    localStorage.removeItem('curaflow_bookings');
                    localStorage.removeItem('curaflow_active_sessions');
                    localStorage.removeItem('curaflow_session');
                    localStorage.removeItem('curaflow_articles');
                    localStorage.removeItem('curaflow_faqs');
                    localStorage.removeItem('curaflow_announcements');
                    localStorage.removeItem('curaflow_audit');
                    localStorage.removeItem('curaflow_ahomka_entries');
                    localStorage.removeItem('curaflow_community_messages');
                    window.location.reload();
                  }
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg transition-all shadow-md shadow-rose-600/10 cursor-pointer inline-flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Pristine Baseline Hard Reset (Purge Cache)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Permanent Deletion Warning Dialog Confirmation Drawer/Modal */}
      {pendingDeleteUser && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fade-in text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Permanently Purge Account Workspace?
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  This administrative operation will permanently delete ALL active records, sessions, and clinician profiles associated with this identity. This operation is irreversible and audited under HIPAA frameworks.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2.5">
                {pendingDeleteUser.avatar ? (
                  <img src={pendingDeleteUser.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-slate-250 dark:border-slate-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                    {pendingDeleteUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-black text-xs text-slate-900 dark:text-white">{pendingDeleteUser.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wide">ROLE: {pendingDeleteUser.role}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium font-mono truncate">
                ID Reference: <span className="text-slate-650 dark:text-indigo-400 font-bold">{pendingDeleteUser.id}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteUser(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Cancel Action
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteUser) {
                    onDeleteUser(pendingDeleteUser.id);
                    onTriggerToast(`Successfully pruned healthcare account: ${pendingDeleteUser.name}`, 'success');
                  }
                  setPendingDeleteUser(null);
                }}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-heavy rounded-lg text-xs transition cursor-pointer shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20"
              >
                Confirm Deletion & Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
