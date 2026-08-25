/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CMSArticle, AppUser, FAQ, Announcement, AuditLog, HealthLog, AppointmentBooking, AhomkaEntry, SupportForumBoard 
} from '../types';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { WeeklyComplaint, EngagementDataPoint } from '../data';
import { 
  Activity, Users, FileText, HelpCircle, Bell, Settings, Plus, Trash2, 
  Check, ShieldAlert, Sparkles, AlertTriangle, Play, Info, EyeOff, Layout, Globe, Server, Download, RefreshCw, TrendingUp,
  MapPin, Shield, GraduationCap, Briefcase, Stethoscope, Database, UserCheck, X, HeartPulse, Filter, User
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ReferenceLine, ReferenceArea
} from 'recharts';
import { generateUserId, formatUserId, getUserDemographics } from '../utils/userId';

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
  forumBoards: SupportForumBoard[];
  onAddForumBoard: (board: SupportForumBoard) => void;
  weeklyComplaints: WeeklyComplaint[];
  onUpdateWeeklyComplaints: React.Dispatch<React.SetStateAction<WeeklyComplaint[]>>;
  engagementData: EngagementDataPoint[];
  onUpdateEngagementData: React.Dispatch<React.SetStateAction<EngagementDataPoint[]>>;
  onAddAhomkaEntry?: (
    mood: number,
    stress: number,
    painLevel: number,
    symptoms: string[],
    notes: string,
    systolic?: number,
    diastolic?: number,
    pulse?: number,
    feeling?: string,
    medicationAdherence?: string,
    readings?: { systolic: number; diastolic: number; pulse: number }[],
    targetPatientId?: string,
    customDate?: string
  ) => void;
  onAddLog?: (metric: any, value: string, notes: string, targetPatientId?: string) => void;
}

const BloodPressureCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    const sysDiff = data.systolic - 120;
    const diaDiff = data.diastolic - 80;

    let stageBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (data.stage === 'Hypertensive Crisis' || data.systolic >= 180 || data.diastolic >= 120) {
      stageBadgeStyle = 'bg-rose-600/30 text-rose-200 border-rose-500/60 animate-pulse';
    } else if (data.stage === 'Stage 2 Hypertension' || data.isHighRisk) {
      stageBadgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    } else if (data.stage === 'Stage 1 Hypertension') {
      stageBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    } else if (data.stage === 'Elevated') {
      stageBadgeStyle = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    }

    const formattedId = data.userId ? formatUserId(data.userId) : (data.patientId ? formatUserId(data.patientId) : '0001');

    return (
      <div className="bg-slate-950/95 text-slate-100 border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-3 text-left font-sans min-w-[280px] max-w-[340px] backdrop-blur-xl ring-1 ring-white/10">
        {/* Header with Timestamp & Stage Badge */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300 font-mono">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{data.displayDate || data.fullTimestamp || label}</span>
          </div>
          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${stageBadgeStyle}`}>
            {data.stage || (data.isHighRisk ? 'High Risk' : 'Normal')}
          </span>
        </div>

        {/* Patient Identity & User ID */}
        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white tracking-tight truncate max-w-[170px]">
                {data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : (data.patientName || 'Patient')}
              </span>
            </div>
            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              ID: #{formattedId}
            </span>
          </div>

          {/* Demographic Metadata: Sex, DOB, Date of Reading */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px] text-slate-300 font-mono pt-1 border-t border-slate-800/60">
            <div>
              <span className="text-slate-500 uppercase font-semibold">Sex: </span>
              <span className="text-slate-200 font-bold">{data.sex || 'Unspecified'}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold">DOB: </span>
              <span className="text-slate-200 font-bold">{data.dob || 'Unspecified'}</span>
            </div>
            <div className="col-span-2 text-[9px] text-slate-400 truncate">
              <span className="text-slate-500 uppercase font-semibold">Reading Taken: </span>
              <span className="text-slate-300 font-medium">{data.dateOfReading || data.fullTimestamp || 'Recent'}</span>
            </div>
          </div>
        </div>

        {/* Dual Vital Metric Cards: Systolic & Diastolic */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
          {/* Systolic Box */}
          <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Systolic</span>
              <span className={`text-[8.5px] font-mono font-bold ${data.systolic >= 140 ? 'text-rose-400' : 'text-slate-400'}`}>
                {data.systolic >= 140 ? 'HIGH' : 'OK'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-black text-white tracking-tight">{data.systolic}</span>
              <span className="text-[10px] text-rose-300 font-mono font-medium">mmHg</span>
            </div>
            <p className="text-[8.5px] text-slate-400 font-mono">
              {sysDiff > 0 ? `+${sysDiff} vs normal (120)` : `${sysDiff} vs normal (120)`}
            </p>
          </div>

          {/* Diastolic Box */}
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Diastolic</span>
              <span className={`text-[8.5px] font-mono font-bold ${data.diastolic >= 90 ? 'text-rose-400' : 'text-slate-400'}`}>
                {data.diastolic >= 90 ? 'HIGH' : 'OK'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-black text-white tracking-tight">{data.diastolic}</span>
              <span className="text-[10px] text-blue-300 font-mono font-medium">mmHg</span>
            </div>
            <p className="text-[8.5px] text-slate-400 font-mono">
              {diaDiff > 0 ? `+${diaDiff} vs normal (80)` : `${diaDiff} vs normal (80)`}
            </p>
          </div>
        </div>

        {/* Supplementary Medical Telemetry */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
          <span>MAP: <strong className="text-slate-200 font-bold">{data.map} mmHg</strong></span>
          {data.pulse ? (
            <span>Pulse: <strong className="text-emerald-400 font-bold">{data.pulse} bpm</strong></span>
          ) : (
            <span className="text-slate-500">Pulse: N/A</span>
          )}
        </div>

        {/* Clinical Note Excerpt if Available */}
        {data.notes && (
          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 italic line-clamp-2">
            "{data.notes}"
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white rounded-xl p-3 shadow-2xl space-y-1.5 text-left border-l-4 border-l-emerald-600 font-sans min-w-[170px]">
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
          {label}
        </div>
        <div className="space-y-1 text-xs">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-medium" style={{ color: item.color }}>
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
  onAddUser, onDeleteUser, forumBoards, onAddForumBoard,
  weeklyComplaints, onUpdateWeeklyComplaints, engagementData, onUpdateEngagementData,
  onAddAhomkaEntry, onAddLog
}: AdminLayoutProps) {
  
  // Dynamic complaint metrics calculations
  const totalEscalations = (weeklyComplaints || []).reduce((acc, curr) => acc + (curr.escalated || 0), 0);
  const resolvedEscalations = (weeklyComplaints || []).reduce((acc, curr) => acc + (curr.resolved || 0), 0);
  const unresolvedEscalations = totalEscalations - resolvedEscalations;
  const avgResponseTime = (weeklyComplaints || []).length > 0
    ? ((weeklyComplaints || []).reduce((acc, curr) => acc + (curr.avgResponseHours || 0), 0) / (weeklyComplaints || []).length).toFixed(1)
    : "0";
  const resolutionRate = totalEscalations > 0
    ? ((resolvedEscalations / totalEscalations) * 100).toFixed(1)
    : "0";

  const [activeTab, setActiveTab] = useState('analytics');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
  const [timeRange, setTimeRange] = useState<'30' | '15' | '7'>('30');
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AppUser | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'normal' | 'high-risk'>('all');

  // Registry sub-tabs and profile view states
  const [activeRegistrySubTab, setActiveRegistrySubTab] = useState<'patients' | 'providers' | 'sub_admins'>('patients');
  const [selectedProfileUser, setSelectedProfileUser] = useState<AppUser | null>(null);

  // Socio-demographic registration input states
  const [regFirstName, setRegFirstName] = useState<string>('Ama');
  const [regLastName, setRegLastName] = useState<string>('Serwaa');
  const [regSex, setRegSex] = useState<string>('Female');
  const [regDob, setRegDob] = useState<string>('1986-05-14');
  const [regCustomUserId, setRegCustomUserId] = useState<string>('');
  const [regAge, setRegAge] = useState<string>('38');
  const [regGender, setRegGender] = useState<string>('Female');
  const [regMarital, setRegMarital] = useState<string>('Married');
  const [regEmployment, setRegEmployment] = useState<string>('Employed');
  const [regLanguage, setRegLanguage] = useState<string>('English');
  const [regEducation, setRegEducation] = useState<string>('Tertiary Degree');
  const [regStreet, setRegStreet] = useState<string>('34 Giffard Road');
  const [regCity, setRegCity] = useState<string>('Cantonments');
  const [regState, setRegState] = useState<string>('Accra');
  const [regZip, setRegZip] = useState<string>('00233');

  // Specialized provider/admin info states
  const [regSpecialty, setRegSpecialty] = useState<string>('Cardiology Services');
  const [regHospital, setRegHospital] = useState<string>('Korle-Bu Teaching Hospital');

  // Compliance & Interactive Export states
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportDataType, setExportDataType] = useState<'all' | 'patients' | 'logs' | 'audit'>('all');
  const [exportDateRange, setExportDateRange] = useState<'all' | '7days' | '30days'>('all');
  const [exportCompleted, setExportCompleted] = useState(false);
  const [isRefreshingExporter, setIsRefreshingExporter] = useState(false);
  const [systolicThreshold, setSystolicThreshold] = useState<number>(140);
  const [diastolicThreshold, setDiastolicThreshold] = useState<number>(90);

  // Blood Pressure Longitudinal Telemetry Chart Controls
  const [bpPatientFilter, setBpPatientFilter] = useState<string>('all');
  const [bpTimeRange, setBpTimeRange] = useState<'7-day' | '30-day' | 'All-time'>('All-time');
  const [showBpRefLines, setShowBpRefLines] = useState<boolean>(true);

  const filteredLogs = logs.filter(log => {
    if (alertFilter === 'high-risk') return log.isHighRisk === true;
    if (alertFilter === 'normal') return log.isHighRisk === false || !log.isHighRisk;
    return true;
  });

  // Super Admin - Log Patient Telemetry Readings modal state (3 sequential readings & date allocation)
  const [logReadingsPatient, setLogReadingsPatient] = useState<AppUser | null>(null);
  const [adminLogDate, setAdminLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Reading 1
  const [adminSys1, setAdminSys1] = useState<number>(120);
  const [adminDia1, setAdminDia1] = useState<number>(80);
  const [adminPulse1, setAdminPulse1] = useState<number>(72);
  
  // Reading 2
  const [adminSys2, setAdminSys2] = useState<number>(122);
  const [adminDia2, setAdminDia2] = useState<number>(82);
  const [adminPulse2, setAdminPulse2] = useState<number>(73);
  
  // Reading 3
  const [adminSys3, setAdminSys3] = useState<number>(118);
  const [adminDia3, setAdminDia3] = useState<number>(79);
  const [adminPulse3, setAdminPulse3] = useState<number>(70);

  const [readGlucose, setReadGlucose] = useState<string>('');
  const [readMood, setReadMood] = useState<number>(8);
  const [readStress, setReadStress] = useState<number>(3);
  const [readPain, setReadPain] = useState<number>(1);
  const [readSymptoms, setReadSymptoms] = useState<string[]>(['Normal / Stable']);
  const [readAdherence, setReadAdherence] = useState<string>('Full Adherence');
  const [readNotes, setReadNotes] = useState<string>('');

  const handleSavePatientReadings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logReadingsPatient) return;

    const s1 = Number(adminSys1) || 120;
    const d1 = Number(adminDia1) || 80;
    const p1 = Number(adminPulse1) || 72;

    const s2 = Number(adminSys2) || 122;
    const d2 = Number(adminDia2) || 82;
    const p2 = Number(adminPulse2) || 73;

    const s3 = Number(adminSys3) || 118;
    const d3 = Number(adminDia3) || 79;
    const p3 = Number(adminPulse3) || 70;

    // Calculate averages mathematically
    const avgSys = Math.round((s1 + s2 + s3) / 3);
    const avgDia = Math.round((d1 + d2 + d3) / 3);
    const avgPulse = Math.round((p1 + p2 + p3) / 3);

    // Allocated Date formatting
    let allocatedDateStr = new Date().toLocaleDateString('en-US');
    if (adminLogDate) {
      const parts = adminLogDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        allocatedDateStr = d.toLocaleDateString('en-US');
      }
    }

    if (onAddAhomkaEntry) {
      onAddAhomkaEntry(
        readMood,
        readStress,
        readPain,
        readSymptoms,
        readNotes || `Recorded by Super Admin (3-Reading Procedure, Date: ${allocatedDateStr})`,
        avgSys,
        avgDia,
        avgPulse,
        'Logged by Admin',
        readAdherence,
        [
          { systolic: s1, diastolic: d1, pulse: p1 },
          { systolic: s2, diastolic: d2, pulse: p2 },
          { systolic: s3, diastolic: d3, pulse: p3 }
        ],
        logReadingsPatient.id,
        allocatedDateStr
      );
    }

    if (readGlucose.trim() && onAddLog) {
      onAddLog('Blood Glucose', readGlucose.trim(), `Glucose logged by Super Admin on ${allocatedDateStr}. ${readNotes}`, logReadingsPatient.id);
    }

    onTriggerToast(`Successfully logged 3-reading procedure for ${logReadingsPatient.name} on ${allocatedDateStr} (Avg: ${avgSys}/${avgDia} mmHg)!`, 'success');
    setLogReadingsPatient(null);
  };

  // Super Admin provisioning panel input states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'provider' | 'patient'>('admin');

  const handleAdminAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const fName = regFirstName.trim() || newUserName.trim().split(' ')[0] || 'User';
    const lName = regLastName.trim() || newUserName.trim().split(' ').slice(1).join(' ') || '';
    const fullName = newUserName.trim() || `${fName} ${lName}`.trim();

    if (!fullName || !newUserEmail.trim() || !newUserPassword.trim()) {
      onTriggerToast('Please complete all required credential fields.', 'error');
      return;
    }
    const duplicated = users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase());
    if (duplicated) {
      onTriggerToast('An account is already linked to this email address.', 'error');
      return;
    }

    // Auto calculate age from DOB
    let calculatedAge = parseInt(regAge) || 38;
    if (regDob) {
      const birth = new Date(regDob);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let computed = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          computed--;
        }
        if (computed >= 0 && computed <= 130) {
          calculatedAge = computed;
        }
      }
    }

    let roleToAssign: 'patient' | 'provider' | 'admin' = 'patient';
    let addedDetails: Partial<AppUser> = {};

    if (activeRegistrySubTab === 'patients') {
      roleToAssign = 'patient';
      addedDetails = {
        age: calculatedAge,
        gender: regSex || regGender,
        maritalStatus: regMarital,
        employmentStatus: regEmployment,
        preferredLanguage: regLanguage,
        educationLevel: regEducation,
        addressStreet: regStreet || '34 Giffard Road',
        addressCity: regCity || 'Cantonments',
        addressState: regState || 'Accra',
        addressZip: regZip || '00233'
      };
    } else if (activeRegistrySubTab === 'providers') {
      roleToAssign = 'provider';
      addedDetails = {
        insuranceProvider: regSpecialty, // Use insuranceProvider as specialty helper
        insuranceMemberId: regHospital,  // Use insuranceMemberId as hospital helper
        gender: regSex || regGender,
        age: calculatedAge || 45,
        addressCity: regCity || 'Accra',
        addressState: regState || 'Greater Accra',
        verified: true
      };
    } else if (activeRegistrySubTab === 'sub_admins') {
      roleToAssign = 'admin';
      addedDetails = {
        isSuperAdmin: false,
        age: calculatedAge || 40,
        gender: regSex || regGender,
        maritalStatus: regMarital,
        addressStreet: regStreet || '88 Independence Ave',
        addressCity: regCity || 'Cantonments',
        addressState: regState || 'Accra'
      };
    }

    // Allocate 4-digit User ID strictly in range 0001 - 9999
    const assignedUserId = regCustomUserId.trim() ? formatUserId(regCustomUserId.trim()) : generateUserId(users);

    const brandNewUser: AppUser = {
      id: assignedUserId,
      userId: assignedUserId,
      name: fullName,
      firstName: fName,
      lastName: lName,
      sex: regSex || 'Female',
      gender: regSex || regGender || 'Female',
      dob: regDob || '1986-05-14',
      age: calculatedAge,
      email: newUserEmail.trim().toLowerCase(),
      role: roleToAssign,
      status: 'Active',
      verified: true,
      password: newUserPassword.trim(),
      avatar: undefined,
      ...addedDetails
    };

    if (onAddUser) {
      onAddUser(brandNewUser);
      onTriggerToast(`Successfully provisioned new ${roleToAssign} account: ${fullName} [ID #${assignedUserId}]`, 'success');
      setNewUserName('');
      setRegFirstName('');
      setRegLastName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setRegCustomUserId('');
    }
  };

  const handleTriggerExport = () => {
    setIsRefreshingExporter(true);
    setExportCompleted(false);
    
    setTimeout(() => {
      setIsRefreshingExporter(false);
      setExportCompleted(true);
      
      let finalContent = "";
      let filename = `CFL_Secured_Export_${exportDataType}_${Date.now()}`;
      
      if (exportFormat === 'json') {
        let payload: any = {};
        if (exportDataType === 'all' || exportDataType === 'patients') payload.patients = users;
        if (exportDataType === 'all' || exportDataType === 'logs') payload.clinical_logs = logs;
        if (exportDataType === 'all' || exportDataType === 'audit') payload.audit_compliance = auditLogs;
        finalContent = JSON.stringify(payload, null, 2);
        filename += ".json";
      } else {
        // Generate CSV file formatted under HIPAA rules
        if (exportDataType === 'patients' || exportDataType === 'all') {
          finalContent += "PATIENTS REGISTRY DATA\n";
          finalContent += "ID,Name,Email,Role,Status,Verified\n";
          users.forEach(u => {
            finalContent += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.status}","${u.verified}"\n`;
          });
          finalContent += "\n";
        }
        if (exportDataType === 'logs' || exportDataType === 'all') {
          finalContent += "CLINICAL LOGS BIOMETRICS SURVEY DATA\n";
          finalContent += "ID,PatientId,Timestamp,Metric,Value,Trend,VerifiedBy,HighRisk\n";
          logs.forEach(l => {
            finalContent += `"${l.id}","${l.patientId || ''}","${l.timestamp}","${l.metric}","${l.value}","${l.trend}","${l.verifiedBy}","${l.isHighRisk || false}"\n`;
          });
          finalContent += "\n";
        }
        if (exportDataType === 'audit' || exportDataType === 'all') {
          finalContent += "HIPAA SECURITY AUDIT TRAIL LOGS\n";
          finalContent += "ID,Timestamp,UserId,UserName,Role,Action,Details,IP\n";
          auditLogs.forEach(a => {
            finalContent += `"${a.id}","${a.timestamp}","${a.userId}","${a.userName}","${a.userRole}","${a.action}","${a.details}","${a.ip}"\n`;
          });
        }
        filename += ".csv";
      }
      
      const element = document.createElement("a");
      const file = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      onTriggerToast(`🔑 Export Complete! Secure clinical payload downloaded.`, 'success');
    }, 1500);
  };

  // Patient selecting for downloading clinical summary logs
  const patients = users.filter(u => u.role === 'patient');
  const [selectedDownloadPatientId, setSelectedDownloadPatientId] = useState<string>(patients[0]?.id || '');

  // Sliced user engagement and activity metrics computed dynamically from database
  const effectiveEngagementData = useMemo(() => {
    if (engagementData && engagementData.length > 0) {
      return engagementData.slice(-parseInt(timeRange));
    }
    if (auditLogs && auditLogs.length > 0) {
      const grouped: Record<string, { actions: number; users: Set<string> }> = {};
      auditLogs.forEach(log => {
        const d = log.timestamp ? new Date(log.timestamp).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }) : 'Today';
        if (!grouped[d]) grouped[d] = { actions: 0, users: new Set() };
        grouped[d].actions += 1;
        if (log.userId) grouped[d].users.add(log.userId);
      });
      return Object.entries(grouped).map(([date, val]) => ({
        date,
        activeUsers: Math.max(1, val.users.size),
        platformActions: val.actions
      })).slice(-parseInt(timeRange));
    }
    return [];
  }, [engagementData, auditLogs, timeRange]);

  const slicedData = effectiveEngagementData;
  const totalActions = slicedData.length > 0 
    ? slicedData.reduce((acc, curr) => acc + curr.platformActions, 0)
    : (auditLogs ? auditLogs.length : 0);
  const peakUsers = slicedData.length > 0 
    ? Math.max(...slicedData.map(d => d.activeUsers), 0)
    : (loggedInUserIds.length > 0 ? loggedInUserIds.length : (users.length > 0 ? 1 : 0));
  const avgUsers = slicedData.length > 0 
    ? Math.round(slicedData.reduce((acc, curr) => acc + curr.activeUsers, 0) / slicedData.length) 
    : (loggedInUserIds.length > 0 ? loggedInUserIds.length : 0);

  // Real Critical Alerts derived from genuine clinical telemetry & logs in the database
  const realCriticalAlerts = useMemo(() => {
    const alerts: { title: string; category: string; age: string }[] = [];
    (ahomkaEntries || []).forEach(e => {
      if ((e.systolic && e.systolic >= systolicThreshold) || (e.diastolic && e.diastolic >= diastolicThreshold)) {
        const patient = users.find(u => u.id === e.patientId);
        const pName = patient ? patient.name : `Patient #${(e.patientId || '').slice(-4) || 'Ref'}`;
        alerts.push({
          title: `High Risk Blood Pressure (${e.systolic}/${e.diastolic} mmHg, Pulse ${e.pulse || 72})`,
          category: `Clinical Quality · ${pName}`,
          age: e.timestamp ? new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'
        });
      }
    });
    (logs || []).forEach(l => {
      if (l.isHighRisk) {
        const patient = users.find(u => u.id === l.patientId);
        const pName = patient ? patient.name : (l.patientName || `Patient #${(l.patientId || '').slice(-4) || 'Ref'}`);
        alerts.push({
          title: `High-Risk Health Vital (${l.metric}: ${l.value})`,
          category: `Clinical Quality · ${pName}`,
          age: l.timestamp ? new Date(l.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'
        });
      }
    });
    return alerts;
  }, [ahomkaEntries, logs, users, systolicThreshold, diastolicThreshold]);

  // Unified Blood Pressure Data extracted from genuine health logs and Ahomka entries
  const bloodPressureData = useMemo(() => {
    const list: {
      id: string;
      rawTime: number;
      displayDate: string;
      fullTimestamp: string;
      dateOfReading?: string;
      systolic: number;
      diastolic: number;
      pulse?: number;
      map: number;
      stage: string;
      isHighRisk: boolean;
      patientId: string;
      userId: string;
      patientName: string;
      firstName?: string;
      lastName?: string;
      sex?: string;
      dob?: string;
      source: string;
      notes?: string;
    }[] = [];

    const parseStage = (sys: number, dia: number) => {
      if (sys >= 180 || dia >= 120) return 'Hypertensive Crisis';
      if (sys >= 140 || dia >= 90) return 'Stage 2 Hypertension';
      if (sys >= 130 || dia >= 80) return 'Stage 1 Hypertension';
      if (sys >= 120 && dia < 80) return 'Elevated';
      return 'Normal BP';
    };

    // 1. Parse HealthLogs with metric 'Blood Pressure' or slash format value
    (logs || []).forEach(l => {
      if (l.metric === 'Blood Pressure' || (l.value && l.value.includes('/'))) {
        const match = (l.value || '').match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
        if (match) {
          const sys = parseInt(match[1], 10);
          const dia = parseInt(match[2], 10);
          if (!isNaN(sys) && !isNaN(dia) && sys > 40 && dia > 30) {
            const patient = users.find(u => u.id === l.patientId || (l.userId && (u.userId === l.userId || u.id === l.userId)));
            const demo = patient ? getUserDemographics(patient) : { firstName: l.firstName || '', lastName: l.lastName || '', sex: l.sex || 'Unspecified', dob: l.dob || 'Unspecified', age: undefined, fullName: l.patientName || 'Patient' };
            const pName = demo.fullName || patient?.name || l.patientName || (l.patientId ? `Patient #${l.patientId.slice(-4)}` : 'Patient');
            const formattedUserId = patient ? formatUserId(patient.id) : (l.userId ? formatUserId(l.userId) : (l.patientId ? formatUserId(l.patientId) : '0001'));
            
            const parsedDate = l.timestamp ? new Date(l.timestamp) : new Date();
            const isValidDate = !isNaN(parsedDate.getTime());
            const displayDate = isValidDate 
              ? parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : (l.timestamp || 'Recorded');
            
            const rawTime = isValidDate ? parsedDate.getTime() : 0;
            const mapVal = Math.round((2 * dia + sys) / 3);
            const stage = parseStage(sys, dia);
            const isHigh = !!l.isHighRisk || sys >= systolicThreshold || dia >= diastolicThreshold;

            list.push({
              id: l.id || `log-${Math.random()}`,
              rawTime,
              displayDate,
              fullTimestamp: l.timestamp || displayDate,
              dateOfReading: l.dateOfReading || l.timestamp || displayDate,
              systolic: sys,
              diastolic: dia,
              map: mapVal,
              stage,
              isHighRisk: isHigh,
              patientId: l.patientId || '',
              userId: formattedUserId,
              patientName: pName,
              firstName: demo.firstName,
              lastName: demo.lastName,
              sex: demo.sex,
              dob: demo.dob,
              source: 'Clinical Vital Log',
              notes: l.notes
            });
          }
        }
      }
    });

    // 2. Parse Ahomka multi-step entries
    (ahomkaEntries || []).forEach(e => {
      if (e.systolic && e.diastolic) {
        const sys = typeof e.systolic === 'number' ? e.systolic : parseInt(String(e.systolic), 10);
        const dia = typeof e.diastolic === 'number' ? e.diastolic : parseInt(String(e.diastolic), 10);
        if (!isNaN(sys) && !isNaN(dia) && sys > 40 && dia > 30) {
          if (!list.some(item => item.id === e.id)) {
            const patient = users.find(u => u.id === e.patientId || (e.userId && (u.userId === e.userId || u.id === e.userId)));
            const demo = patient ? getUserDemographics(patient) : { firstName: e.firstName || '', lastName: e.lastName || '', sex: e.sex || 'Unspecified', dob: e.dob || 'Unspecified', age: undefined, fullName: 'Patient' };
            const pName = demo.fullName || patient?.name || (e.patientId ? `Patient #${e.patientId.slice(-4)}` : 'Patient');
            const formattedUserId = patient ? formatUserId(patient.id) : (e.userId ? formatUserId(e.userId) : (e.patientId ? formatUserId(e.patientId) : '0001'));
            
            const parsedDate = e.timestamp ? new Date(e.timestamp) : new Date();
            const isValidDate = !isNaN(parsedDate.getTime());
            const displayDate = isValidDate 
              ? parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : (e.timestamp || 'Recorded');
            
            const rawTime = isValidDate ? parsedDate.getTime() : 0;
            const mapVal = Math.round((2 * dia + sys) / 3);
            const stage = parseStage(sys, dia);
            const isHigh = sys >= systolicThreshold || dia >= diastolicThreshold;

            list.push({
              id: e.id || `ahomka-${Math.random()}`,
              rawTime,
              displayDate,
              fullTimestamp: e.timestamp || displayDate,
              dateOfReading: e.dateOfReading || e.timestamp || displayDate,
              systolic: sys,
              diastolic: dia,
              pulse: e.pulse,
              map: mapVal,
              stage,
              isHighRisk: isHigh,
              patientId: e.patientId || '',
              userId: formattedUserId,
              patientName: pName,
              firstName: demo.firstName,
              lastName: demo.lastName,
              sex: demo.sex,
              dob: demo.dob,
              source: 'Ahomka Protocol',
              notes: e.notes
            });
          }
        }
      }
    });

    // Sort chronologically ascending for line chart progression
    list.sort((a, b) => a.rawTime - b.rawTime);

    return list;
  }, [logs, ahomkaEntries, users, systolicThreshold, diastolicThreshold]);

  // Filtered dataset according to selected patient and time range
  const filteredBloodPressureData = useMemo(() => {
    let dataset = bloodPressureData;

    if (bpPatientFilter !== 'all') {
      dataset = dataset.filter(d => d.patientId === bpPatientFilter);
    }

    if (bpTimeRange === '7-day') {
      const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = dataset.filter(d => d.rawTime >= cutoffTime);
      dataset = recent.length > 0 ? recent : dataset.slice(-Math.min(7, dataset.length));
    } else if (bpTimeRange === '30-day') {
      const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recent = dataset.filter(d => d.rawTime >= cutoffTime);
      dataset = recent.length > 0 ? recent : dataset.slice(-Math.min(30, dataset.length));
    }

    return dataset;
  }, [bloodPressureData, bpPatientFilter, bpTimeRange]);

  // Summary statistics for the Blood Pressure Trend visualization
  const bpStats = useMemo(() => {
    if (filteredBloodPressureData.length === 0) {
      return {
        count: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        avgMAP: 0,
        highRiskCount: 0,
        normalCount: 0,
        maxSystolic: 0,
        minDiastolic: 0,
        latest: null as any
      };
    }

    const count = filteredBloodPressureData.length;
    const sumSys = filteredBloodPressureData.reduce((acc, curr) => acc + curr.systolic, 0);
    const sumDia = filteredBloodPressureData.reduce((acc, curr) => acc + curr.diastolic, 0);
    const sumMAP = filteredBloodPressureData.reduce((acc, curr) => acc + curr.map, 0);
    const highRiskCount = filteredBloodPressureData.filter(d => d.isHighRisk).length;
    const normalCount = count - highRiskCount;
    const maxSystolic = Math.max(...filteredBloodPressureData.map(d => d.systolic));
    const minDiastolic = Math.min(...filteredBloodPressureData.map(d => d.diastolic));
    const latest = filteredBloodPressureData[filteredBloodPressureData.length - 1];

    return {
      count,
      avgSystolic: Math.round(sumSys / count),
      avgDiastolic: Math.round(sumDia / count),
      avgMAP: Math.round(sumMAP / count),
      highRiskCount,
      normalCount,
      maxSystolic,
      minDiastolic,
      latest
    };
  }, [filteredBloodPressureData]);

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
    doc.text("CFL PATIENT CLINICAL SUMMARY", 14, 18);
    
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

  // Full System State Excel Export Function (.xlsx)
  const handleExportSystemDataExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: User Registry
      const usersData = users.map(u => ({
        "User ID": u.id,
        "Full Name": u.name,
        "Email Address": u.email,
        "Role": u.role,
        "Status": u.status,
        "Verified": u.verified ? "Yes" : "No",
        "Phone Number": u.phone || "N/A",
        "Gender": u.gender || "N/A",
        "City": u.city || "N/A",
        "State/Region": u.state || "N/A",
        "Primary Condition": u.primaryDiagnosis || "N/A",
        "Language": u.preferredLanguage || "English",
        "Emergency Contact": u.emergencyContact || "N/A",
      }));
      const wsUsers = XLSX.utils.json_to_sheet(usersData);
      XLSX.utils.book_append_sheet(wb, wsUsers, "User Registry");

      // Sheet 2: Biometric Telemetry Logs
      const logsData = logs.map(l => ({
        "Log ID": l.id,
        "Patient Name": l.patientName || "N/A",
        "Patient ID": l.patientId,
        "Metric": l.metric,
        "Value": l.value,
        "Trend": l.trend,
        "Verified By": l.verifiedBy,
        "High Risk Standing": l.isHighRisk ? "ALERT HIGH RISK" : "Normal",
        "Timestamp": l.timestamp,
        "Notes": l.notes
      }));
      const wsLogs = XLSX.utils.json_to_sheet(logsData);
      XLSX.utils.book_append_sheet(wb, wsLogs, "Biometric Logs");

      // Sheet 3: Ahomka Ho Check-Ins
      const ahomkaData = ahomkaEntries.map(e => ({
        "Entry ID": e.id,
        "Patient ID": e.patientId,
        "Timestamp": e.timestamp,
        "Systolic BP (mmHg)": e.systolic ?? "N/A",
        "Diastolic BP (mmHg)": e.diastolic ?? "N/A",
        "Pulse (bpm)": e.pulse ?? "N/A",
        "Mood Rating (1-10)": e.mood,
        "Stress Level (1-10)": e.stress,
        "Pain Severity (1-10)": e.painLevel,
        "Calculated Relief Score (%)": `${e.comfortScore}%`,
        "Feeling Description": e.feeling || "N/A",
        "Medication Adherence": e.medicationAdherence || "N/A",
        "Reported Symptoms": (e.symptoms || []).join(", "),
        "Clinical Notes": e.notes
      }));
      const wsAhomka = XLSX.utils.json_to_sheet(ahomkaData);
      XLSX.utils.book_append_sheet(wb, wsAhomka, "Ahomka Relief Index");

      // Sheet 4: Audit Trails & Operational Security
      const auditData = auditLogs.map(a => ({
        "Audit ID": a.id,
        "User ID": a.userId,
        "User Name": a.userName,
        "Role": a.role,
        "Action": a.action,
        "Timestamp": a.timestamp,
        "Operation Details": a.details
      }));
      const wsAudit = XLSX.utils.json_to_sheet(auditData);
      XLSX.utils.book_append_sheet(wb, wsAudit, "Audit Logs");

      // Sheet 5: Appointments & Consultations
      const bookingsData = bookings.map(b => ({
        "Booking ID": b.id,
        "Patient Name": b.patientName,
        "Provider Name": b.providerName,
        "Specialization": b.specialization,
        "Scheduled Date": b.date,
        "Time Slot": b.timeSlot,
        "Status": b.status,
        "Consultation Type": b.type,
        "Notes": b.notes || "N/A"
      }));
      const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
      XLSX.utils.book_append_sheet(wb, wsBookings, "Appointments");

      const exportFileName = `CuraFlow_SuperAdmin_SystemState_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, exportFileName);

      onTriggerToast(`System state exported successfully as multi-sheet Excel workbook (${exportFileName})!`, 'success');
    } catch (err) {
      console.error("Excel export error:", err);
      onTriggerToast(`Failed to generate Excel workbook: ${String(err)}`, 'error');
    }
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
      
      {/* Mobile Top Sub-Header Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Panel</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {activeTab === 'analytics' && 'Admin Metrics'}
            {activeTab === 'users' && 'Users Registry'}
            {activeTab === 'cms' && 'Articles Publisher'}
            {activeTab === 'broadcaster' && 'Broadcaster Desk'}
            {activeTab === 'faq' && 'FAQ Composer'}
            {activeTab === 'auditing' && 'Audit Diagnostics'}
            {activeTab === 'forums' && 'Support Forums'}
            {activeTab === 'department_head' && 'Department Head'}
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Open Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Slide-out Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[11000] md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg">
                      CFL
                    </div>
                    <span className="font-sans font-bold text-slate-900 dark:text-white">Admin Portals</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button 
                    onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'analytics' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Admin Metrics console</span>
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Users Registry</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('cms'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'cms' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Articles Publisher</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('broadcaster'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'broadcaster' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Broadcaster Desk</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('faq'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'faq' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>FAQ Composer</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('auditing'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'auditing' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Audit Diagnostics</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('forums'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'forums' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Support Forums</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('department_head'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'department_head' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Department Head Desk</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 text-center">
                <span className="text-[9px] text-slate-400 font-mono">CFL Core Secure Platform v2.4</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Admin navigation rails sidebar */}
      <aside className="hidden md:flex w-full md:w-56 border-b md:border-b-0 md:border-r bg-white dark:bg-slate-900 p-4 space-y-1.5 md:flex-col shrink-0">
        <div className="w-full space-y-1">
          <button 
            id="tab-adm-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'analytics' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Admin Metrics console</span>
          </button>
          
          <button 
            id="tab-adm-users"
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            <span>Users Registry</span>
          </button>

          <button 
            id="tab-adm-cms"
            onClick={() => setActiveTab('cms')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'cms' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4" />
            <span>Articles Publisher</span>
          </button>

          <button 
            id="tab-adm-broadcaster"
            onClick={() => setActiveTab('broadcaster')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'broadcaster' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Bell className="w-4 h-4" />
            <span>Broadcaster Desk</span>
          </button>

          <button 
            id="tab-adm-faq"
            onClick={() => setActiveTab('faq')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'faq' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ Composer</span>
          </button>

          <button 
            id="tab-adm-auditing"
            onClick={() => setActiveTab('auditing')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'auditing' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Globe className="w-4 h-4" />
            <span>Audit Diagnostics</span>
          </button>

          <button 
            id="tab-adm-forums"
            onClick={() => setActiveTab('forums')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'forums' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            <span>Support Forums</span>
          </button>

          <button 
            id="tab-adm-department-head"
            onClick={() => setActiveTab('department_head')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'department_head' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Department Head Desk</span>
          </button>
        </div>
      </aside>

      {/* Admin tabs rendering viewport */}
      <div className="flex-1 overflow-y-auto p-6 text-slate-800 dark:text-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="space-y-6"
          >
        
        {/* TAB 1: Admin Performance KPIs & Telemetry charts */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            <div className="bg-slate-950 text-emerald-100 rounded-2xl shadow-xl p-6 border border-emerald-900/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 w-48">
                <Layout className="w-full h-full text-emerald-50" />
              </div>
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Super Administrator Terminal</span>
                  <h2 className="font-display text-xl font-bold mt-2.5">Platform Operations Telemetry Controls</h2>
                  <p className="text-xs text-emerald-300 mt-1">Audit active registration lists, license credential verifications, and deploy system-wide broadcasts.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportSystemDataExcel}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 self-start sm:self-center"
                  title="Export complete system state (users, logs, audit trails, appointments) to Excel document"
                >
                  <Download className="w-4 h-4" />
                  <span>Export System Excel (.xlsx)</span>
                </button>
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
                <div className="text-[9px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">Licenses audited</div>
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

            {/* 🩺 Cardiovascular Blood Pressure Longitudinal Telemetry Line Chart */}
            <motion.div
              id="admin-blood-pressure-trends-chart"
              initial={{ opacity: 0, y: 22, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartPulse className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                    <span>Blood Pressure Longitudinal Trends (Systolic & Diastolic)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Telemetry visualizer tracking arterial pressure oscillations, clinical thresholds, and high-risk hypertensive spikes over time.
                  </p>
                </div>

                {/* Filter and threshold controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Patient Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-xl">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      id="admin-bp-patient-select"
                      value={bpPatientFilter}
                      onChange={(e) => setBpPatientFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-1"
                      title="Filter blood pressure trends by patient cohort"
                    >
                      <option value="all" className="text-slate-900">All Patients ({bloodPressureData.length} Vitals)</option>
                      {patients.map(p => {
                        const count = bloodPressureData.filter(d => d.patientId === p.id).length;
                        return (
                          <option key={p.id} value={p.id} className="text-slate-900">
                            {p.name} ({count} logs)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Time Range Filter: 7-day, 30-day, All-time */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Window:</span>
                    <select
                      id="admin-bp-timerange-select"
                      value={bpTimeRange}
                      onChange={(e) => setBpTimeRange(e.target.value as '7-day' | '30-day' | 'All-time')}
                      className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                      title="Switch between 7-day, 30-day, and All-time longitudinal views"
                    >
                      <option value="7-day" className="text-slate-900">7-day</option>
                      <option value="30-day" className="text-slate-900">30-day</option>
                      <option value="All-time" className="text-slate-900">All-time</option>
                    </select>
                  </div>

                  {/* Reference Guidelines Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowBpRefLines(!showBpRefLines)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      showBpRefLines 
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Toggle clinical High Risk reference areas and guidelines"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>High Risk Zones {showBpRefLines ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Statistical Metrics KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-50/60 dark:bg-slate-950/25 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-rose-500 tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    Mean Systolic
                  </span>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    {bpStats.avgSystolic > 0 ? `${bpStats.avgSystolic} mmHg` : '--'}
                  </p>
                  <span className="text-[9px] text-slate-400 block font-mono">Normal &lt;120 mmHg</span>
                </div>

                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Mean Diastolic
                  </span>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    {bpStats.avgDiastolic > 0 ? `${bpStats.avgDiastolic} mmHg` : '--'}
                  </p>
                  <span className="text-[9px] text-slate-400 block font-mono">Normal &lt;80 mmHg</span>
                </div>

                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider">Mean Arterial (MAP)</span>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    {bpStats.avgMAP > 0 ? `${bpStats.avgMAP} mmHg` : '--'}
                  </p>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-mono">Target: 70–100 mmHg</span>
                </div>

                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-amber-500 tracking-wider">Elevated / High Risk</span>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    {bpStats.highRiskCount} <span className="text-xs font-semibold text-slate-400">readings</span>
                  </p>
                  <span className="text-[9px] text-amber-500 block font-mono">
                    {bpStats.count > 0 ? `${Math.round((bpStats.highRiskCount / bpStats.count) * 100)}% of cohort` : '0%'}
                  </span>
                </div>

                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3 col-span-2 sm:col-span-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Readings</span>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    {bpStats.count} <span className="text-xs font-semibold text-slate-400">records</span>
                  </p>
                  <span className="text-[9px] text-slate-400 block font-mono truncate">
                    {bpStats.latest ? `Latest: ${bpStats.latest.systolic}/${bpStats.latest.diastolic} mmHg` : 'Awaiting input'}
                  </span>
                </div>
              </div>

              {/* The Recharts Line Chart Container with Motion Reveal Animation */}
              <motion.div 
                key={`${bpTimeRange}-${bpPatientFilter}`}
                initial={{ opacity: 0, scale: 0.995 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full h-[290px] md:h-[350px]"
              >
                {filteredBloodPressureData.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 space-y-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800">
                    <HeartPulse className="w-10 h-10 text-slate-300 dark:text-slate-600 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Blood Pressure Telemetry Found</p>
                      <p className="text-[11px] text-slate-400 max-w-md">
                        {bpPatientFilter !== 'all' 
                          ? 'Selected patient has no recorded blood pressure entries matching this filter window.' 
                          : 'Blood pressure readings recorded via clinical logs or patient Ahomka check-ins will visualize automatically.'}
                      </p>
                    </div>
                    {bpPatientFilter !== 'all' && (
                      <button
                        onClick={() => setBpPatientFilter('all')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Reset to All Patients Cohort
                      </button>
                    )}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredBloodPressureData}
                      margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                      <XAxis 
                        dataKey="displayDate" 
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
                        domain={[
                          (dataMin: number) => Math.max(40, Math.floor((dataMin - 15) / 10) * 10),
                          (dataMax: number) => Math.min(220, Math.ceil((dataMax + 15) / 10) * 10)
                        ]}
                        unit=" mmHg"
                      />
                      <Tooltip content={<BloodPressureCustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10.5px', fontWeight: 'bold' }} 
                      />

                      {/* Clinical Reference Areas & Threshold Lines */}
                      {showBpRefLines && (
                        <>
                          {/* 🔴 High Risk Systolic Reference Area (≥140 mmHg) */}
                          <ReferenceArea 
                            y1={140} 
                            y2={220} 
                            {...({
                              fill: '#ef4444',
                              fillOpacity: 0.065,
                              stroke: '#ef4444',
                              strokeOpacity: 0.25,
                              strokeDasharray: '3 3'
                            } as any)}
                          />

                          {/* 🟠 High Risk Diastolic Reference Area (≥90 mmHg) */}
                          <ReferenceArea 
                            y1={90} 
                            y2={135} 
                            {...({
                              fill: '#f97316',
                              fillOpacity: 0.05,
                              stroke: '#f97316',
                              strokeOpacity: 0.22,
                              strokeDasharray: '3 3'
                            } as any)}
                          />

                          {/* 🟢 Optimal Diastolic Target Area (60–80 mmHg) */}
                          <ReferenceArea 
                            y1={60} 
                            y2={80} 
                            {...({
                              fill: '#10b981',
                              fillOpacity: 0.035,
                              stroke: '#10b981',
                              strokeOpacity: 0.15,
                              strokeDasharray: '2 2'
                            } as any)}
                          />

                          {/* Reference Lines with High-Visibility Clinical Labels */}
                          <ReferenceLine 
                            y={140} 
                            stroke="#ef4444" 
                            strokeDasharray="4 4" 
                            strokeWidth={1.5}
                            label={{ 
                              value: '⚠ Systolic High Risk (≥140 mmHg)', 
                              position: 'insideTopRight', 
                              fill: '#ef4444', 
                              fontSize: 9.5, 
                              fontWeight: 'bold' 
                            }} 
                          />
                          <ReferenceLine 
                            y={130} 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                            strokeWidth={1}
                            label={{ 
                              value: 'Stage 1 Systolic (≥130 mmHg)', 
                              position: 'insideTopRight', 
                              fill: '#f59e0b', 
                              fontSize: 9 
                            }} 
                          />
                          <ReferenceLine 
                            y={90} 
                            stroke="#f97316" 
                            strokeDasharray="4 4" 
                            strokeWidth={1.5}
                            label={{ 
                              value: '⚠ Diastolic High Risk (≥90 mmHg)', 
                              position: 'insideBottomRight', 
                              fill: '#f97316', 
                              fontSize: 9.5, 
                              fontWeight: 'bold' 
                            }} 
                          />
                          <ReferenceLine 
                            y={80} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3" 
                            strokeWidth={1}
                            label={{ 
                              value: 'Normal Diastolic Baseline (80 mmHg)', 
                              position: 'insideBottomRight', 
                              fill: '#3b82f6', 
                              fontSize: 9 
                            }} 
                          />
                        </>
                      )}

                      <Line
                        type="monotone"
                        name="Systolic Blood Pressure (mmHg)"
                        dataKey="systolic"
                        stroke="#ef4444"
                        strokeWidth={2.75}
                        dot={{ r: 4.5, strokeWidth: 1.5, fill: '#ef4444' }}
                        activeDot={{ r: 6.5, strokeWidth: 2, fill: '#dc2626', stroke: '#ffffff' }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                      <Line
                        type="monotone"
                        name="Diastolic Blood Pressure (mmHg)"
                        dataKey="diastolic"
                        stroke="#3b82f6"
                        strokeWidth={2.75}
                        dot={{ r: 4.5, strokeWidth: 1.5, fill: '#3b82f6' }}
                        activeDot={{ r: 6.5, strokeWidth: 2, fill: '#2563eb', stroke: '#ffffff' }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* AHA/ACC Clinical Stages Reference Legend & Risk Zones Note */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-400">AHA/ACC Classification:</span>
                  <span className="hidden sm:inline text-slate-400">Shaded background zones denote high-risk thresholds</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-900/40">
                    Normal: &lt;120 / &lt;80
                  </span>
                  <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 px-2 py-0.5 rounded font-semibold border border-yellow-200 dark:border-yellow-900/40">
                    Elevated: 120–129 / &lt;80
                  </span>
                  <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded font-semibold border border-amber-200 dark:border-amber-900/40">
                    Stage 1 HTN: 130–139 / 80–89
                  </span>
                  <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded font-semibold border border-rose-200 dark:border-rose-900/40">
                    Stage 2 HTN: ≥140 / ≥90
                  </span>
                </div>
              </div>
            </motion.div>

            {/* User Engagement & Platform Activity Line Chart Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-xl text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
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
                  <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-semibold block">HIPAA audits logged</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Peak Daily Users</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{peakUsers}</p>
                  <span className="text-[9px] text-green-500 dark:text-green-400 font-semibold block">Concurrent session keys</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Average Active Users</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{avgUsers}</p>
                  <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-semibold block">Rolling active standard</span>
                </div>
              </div>

              {/* The Recharts Line Chart */}
              <div className="w-full h-[260px] md:h-[300px]">
                {slicedData.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800">
                    <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Platform Activity Telemetry</p>
                    <p className="text-[10px] text-slate-400">User engagement metrics and audit activities will chart automatically as actions occur.</p>
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            {/* Weekly Trend of Newly Escalated Complaints Line Chart Section */}
            <div id="weekly-escalated-complaints-trend" className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                  <span>Weekly Trend of Newly Escalated Complaints (Last 30 Days)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rolling weekly analysis tracking the volume of newly escalated grievance reports, unresolved cases, and clinical response performance times.
                </p>
              </div>

              {/* Weekly Mini Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Escalations</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{totalEscalations} cases</p>
                  <span className="text-[9px] text-rose-500 font-semibold block">HIPAA & billing grievances</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-4">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Resolved Escalations</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{resolvedEscalations} cases</p>
                  <span className="text-[9px] text-green-500 font-semibold block">Average {resolutionRate}% resolution rate</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-4">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unresolved/Pending</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{unresolvedEscalations} cases</p>
                  <span className="text-[9px] text-amber-500 font-semibold block">Under clinical review</span>
                </div>
                <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-4">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Avg Response Time</span>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{avgResponseTime} hours</p>
                  <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-semibold block">Real-time alerts triggered</span>
                </div>
              </div>

              {/* Weekly Trend Recharts Line Chart */}
              <div className="w-full h-[260px] md:h-[300px]">
                {(!weeklyComplaints || weeklyComplaints.length === 0) ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800">
                    <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Weekly Escalations Logged</p>
                    <p className="text-[10px] text-slate-400">Escalation and resolution trends will plot here as entries are created in the database.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyComplaints}
                      margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                      <XAxis 
                        dataKey="week" 
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
                        name="Escalated Complaints"
                        dataKey="escalated"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1.5 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        name="Resolved Complaints"
                        dataKey="resolved"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1.5 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        name="Response Time (hrs)"
                        dataKey="avgResponseHours"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, strokeWidth: 1.5 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
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
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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

            {/* 🛠️ Live Telemetry & Database Management */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Real-Time Database Telemetry Controls</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Directly modify live complaints and user engagement parameters in the PostgreSQL database.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onUpdateWeeklyComplaints([]);
                      onTriggerToast('Reset complaints database table to baseline state.', 'info');
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-350 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Clear complaints records"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear Database</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly complaints database adjustments */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Grievance & Escalation Sliders</span>
                  <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                    {weeklyComplaints.map((item, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{item.week}</span>
                          <span className="text-[10px] font-mono text-slate-400">Response: {item.avgResponseHours}h</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Escalated: {item.escalated}</label>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={item.escalated}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const updated = [...weeklyComplaints];
                                updated[index] = { ...item, escalated: val };
                                onUpdateWeeklyComplaints(updated);
                              }}
                              className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Resolved: {item.resolved}</label>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={item.resolved}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const updated = [...weeklyComplaints];
                                updated[index] = { ...item, resolved: val };
                                onUpdateWeeklyComplaints(updated);
                              }}
                              className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-550"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add new week button */}
                    <button
                      onClick={() => {
                        const nextNum = weeklyComplaints.length + 1;
                        const newWeek: WeeklyComplaint = {
                          week: `W${nextNum} (Rolling Analysis)`,
                          escalated: Math.floor(Math.random() * 10) + 2,
                          resolved: Math.floor(Math.random() * 8) + 1,
                          avgResponseHours: parseFloat((Math.random() * 3 + 1.5).toFixed(1))
                        };
                        onUpdateWeeklyComplaints(prev => [...prev, newWeek]);
                        onTriggerToast(`Appended new week W${nextNum} complaints record into Database!`, 'success');
                      }}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log New Complaints Week</span>
                    </button>
                  </div>
                </div>

                {/* Engagement telemetry adjustments */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Traffic & Engagement Telemetry</span>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Traffic Control (Last Entry)</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                          {engagementData[engagementData.length - 1]?.date || 'N/A'}
                        </span>
                      </div>
                      
                      {engagementData.length > 0 && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>ACTIVE PORTAL USERS</span>
                              <span>{engagementData[engagementData.length - 1].activeUsers} Users</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="150"
                              value={engagementData[engagementData.length - 1].activeUsers}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const updated = [...engagementData];
                                updated[updated.length - 1] = { ...updated[updated.length - 1], activeUsers: val };
                                onUpdateEngagementData(updated);
                              }}
                              className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-550"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>SECURE PLATFORM ACTIONS</span>
                              <span>{engagementData[engagementData.length - 1].platformActions} Actions</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="1000"
                              value={engagementData[engagementData.length - 1].platformActions}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const updated = [...engagementData];
                                updated[updated.length - 1] = { ...updated[updated.length - 1], platformActions: val };
                                onUpdateEngagementData(updated);
                              }}
                              className="w-full h-1 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inject daily traffic mock */}
                    <button
                      onClick={() => {
                        const lastEntry = engagementData[engagementData.length - 1];
                        const dateParts = lastEntry ? lastEntry.date.split(' ') : ['Jun', '08'];
                        const nextDay = lastEntry ? parseInt(dateParts[1]) + 1 : 9;
                        const dateStr = `${dateParts[0]} ${nextDay < 10 ? '0' + nextDay : nextDay}`;
                        
                        const newTraffic: EngagementDataPoint = {
                          date: dateStr,
                          activeUsers: Math.floor(Math.random() * 40) + 40,
                          platformActions: Math.floor(Math.random() * 300) + 400
                        };
                        onUpdateEngagementData(prev => [...prev, newTraffic]);
                        onTriggerToast(`Injected dynamic database record for ${dateStr}!`, 'success');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inject Next Day's Traffic</span>
                    </button>
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
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
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
                      <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-2.5">Timeline</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Recorded Value</th>
                        <th className="px-4 py-2.5">Trend Vector</th>
                        <th className="px-4 py-2.5">Witness/Logger</th>
                        <th className="px-4 py-2.5">Annotations</th>
                        <th className="px-4 py-2.5 text-right">Clinical Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-200">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 text-slate-950 dark:text-white whitespace-nowrap font-bold text-[11px]">{log.timestamp}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{log.metric}</td>
                          <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">{log.value}</td>
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
                          <td className="px-4 py-3 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-400" title={log.notes}>{log.notes || 'No notes.'}</td>
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
                  <FileText className="w-4 h-4 text-emerald-600" />
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
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none font-sans cursor-pointer"
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
            
            {/* Header section with Sub-tab selectors */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Outpatient Identity & Registry Controls
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Manage patient baselines, clinician licensing, and moderating sub-administrators</p>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950/60 font-sans self-start select-none">
                <button
                  type="button"
                  onClick={() => setActiveRegistrySubTab('patients')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeRegistrySubTab === 'patients' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Patients
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRegistrySubTab('providers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeRegistrySubTab === 'providers' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Providers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRegistrySubTab('sub_admins')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeRegistrySubTab === 'sub_admins' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Sub Admins
                </button>
              </div>
            </div>

            {/* Active Session Protection Hub banner */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                  ACTIVE SESSION PROTECTION HUB
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  Active Cryptographic Isolated Tunnels: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{loggedInUserIds.length} users active</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Data boundary verification audited under active HIPAA privacy frameworks.
                </p>
              </div>

              {onSimulateTokenRefresh && (
                <button
                  onClick={onSimulateTokenRefresh}
                  className="py-1.5 px-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] hover:bg-slate-50 font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none"
                  title="Rotate global keys for all active sessions"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                  <span>Rotate Cryptographic Keys</span>
                </button>
              )}
            </div>

            {/* Provisioning Panels */}
            {activeRegistrySubTab === 'patients' && (session.role === 'admin') && (
              <div className="bg-emerald-50/30 dark:bg-slate-900/40 p-5 rounded-xl border border-emerald-100 dark:border-slate-800 space-y-4 font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 animate-pulse"></span>
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                      Provision New Patient Profile
                    </h5>
                    <p className="text-[10px] text-slate-400">Instantly authorize and dispatch secure, audited credentials for a new patient including baseline socio-demographical attributes.</p>
                  </div>
                </div>

                <form onSubmit={handleAdminAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {/* System User ID & First Name */}
                  <div className="space-y-1 col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-mono">User ID (0001-9999)</label>
                      <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded">Auto / 4-Digit</span>
                    </div>
                    <input 
                      type="text" 
                      value={regCustomUserId} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setRegCustomUserId(val);
                      }}
                      placeholder={`Auto: ${generateUserId(users)}`}
                      maxLength={4}
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-emerald-300 dark:border-emerald-700/60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">First Name</label>
                    <input 
                      type="text" required value={regFirstName} 
                      onChange={(e) => {
                        setRegFirstName(e.target.value);
                        setNewUserName(`${e.target.value} ${regLastName}`.trim());
                      }}
                      placeholder="e.g. Ama"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Last Name</label>
                    <input 
                      type="text" required value={regLastName} 
                      onChange={(e) => {
                        setRegLastName(e.target.value);
                        setNewUserName(`${regFirstName} ${e.target.value}`.trim());
                      }}
                      placeholder="e.g. Serwaa"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
                    <input 
                      type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. ama.serwaa@example.com"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Access Password</label>
                    <input 
                      type="text" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="e.g. Ghana_Ahomka_24"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Sex</label>
                    <select 
                      value={regSex} 
                      onChange={(e) => {
                        setRegSex(e.target.value);
                        setRegGender(e.target.value);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Date of Birth (DOB)</label>
                    <input 
                      type="date" 
                      required 
                      value={regDob} 
                      onChange={(e) => {
                        const newDob = e.target.value;
                        setRegDob(newDob);
                        if (newDob) {
                          const birth = new Date(newDob);
                          if (!isNaN(birth.getTime())) {
                            const today = new Date();
                            let age = today.getFullYear() - birth.getFullYear();
                            const m = today.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                            if (age >= 0 && age <= 130) setRegAge(String(age));
                          }
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Age (Years)</label>
                    <input 
                      type="number" required value={regAge} onChange={(e) => setRegAge(e.target.value)}
                      placeholder="e.g. 38" min="1" max="110"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Marital Status</label>
                    <select value={regMarital} onChange={(e) => setRegMarital(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="Married">Married</option>
                      <option value="Single">Single</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Employment Status</label>
                    <select value={regEmployment} onChange={(e) => setRegEmployment(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="Employed">Employed / Salaried</option>
                      <option value="Self-Employed">Self-Employed / Trader</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Retired">Retired / Pensioner</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Preferred Language</label>
                    <select value={regLanguage} onChange={(e) => setRegLanguage(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Twi">Twi (Akan)</option>
                      <option value="Ga">Ga</option>
                      <option value="Ewe">Ewe</option>
                      <option value="French">French</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Education Level</label>
                    <select value={regEducation} onChange={(e) => setRegEducation(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="Tertiary Degree">Tertiary / University Degree</option>
                      <option value="Secondary Education">Secondary / High School</option>
                      <option value="Vocational / Technical">Vocational / Technical</option>
                      <option value="Primary Education">Primary Education</option>
                      <option value="Postgraduate Degree">Postgraduate / Doctorate</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Street Address</label>
                    <input 
                      type="text" required value={regStreet} onChange={(e) => setRegStreet(e.target.value)}
                      placeholder="e.g. 15 Giffard Road"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] transition-all text-left"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">City / Suburb</label>
                    <input 
                      type="text" required value={regCity} onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. Cantonments"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] transition-all text-left"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">State / Region & Zip</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" required value={regState} onChange={(e) => setRegState(e.target.value)}
                        placeholder="Greater Accra"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2 rounded-lg text-xs text-slate-900 dark:text-gray-100 focus:outline-none h-[34px]"
                      />
                      <input 
                        type="text" required value={regZip} onChange={(e) => setRegZip(e.target.value)}
                        placeholder="00233"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2 rounded-lg text-xs text-slate-900 dark:text-gray-100 focus:outline-none h-[34px]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setRegFirstName('Bernice');
                        setRegLastName('Mensah');
                        setNewUserName('Bernice Mensah');
                        setNewUserEmail('bernice.mensah@gmail.com');
                        setNewUserPassword('GhanaAhomka_99');
                        setRegSex('Female');
                        setRegGender('Female');
                        setRegDob('1982-08-20');
                        setRegAge('42');
                        setRegStreet('12 Castle Road');
                        setRegCity('Osu');
                        setRegMarital('Married');
                        setRegEmployment('Employed');
                        setRegLanguage('English');
                        onTriggerToast('Autofilled real baseline diagnostics parameters!', 'info');
                      }}
                      className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-705 dark:text-slate-100 rounded-lg text-[10px] font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      Pre-fill Clinical Baseline Demo
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Provision Real Patient Account</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeRegistrySubTab === 'providers' && (session.role === 'admin') && (
              <div className="bg-emerald-50/30 dark:bg-slate-900/40 p-5 rounded-xl border border-emerald-100 dark:border-slate-800 space-y-4 font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                      Provision New Clinical Provider Workspace
                    </h5>
                    <p className="text-[10px] text-slate-400">Add verified medical practitioners, cardiac doctors, or diagnostic officers to the active directories.</p>
                  </div>
                </div>

                <form onSubmit={handleAdminAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Doctor Name</label>
                    <input 
                      type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Dr. Frank Jenkins"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
                    <input 
                      type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. jenkins@curaflow.com"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Access Token / Password</label>
                    <input 
                      type="text" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="e.g. ClinicalSecure_24"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Medical Specialty</label>
                    <select value={regSpecialty} onChange={(e) => setRegSpecialty(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="Cardiology Specialist">Cardiology & Hypertension Specialist</option>
                      <option value="General Family Medicine">General Outpatient Family Medicine</option>
                      <option value="Endocrine & Diabetes Unit">Endocrine & Diabetes Unit</option>
                      <option value="Pediatric Care">Pediatrics Specialist</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Affiliated Primary Hospital Centre</label>
                    <select value={regHospital} onChange={(e) => setRegHospital(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-905 dark:text-gray-100 h-[34px] cursor-pointer"
                    >
                      <option value="Korle-Bu Teaching Hospital">Korle-Bu Teaching Hospital (KBTH)</option>
                      <option value="37 Military Medical Complex">37 Military Medical Complex</option>
                      <option value="Nyaho Medical Centre">Nyaho Medical Centre</option>
                      <option value="Greater Accra Regional Hospital">Greater Accra Regional Hospital (Ridge)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">City Location</label>
                    <input 
                      type="text" required value={regCity} onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. Accra"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] transition-all text-left"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Region Area</label>
                    <input 
                      type="text" required value={regState} onChange={(e) => setRegState(e.target.value)}
                      placeholder="e.g. Greater Accra"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] transition-all text-left"
                    />
                  </div>

                  <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="submit"
                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Provision Medical Dr / Specialist</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeRegistrySubTab === 'sub_admins' && (
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 dark:bg-slate-400 shrink-0"></span>
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                      Provision New Sub-Admin Dashboard Profile
                    </h5>
                    {session.isSuperAdmin ? (
                      <p className="text-[10px] text-slate-400">Directly delegate administrative assistance credentials. Sub-admins can moderate registry directories but are barred from editing master logs.</p>
                    ) : (
                      <p className="text-[10px] text-rose-500 font-extrabold uppercase">Access Control Warning: ONLY the system Super-Administrator can create sub-admins.</p>
                    )}
                  </div>
                </div>

                {session.isSuperAdmin ? (
                  <form onSubmit={handleAdminAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Officer Name</label>
                      <input 
                        type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Carl Peterson"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Email Address</label>
                      <input 
                        type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="e.g. carl.admin@curaflow.com"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Temporary Password</label>
                      <input 
                        type="text" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="e.g. SubAdminSecure_24"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 transition-all shadow-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Assigned Operations Department</label>
                      <select value={regSpecialty} onChange={(e) => setRegSpecialty(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-gray-100 h-[34px] cursor-pointer"
                      >
                        <option value="Auditing & Clinical Compliance Division">Auditing & Clinical Compliance Unit</option>
                        <option value="Customer Support Desk">Patient Support & Intake Moderator</option>
                        <option value="Content Moderation">CMS Content & FAQ Moderation</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 font-sans">
                      <button
                        type="submit"
                        className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Provision Sub-Admin Profile</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg text-xs text-red-700 leading-relaxed font-semibold font-sans">
                    You do not possess the required Super-Administrator boundaries to delegate admin portals. Please contact Lord Eddy Boltzmann to request clinical role elevations first.
                  </div>
                )}
              </div>
            )}
               {/* List Table based on selection */}
            <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[9px] text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 tracking-wider">
                    <th className="px-5 py-3 font-mono">Member Details</th>
                    
                    {activeRegistrySubTab === 'patients' && (
                      <>
                        <th className="px-5 py-3 font-mono">Baseline Demography</th>
                        <th className="px-5 py-3 font-mono">Residence Address</th>
                        <th className="px-5 py-3 font-mono">Last Biometric Log Reading</th>
                      </>
                    )}

                    {activeRegistrySubTab === 'providers' && (
                      <>
                        <th className="px-5 py-3 font-mono">Clinical Specialty</th>
                        <th className="px-5 py-3 font-mono">Primary Station</th>
                        <th className="px-5 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">Licensing verification</th>
                      </>
                    )}

                    {activeRegistrySubTab === 'sub_admins' && (
                      <>
                        <th className="px-5 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">Operations Focus</th>
                        <th className="px-5 py-3 font-mono">Socio-Status</th>
                        <th className="px-5 py-3 font-mono">Tunnels Active</th>
                      </>
                    )}

                    <th className="px-5 py-3 font-mono">Session Gate</th>
                    <th className="px-5 py-3 text-right font-mono text-slate-400">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {users.filter(u => {
                    if (activeRegistrySubTab === 'patients') return u.role === 'patient';
                    if (activeRegistrySubTab === 'providers') return u.role === 'provider';
                    if (activeRegistrySubTab === 'sub_admins') return u.role === 'admin' && !u.isSuperAdmin;
                    return true;
                  }).map(u => {
                    // Extract patient biometric logs summary
                    const patientLogs = logs.filter(l => l.patientId === u.id);
                    const lastBP = patientLogs.find(l => l.metric === 'Blood Pressure')?.value || null;
                    const lastGlu = patientLogs.find(l => l.metric === 'Blood Glucose')?.value || null;
                    const lastPulse = patientLogs.find(l => l.metric === 'Heart Rate')?.value || null;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs uppercase shrink-0">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-805 dark:text-white flex items-center gap-1.5 leading-tight">
                                {u.name}
                                {u.isSuperAdmin && (
                                  <span className="text-[8px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">Super</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {activeRegistrySubTab === 'patients' && (
                          <>
                            <td className="px-5 py-3.5">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800 dark:text-slate-205">{u.age || '38'} yrs · {u.gender || 'Female'}</p>
                                <p className="text-[9px] text-slate-400 font-medium tracking-wide uppercase font-mono">{u.preferredLanguage || 'English'} ({u.maritalStatus || 'Married'})</p>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <p className="font-medium text-slate-800 dark:text-slate-205 max-w-[150px] truncate" title={`${u.addressStreet || '34 Giffard Road'}, ${u.addressCity || 'Cantonments'}`}>
                                {u.addressStreet || '34 Giffard Road'}, {u.addressCity || 'Cantonments'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              {patientLogs.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                                  {lastBP && (
                                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                                      BP: {lastBP}
                                    </span>
                                  )}
                                  {lastGlu && (
                                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                                      BG: {lastGlu} mg/dL
                                    </span>
                                  )}
                                  {lastPulse && (
                                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                                      HR: {lastPulse} bpm
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 italic font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  <span>No Biometrics logged</span>
                                </div>
                              )}
                            </td>
                          </>
                        )}

                        {activeRegistrySubTab === 'providers' && (
                          <>
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-slate-805 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                                <Stethoscope className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {u.insuranceProvider || 'General Family Medicine'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <p className="font-semibold text-slate-800 dark:text-slate-300">{u.insuranceMemberId || 'Korle-Bu Teaching Hospital (KBTH)'}</p>
                              <p className="text-[9px] text-slate-404 text-slate-400 font-mono tracking-wider">{u.addressCity || 'Accra'}, {u.addressState || 'Greater Accra'}</p>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black ${u.verified ? 'bg-emerald-50 dark:bg-emerald-950/20 text-green-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-amber-700 dark:text-amber-400 animate-pulse'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.verified ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                {u.verified ? 'Verified License' : 'Pending Verification'}
                              </span>
                            </td>
                          </>
                        )}

                        {activeRegistrySubTab === 'sub_admins' && (
                          <>
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-slate-800 dark:text-slate-205">{u.insuranceProvider || 'Auditing & Clinical Compliance Division'}</p>
                              <p className="text-[9px] text-emerald-500 font-mono tracking-wider font-bold">SECURE LEVEL-1 ACCESS</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-slate-800 dark:text-slate-200 font-semibold">{u.age || '40'} · {u.gender || 'Female'}</p>
                              <p className="text-[9px] text-slate-400 font-semibold">{u.maritalStatus || 'Married'}</p>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">Isolated Link OK</span>
                            </td>
                          </>
                        )}

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {(() => {
                            const isActive = loggedInUserIds.includes(u.id);
                            return (
                              <div className="flex flex-col">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black w-fit ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-green-200 text-green-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-505 text-slate-500 dark:text-slate-400'}`}>
                                  <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                  {isActive ? 'Encrypted Active' : 'Encrypted Not Active'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pl-1 font-mono">
                                  {isActive ? 'Logged In' : 'Logged Out'}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {u.role === 'patient' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLogReadingsPatient(u);
                                  setAdminSys1(120);
                                  setAdminSys2(120);
                                  setAdminSys3(120);
                                  setAdminDia1(80);
                                  setAdminDia2(80);
                                  setAdminDia3(80);
                                  setAdminPulse1(72);
                                  setAdminPulse2(72);
                                  setAdminPulse3(72);
                                  setReadGlucose('');
                                  setReadMood(8);
                                  setReadStress(3);
                                  setReadPain(1);
                                  setReadSymptoms(['Normal / Stable']);
                                  setReadAdherence('Full Adherence');
                                  setReadNotes('');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Log BP, heart rate, symptoms & vitals for this patient"
                              >
                                <Activity className="w-3 h-3" />
                                <span>Log Readings</span>
                              </button>
                            )}

                            {/* Socio-demographic detail view - accessible for super admin and sub-administrator alike */}
                            <button
                              type="button"
                              onClick={() => setSelectedProfileUser(u)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/35 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-900/60 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                              title="Show detailed sociodemographic and baseline diagnostics summary"
                            >
                              Socio-Demog Profile
                            </button>

                            {u.role === 'provider' && !u.verified && (
                              <button 
                                onClick={() => {
                                  onVerifyClinician(u.id);
                                  onTriggerToast(`Licensed clinician successfully validated: ${u.name}`, 'success');
                                }}
                                className="bg-emerald-600 text-white px-2 py-1 font-extrabold rounded hover:bg-emerald-700 text-[10px] transition cursor-pointer shadow-xs"
                              >
                                Approve License
                              </button>
                            )}

                            {u.id !== session.id && (
                              <>
                                <button 
                                  onClick={() => {
                                    onModifyUserStatus(u.id, u.status !== 'Suspended');
                                    onTriggerToast(`Lock status toggled: ${u.name}`, 'info');
                                  }}
                                  className={`px-2 py-1 text-[10px] font-bold rounded transition cursor-pointer ${u.status === 'Suspended' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 dark:text-red-400'}`}
                                >
                                  {u.status === 'Suspended' ? 'Restore Workspace' : 'Suspend Account'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setPendingDeleteUser(u)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded inline-flex items-center gap-1 transition bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/25 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                                  title="Purge profile"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete Profile</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty table fallback state */}
            {users.filter(u => {
              if (activeRegistrySubTab === 'patients') return u.role === 'patient';
              if (activeRegistrySubTab === 'providers') return u.role === 'provider';
              if (activeRegistrySubTab === 'sub_admins') return u.role === 'admin' && !u.isSuperAdmin;
              return true;
            }).length === 0 && (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl">
                <Users className="w-7 h-7 text-slate-300 mx-auto opacity-50 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-202">No members match this subdirectory index yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Utilize the provisioning template above to securely dispatch credentials.</p>
              </div>
            )}
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
                  className="w-full py-2 bg-emerald-600 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
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
                  <div key={art.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs transition hover:border-emerald-200">
                    <div className="space-y-1.5 max-w-md">
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase">{art.category}</span>
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
                        className={`p-1 px-3.5 rounded text-[10px] font-bold transition ${art.isArchived ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'}`}
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
            <div className="bg-slate-950 text-purple-100 rounded-2xl p-6 shadow-xl border border-purple-900/45 self-start space-y-4">
              <div>
                <h4 className="font-bold text-xs text-purple-50">Transmit Emergency Broadcast Notice</h4>
                <p className="text-[10px] text-purple-200 mt-1">Simulates pushing an instant alert warning dynamically across screens</p>
              </div>

              <form onSubmit={handleTransmitBroadcast} className="space-y-3.5">
                <textarea 
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="e.g. NOTICE: Multi-variant flu immunization schedules are now available in card divisions..."
                  className="w-full bg-purple-900/40 rounded-xl p-3 text-xs text-white border-none focus:ring-1 focus:ring-purple-300 placeholder-purple-400"
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

                  <button type="submit" className="bg-emerald-600 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-xs transition">
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
                        <span className="text-[8.5px] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded capitalize">Target: {an.targetRole}</span>
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
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition">
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
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Q:</span>
                      <span>{f.question}</span>
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 pl-4">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: HIPAA Diagnostics and telemetries audit Sequential trails */}
        {activeTab === 'auditing' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-5 font-sans">
            <div className="flex justify-between items-center pb-2 border-b shrink-0">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-4.5 h-4.5 text-emerald-600" />
                  <span>HIPAA Compliance Diagnostics & Administration Hub</span>
                </h4>
                <p className="text-[10px] text-slate-400">Chronological telemetry trails, interactive CSV data extraction, and role compliance permissions grid</p>
              </div>
              <span className="text-[9px] font-mono select-none px-2.5 py-1 rounded bg-slate-900 text-slate-100 font-bold">Standard format trail</span>
            </div>

            {/* GRID OF COMPLIANCE CONTROLS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
              
              {/* PANEL 1: Interactive Data Extraction Suite */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-4 text-xs">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">HIPAA Secure Dataset Extraction Suite</h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-none">Download cryptographically isolated CSV or JSON summaries</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Data Stream Scope</label>
                    <select
                      value={exportDataType}
                      onChange={(e: any) => setExportDataType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="all">Comprehensive Bundle (All)</option>
                      <option value="patients">Secured Patient Registry</option>
                      <option value="logs">Clinical Biometric Log entries</option>
                      <option value="audit">Administrative Audit Logs</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Output Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e: any) => setExportFormat(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="csv">Structured Spreadsheet (.CSV)</option>
                      <option value="json">Raw HIPAA Payload (.JSON)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Chronological Trim</label>
                    <select
                      value={exportDateRange}
                      onChange={(e: any) => setExportDateRange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="all">Full Baseline History</option>
                      <option value="30days">Active Month (Last 30 days)</option>
                      <option value="7days">Active Week (Last 7 days)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleTriggerExport}
                      disabled={isRefreshingExporter}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg text-xs font-bold tracking-wide transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isRefreshingExporter ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Compiling...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Extract Dataset</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {exportCompleted && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                    ✓ SECURE TRANSFER VERIFIED: Local diagnostics data extracted correctly.
                  </p>
                )}
              </div>

              {/* PANEL 2: Clinical Risk Evaluation Configuration */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs">
                  <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">Active Clinical Risk Evaluation Limits</h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-none">Configure parameters for automatic real-time high-risk flagged alerts</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 font-sans">
                      <span>HIGH RISK SYSTOLIC BOUNDARY</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">≥ {systolicThreshold} mmHg</span>
                    </div>
                    <input 
                      type="range" 
                      min={120} 
                      max={180} 
                      value={systolicThreshold}
                      onChange={(e) => {
                        setSystolicThreshold(parseInt(e.target.value));
                        onTriggerToast(`Global Systolic target updated to ${e.target.value} mmHg`, 'success');
                      }}
                      className="w-full accent-emerald-600 dark:accent-emerald-500 cursor-pointer text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 font-sans">
                      <span>HIGH RISK DIASTOLIC BOUNDARY</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">≥ {diastolicThreshold} mmHg</span>
                    </div>
                    <input 
                      type="range" 
                      min={80} 
                      max={120} 
                      value={diastolicThreshold}
                      onChange={(e) => {
                        setDiastolicThreshold(parseInt(e.target.value));
                        onTriggerToast(`Global Diastolic target updated to ${e.target.value} mmHg`, 'success');
                      }}
                      className="w-full accent-emerald-600 dark:accent-emerald-500 cursor-pointer text-xs"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Note: Alert parameters configured are mirrored dynamically inline across blood pressure monitoring grids.
                </p>
              </div>

            </div>

            {/* SECURITY ROLE & PERMISSION MATRIX */}
            <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">HIPAA Role-Based Access Control (RBAC) Verification Matrix</h5>
                  <p className="text-[10px] text-slate-400">Visual audit matrices proving segregation of clinical duties across client platforms</p>
                </div>
              </div>

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900/60 text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2.5">Permitted Healthcare Scope Action</th>
                      <th className="px-3 py-2.5 text-center font-sans">Patient Client</th>
                      <th className="px-3 py-2.5 text-center font-sans">Clinician Provider</th>
                      <th className="px-3 py-2.5 text-center font-sans">EHR Admin Portal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    <tr className="hover:bg-slate-100/30">
                      <td className="px-3 py-2.5">Log Multi-Step Blood Pressure Averages (Ahomka Protocol)</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                    </tr>
                    <tr className="hover:bg-slate-100/30">
                      <td className="px-3 py-2.5">Access Personal Longitudal Metrics Charts</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                    </tr>
                    <tr className="hover:bg-slate-100/30">
                      <td className="px-3 py-2.5">Prescribe Recommendations & Review Flagged Alerts</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                    </tr>
                    <tr className="hover:bg-slate-100/30">
                      <td className="px-3 py-2.5">Establish Active Patient Referral Allocations</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                    </tr>
                    <tr className="hover:bg-slate-100/30">
                      <td className="px-3 py-2.5">Manage Secure Educational CMS & Broadcaster Channels</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                    </tr>
                    <tr className="hover:bg-slate-100/30">
                      <td className="px-3 py-2.5">Audit Administrative Operation Actions & Hard Cache Purges</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-rose-600 dark:text-rose-400">✗ DENIED</td>
                      <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ PERMITTED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h5 className="font-bold text-xs text-slate-900 dark:text-white mb-2">Sequential System Audit trail</h5>
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
                  {auditLogs.map((aud, idx) => (
                    <tr key={`${aud.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-950 dark:text-white whitespace-nowrap font-bold">{aud.timestamp}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">{aud.userName} ({aud.userRole})</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-black text-[9.5px]">
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
            <div className="bg-slate-50 dark:bg-slate-950/25 rounded-xl border border-dashed border-red-200 dark:border-rose-950/40 p-5 mt-6 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-950/20 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-rose-600 dark:text-rose-400">
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
                    localStorage.removeItem('curaflow_forum_boards');
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

        {/* TAB 7: Support Forums Manager for admins and sub-admins */}
        {activeTab === 'forums' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs space-y-6 font-sans">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Support Forum Boards & Community Moderator</span>
                </h4>
                <p className="text-[10px] text-slate-400">System Admin & Sub-Admin authorized board designer to spawn and moderate peer-to-peer discussion channels instantly</p>
              </div>
              <span className="text-[9px] font-mono px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300 font-bold">Admin Panel v1.2</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Creator Form widget */}
              <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>Create New Forum Board</span>
                  <span className="text-[8px] tracking-wider py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold uppercase font-mono">
                    Admin & Sub-Admin Privilege
                  </span>
                </h5>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const idInput = form.elements.namedItem('boardId') as HTMLInputElement;
                    const labelInput = form.elements.namedItem('boardLabel') as HTMLInputElement;
                    const descInput = form.elements.namedItem('boardDesc') as HTMLInputElement;
                    
                    let boardId = idInput.value.trim().toLowerCase();
                    if (!boardId.startsWith('#')) {
                      boardId = '#' + boardId;
                    }
                    boardId = boardId.replace(/\s+/g, '-');

                    if (forumBoards.some(b => b.id === boardId)) {
                      onTriggerToast(`Board ${boardId} already exists!`, 'error');
                      return;
                    }

                    const newBoard: SupportForumBoard = {
                      id: boardId,
                      label: labelInput.value.trim(),
                      desc: descInput.value.trim(),
                      createdBy: session.name,
                      createdDate: new Date().toISOString().split('T')[0]
                    };

                    onAddForumBoard(newBoard);
                    onTriggerToast(`Forum board ${boardId} created successfully!`, 'success');
                    form.reset();
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Board ID / Tag (e.g. #diabetes-care)</label>
                    <input 
                      name="boardId"
                      type="text"
                      required
                      placeholder="#cardio-wellness"
                      className="w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Human-Readable Label</label>
                    <input 
                      name="boardLabel"
                      type="text"
                      required
                      placeholder="Maternal Wellness Discussion"
                      className="w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Short Description & Rules</label>
                    <textarea 
                      name="boardDesc"
                      required
                      rows={3}
                      placeholder="Discuss pre-natal parameters, local midwife services, and post-intake blood pressure readings with fellow mothers."
                      className="w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Deploy Support Board</span>
                  </button>
                </form>
              </div>

              {/* Live list of boards */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Peer Forums ({forumBoards.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {forumBoards.map(board => (
                    <div key={board.id} className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 select-all">{board.id}</span>
                          <span className="text-[8px] bg-emerald-55 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-black">ACTIVE</span>
                        </div>
                        <h6 className="font-bold text-slate-900 dark:text-white text-xs mt-1 leading-tight">{board.label}</h6>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{board.desc}</p>
                      </div>

                      <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-2 mt-3.5 flex justify-between items-center text-[9px] text-slate-400 font-medium">
                        <span>Created by: <span className="font-bold text-slate-600 dark:text-slate-300">{board.createdBy}</span></span>
                        <span>{board.createdDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: Department Head Dashboard with recharts bar chart */}
        {activeTab === 'department_head' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Department Head Desk & Operations Hub</span>
                </h4>
                <p className="text-[10px] text-slate-400">Review departmental standing, active operational units, and pending escalated complaints tracking</p>
              </div>
              <span className="text-[9px] font-mono px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300 font-bold">Secure Ops v2.4</span>
            </div>

            {/* Stats and Chart grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Stats Column */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operational KPIs</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60 text-left">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged</span>
                    <span className="font-mono text-lg font-bold text-slate-800 dark:text-white">{totalEscalations + resolvedEscalations} cases</span>
                  </div>
                  <div className="bg-amber-50/45 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-200/40 dark:border-amber-900/20 text-left">
                    <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pending</span>
                    <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-300">{unresolvedEscalations} cases</span>
                  </div>
                  <div className="bg-rose-50/45 dark:bg-rose-950/10 p-3 rounded-xl border border-rose-200/40 dark:border-rose-900/20 text-left">
                    <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Escalated</span>
                    <span className="font-mono text-lg font-bold text-rose-750 dark:text-rose-300">{totalEscalations} cases</span>
                  </div>
                  <div className="bg-emerald-50/45 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-200/40 dark:border-emerald-900/20 text-left">
                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Resolved</span>
                    <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">{resolutionRate}%</span>
                  </div>
                </div>

                {/* Complaints Feed */}
                <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/60 space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Critical Escalated Alerts</span>
                  <div className="space-y-2 text-[11px]">
                    {realCriticalAlerts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center dark:text-slate-400">No active critical escalated alerts. System healthy.</p>
                    ) : (
                      realCriticalAlerts.slice(0, 5).map((alert, idx) => (
                        <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-lg flex items-start gap-2 text-left">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{alert.title}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{alert.category} · {alert.age}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bar Chart Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Complaints Category Distribution</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">Telemetry Chart</span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950/25 border border-slate-150 dark:border-slate-800/80 p-4 rounded-xl">
                  <div className="h-[270px] w-full">
                    {(!weeklyComplaints || weeklyComplaints.length === 0 || (totalEscalations === 0 && unresolvedEscalations === 0)) ? (
                      <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Complaints Recorded in Database</p>
                        <p className="text-[10px] text-slate-400">Category telemetry distribution will chart automatically when complaints are logged.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(() => {
                          const categories = [
                            { name: 'Clinical Quality', pendingRatio: 0.21, escalatedRatio: 0.18 },
                            { name: 'Billing/Insurance', pendingRatio: 0.33, escalatedRatio: 0.36 },
                            { name: 'Technical Support', pendingRatio: 0.13, escalatedRatio: 0.09 },
                            { name: 'Waiting Times', pendingRatio: 0.25, escalatedRatio: 0.27 },
                            { name: 'Staff Behavior', pendingRatio: 0.08, escalatedRatio: 0.10 }
                          ];
                          return categories.map(cat => ({
                            name: cat.name,
                            pending: Math.max(0, Math.round(unresolvedEscalations * cat.pendingRatio)),
                            escalated: Math.max(0, Math.round(totalEscalations * cat.escalatedRatio))
                          }));
                        })()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar dataKey="pending" name="Pending Investigation" fill="#6366F1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="escalated" name="Escalated Status" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Trend of Newly Escalated Complaints Line Chart */}
            <div className="border-t border-slate-150 dark:border-slate-800/80 pt-6 mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Weekly Escalations Trend (30 Days)</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Rolling line analysis of weekly escalations and resolution trends</p>
                </div>
                <span className="text-[9px] text-rose-500 font-bold font-mono uppercase">Escalations Telemetry</span>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950/25 border border-slate-150 dark:border-slate-800/80 p-4 rounded-xl">
                <div className="h-[270px] w-full">
                  {(!weeklyComplaints || weeklyComplaints.length === 0) ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Weekly Escalation Records</p>
                      <p className="text-[10px] text-slate-400">Weekly complaint and resolution volume will appear here once telemetry is recorded.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={weeklyComplaints}
                        margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                        <XAxis 
                          dataKey="week" 
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
                          name="Escalated Complaints"
                          dataKey="escalated"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1.5 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          name="Resolved Complaints"
                          dataKey="resolved"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1.5 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          name="Response Time (hrs)"
                          dataKey="avgResponseHours"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 3, strokeWidth: 1.5 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
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
                  <img src={pendingDeleteUser.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
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
                ID Reference: <span className="text-slate-600 dark:text-emerald-400 font-bold">{pendingDeleteUser.id}</span>
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
      {/* Socio-Demographical & Baseline Biometrics Profile Modal */}
      {selectedProfileUser && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-fade-in text-slate-900 dark:text-slate-100 font-sans space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Socio-Demographical Health Profile</span>
                    <span className="text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                      {selectedProfileUser.role}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">HIPAA Clinical Baseline & Social Determinants of Health (SDoH)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfileUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Body Container Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* SECTION 1: Personal Socio-Demographics */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950/15 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/80">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <h5 className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">Demographic Profile</h5>
                </div>

                <div className="space-y-2.5 font-sans">
                  {/* Avatar & Identifiers */}
                  <div className="flex items-center gap-3">
                    {selectedProfileUser.avatar ? (
                      <img src={selectedProfileUser.avatar} alt="avatar" className="w-11 h-11 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-950" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm uppercase">
                        {selectedProfileUser.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-white leading-none">{selectedProfileUser.name}</p>
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono font-black px-1.5 py-0.2 rounded">
                          ID: {formatUserId(selectedProfileUser.id)}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-medium font-mono">{selectedProfileUser.email}</p>
                    </div>
                  </div>

                  {/* Demographic Fields Grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1">
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">First & Last Name</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedProfileUser.firstName || selectedProfileUser.name.split(' ')[0]} {selectedProfileUser.lastName || selectedProfileUser.name.split(' ').slice(1).join(' ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Biological Sex</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileUser.sex || selectedProfileUser.gender || 'Female'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Date of Birth (DOB)</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {selectedProfileUser.dob || '1986-05-14'}
                        <span className="text-[10px] text-slate-400 font-normal font-sans ml-1">({selectedProfileUser.age || '38'} yrs)</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Preferred Language</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileUser.preferredLanguage || 'English (Ghana)'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Marital Status</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileUser.maritalStatus || 'Married'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Employment SDoH</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={selectedProfileUser.employmentStatus || 'Productively Employed'}>
                        {selectedProfileUser.employmentStatus || 'Productively Employed'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Educational Level</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={selectedProfileUser.educationLevel || 'Graduate Degree'}>
                        {selectedProfileUser.educationLevel || 'Graduate Degree'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Assigned 4-Digit ID</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatUserId(selectedProfileUser.id)}</p>
                    </div>
                  </div>

                  {/* Primary Residence Address */}
                  <div className="pt-2 border-t border-slate-205 dark:border-slate-800">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase font-mono block">Residence Demography</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-normal">
                      {selectedProfileUser.addressStreet || '34 Giffard Road'}, {selectedProfileUser.addressCity || 'Cantonments'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {selectedProfileUser.addressState || 'Greater Accra Region, GH'} — {selectedProfileUser.addressZip || '00233'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Dynamic Logs & Latest Readings */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950/15 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/80">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h5 className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">Dynamic Biometrics (Latest Readings)</h5>
                  </div>

                  {(() => {
                    const patientLogs = logs.filter(l => l.patientId === selectedProfileUser.id);
                    const bpLogs = patientLogs.filter(l => l.metric === 'Blood Pressure');
                    const gluLogs = patientLogs.filter(l => l.metric === 'Blood Glucose');
                    const pulseLogs = patientLogs.filter(l => l.metric === 'Heart Rate');

                    const latestBP = bpLogs.length > 0 ? bpLogs[0] : null;
                    const latestGlu = gluLogs.length > 0 ? gluLogs[0] : null;
                    const latestPulse = pulseLogs.length > 0 ? pulseLogs[0] : null;

                    return (
                      <div className="space-y-3">
                        {patientLogs.length > 0 ? (
                          <div className="space-y-2">
                            {/* blood pressure highlight */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <div>
                                  <p className="font-black text-[10px] text-slate-400 uppercase font-mono">Blood Pressure</p>
                                  <p className="text-[9px] text-slate-400 font-medium">{latestBP ? latestBP.timestamp : 'Manual average protocol'}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                                {latestBP ? latestBP.value : '118/76'} <span className="text-[10px] font-normal">mmHg</span>
                              </span>
                            </div>

                            {/* blood glucose highlight */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <div>
                                  <p className="font-black text-[10px] text-slate-400 uppercase font-mono">Blood Glucose</p>
                                  <p className="text-[9px] text-slate-400 font-medium">{latestGlu ? latestGlu.timestamp : 'Post-prandial intake'}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                                {latestGlu ? latestGlu.value : '98'} <span className="text-[10px] font-normal">mg/dL</span>
                              </span>
                            </div>

                            {/* pulse highlight */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                <div>
                                  <p className="font-black text-[10px] text-slate-400 uppercase font-mono">Heart Rate Pulse</p>
                                  <p className="text-[9px] text-slate-400 font-medium">{latestPulse ? latestPulse.timestamp : 'Active resting average'}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-400">
                                {latestPulse ? latestPulse.value : '72'} <span className="text-[10px] font-normal">bpm</span>
                              </span>
                            </div>

                            <p className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 pt-1 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 inline" />
                              <span>Total logged diagnostic streams: {patientLogs.length} entries</span>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 text-slate-400 py-3 text-center">
                            <span className="inline-block p-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-1">
                              <Database className="w-5 h-5 text-slate-400" />
                            </span>
                            <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-205">No dynamic system telemetry logged</p>
                            <p className="text-[9px] text-slate-400 leading-normal max-w-[210px] mx-auto">This newly registered user is in the baseline queue and has no live logs logged.</p>
                            
                            {/* Quick default baseline specs for visual production fidelity */}
                            <div className="text-left bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-150 border-dashed space-y-1.5 text-[10px] mt-2">
                              <p className="font-bold text-slate-500 uppercase tracking-widest text-[8.5px] font-mono">Default Baseline Standards</p>
                              <div className="flex justify-between">
                                <span className="text-slate-405 font-medium">Standard BP Systolic</span>
                                <span className="font-bold font-mono text-slate-800 dark:text-light">&lt; 120 mmHg</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-405 font-medium">Standard Glucose Regular</span>
                                <span className="font-bold font-mono text-slate-800 dark:text-light">70-100 mg/dL</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* System Audit & Session Metrics */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[10px] space-y-1.5 text-slate-500 dark:text-slate-400">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[8.5px] font-mono mb-1">Session & Telemetry Audit</p>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                      <span>Last Login Session:</span>
                      <span className={`font-mono font-bold ${loggedInUserIds.includes(selectedProfileUser.id) ? 'text-green-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {(() => {
                          const isOnline = loggedInUserIds.includes(selectedProfileUser.id);
                          const loginLogs = auditLogs.filter(a => a.userId === selectedProfileUser.id && (a.action === 'Authorized Authentication' || a.action.toLowerCase().includes('login')));
                          const lastLoginLog = loginLogs.length > 0 ? loginLogs[0] : null;
                          if (isOnline) return "🟢 Online Now";
                          return lastLoginLog ? lastLoginLog.timestamp : "No recorded sessions";
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                      <span>Last Recorded Entry:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {(() => {
                          const pLogs = logs.filter(l => l.patientId === selectedProfileUser.id);
                          const pAhomka = (ahomkaEntries || []).filter(e => e.patientId === selectedProfileUser.id);
                          const allRecordings: { desc: string; timestamp: string }[] = [];
                          
                          pLogs.forEach(l => {
                            allRecordings.push({
                              desc: `${l.metric} (${l.value})`,
                              timestamp: l.timestamp
                            });
                          });
                          
                          pAhomka.forEach(e => {
                            if (e.systolic !== undefined && e.diastolic !== undefined) {
                              allRecordings.push({
                                desc: `Ahomka BP (${e.systolic}/${e.diastolic})`,
                                timestamp: e.timestamp
                              });
                            } else {
                              allRecordings.push({
                                desc: `Ahomka Mood (${e.mood}/10)`,
                                timestamp: e.timestamp
                              });
                            }
                          });

                          const safeParseDate = (ts: string) => {
                            if (!ts) return 0;
                            if (ts.startsWith('Today')) return Date.now();
                            const parsed = Date.parse(ts);
                            return isNaN(parsed) ? 0 : parsed;
                          };

                          allRecordings.sort((a, b) => safeParseDate(b.timestamp) - safeParseDate(a.timestamp));
                          return allRecordings.length > 0 
                            ? `${allRecordings[0].desc} @ ${allRecordings[0].timestamp}` 
                            : "No telemetry recorded";
                        })()}
                      </span>
                    </div>
                  </div>
                  </div>

                  {/* Operational Controls status */}
                  <div className="pt-2.5 border-t border-slate-205 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <p>
                      <strong>Diagnostic Status:</strong> <span className={`font-bold uppercase ${selectedProfileUser.status === 'Active' ? 'text-green-600 dark:text-emerald-400' : 'text-rose-500'}`}>{selectedProfileUser.status}</span>
                    </p>
                    <p>
                      <strong>Licensing Access:</strong> <span className="font-bold text-slate-700 dark:text-slate-300">{selectedProfileUser.role === 'provider' && selectedProfileUser.verified ? '✓ Verified Clinician' : selectedProfileUser.role === 'provider' ? 'Pending Validation' : 'Access Exempt (Regulatory)'}</span>
                    </p>
                  </div>
              </div>

            </div>

            {/* Quick Action Footer Actions with fully functional button controls */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedProfileUser.role === 'patient' && (
                <button
                  type="button"
                  onClick={() => {
                    const patientToLog = selectedProfileUser;
                    setSelectedProfileUser(null);
                    setLogReadingsPatient(patientToLog);
                    setAdminSys1(120);
                    setAdminSys2(120);
                    setAdminSys3(120);
                    setAdminDia1(80);
                    setAdminDia2(80);
                    setAdminDia3(80);
                    setAdminPulse1(72);
                    setAdminPulse2(72);
                    setAdminPulse3(72);
                    setReadGlucose('');
                    setReadMood(8);
                    setReadStress(3);
                    setReadPain(1);
                    setReadSymptoms(['Normal / Stable']);
                    setReadAdherence('Full Adherence');
                    setReadNotes('');
                  }}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/15"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Log Patient Readings & Vitals</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setSelectedProfileUser(null)}
                className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Super Admin - Log Patient Telemetry Readings Modal */}
      {logReadingsPatient && (
        <div className="fixed inset-0 z-[10500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 text-slate-900 dark:text-slate-100 relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-extrabold text-base shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    Log Telemetry Readings for {logReadingsPatient.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient ID: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{logReadingsPatient.id}</span> · {logReadingsPatient.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogReadingsPatient(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSavePatientReadings} className="space-y-5">
              
              {/* Allocated Date & Quick Presets */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                      Allocated Reading Date (Date Taken) *
                    </label>
                    <input
                      type="date"
                      required
                      value={adminLogDate}
                      onChange={(e) => setAdminLogDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Quick Presets:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminSys1(118); setAdminDia1(78); setAdminPulse1(70);
                          setAdminSys2(120); setAdminDia2(80); setAdminPulse2(72);
                          setAdminSys3(116); setAdminDia3(76); setAdminPulse3(68);
                          setReadGlucose('95');
                          setReadMood(9); setReadStress(2); setReadPain(1);
                          setReadSymptoms(['Normal / Stable']);
                          setReadAdherence('Full Adherence');
                          setReadNotes('Routine checkup. Vitals within optimal ranges.');
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition cursor-pointer"
                      >
                        Optimal Baseline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminSys1(146); setAdminDia1(92); setAdminPulse1(86);
                          setAdminSys2(150); setAdminDia2(96); setAdminPulse2(90);
                          setAdminSys3(148); setAdminDia3(94); setAdminPulse3(88);
                          setReadGlucose('138');
                          setReadMood(4); setReadStress(8); setReadPain(6);
                          setReadSymptoms(['Headache', 'Dizziness', 'Shortness of Breath']);
                          setReadAdherence('Partial Adherence');
                          setReadNotes('Patient reports elevated stress and occasional headache.');
                        }}
                        className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition cursor-pointer"
                      >
                        Stage 2 Alert Preset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard 3-Reading Procedure Inputs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>Clinical 3-Reading Procedure (45s Interval Standard)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Same Procedure as Patient Self-Log
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Reading 1 */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono block">
                      Reading 1 (Initial)
                    </span>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Systolic (mmHg)</label>
                        <input
                          type="number"
                          min="60" max="260" required
                          value={adminSys1}
                          onChange={(e) => setAdminSys1(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Diastolic (mmHg)</label>
                        <input
                          type="number"
                          min="40" max="160" required
                          value={adminDia1}
                          onChange={(e) => setAdminDia1(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Pulse (BPM)</label>
                        <input
                          type="number"
                          min="30" max="220" required
                          value={adminPulse1}
                          onChange={(e) => setAdminPulse1(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reading 2 */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono block">
                      Reading 2 (+45s Rest)
                    </span>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Systolic (mmHg)</label>
                        <input
                          type="number"
                          min="60" max="260" required
                          value={adminSys2}
                          onChange={(e) => setAdminSys2(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Diastolic (mmHg)</label>
                        <input
                          type="number"
                          min="40" max="160" required
                          value={adminDia2}
                          onChange={(e) => setAdminDia2(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Pulse (BPM)</label>
                        <input
                          type="number"
                          min="30" max="220" required
                          value={adminPulse2}
                          onChange={(e) => setAdminPulse2(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reading 3 */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono block">
                      Reading 3 (+90s Rest)
                    </span>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Systolic (mmHg)</label>
                        <input
                          type="number"
                          min="60" max="260" required
                          value={adminSys3}
                          onChange={(e) => setAdminSys3(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Diastolic (mmHg)</label>
                        <input
                          type="number"
                          min="40" max="160" required
                          value={adminDia3}
                          onChange={(e) => setAdminDia3(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Pulse (BPM)</label>
                        <input
                          type="number"
                          min="30" max="220" required
                          value={adminPulse3}
                          onChange={(e) => setAdminPulse3(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculated Averages Live Banner */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Calculated 3-Reading Averages:
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black font-mono">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      SYS: {Math.round(((Number(adminSys1) || 0) + (Number(adminSys2) || 0) + (Number(adminSys3) || 0)) / 3)} mmHg
                    </span>
                    <span className="text-sky-700 dark:text-sky-400">
                      DIA: {Math.round(((Number(adminDia1) || 0) + (Number(adminDia2) || 0) + (Number(adminDia3) || 0)) / 3)} mmHg
                    </span>
                    <span className="text-rose-600 dark:text-rose-400">
                      BPM: {Math.round(((Number(adminPulse1) || 0) + (Number(adminPulse2) || 0) + (Number(adminPulse3) || 0)) / 3)} bpm
                    </span>
                  </div>
                </div>
              </div>

              {/* Glucose & Medication Adherence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                    Blood Glucose (mg/dL) - Optional
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 98 or 110"
                    value={readGlucose}
                    onChange={(e) => setReadGlucose(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                    Medication Adherence Status
                  </label>
                  <select
                    value={readAdherence}
                    onChange={(e) => setReadAdherence(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white h-[34px] cursor-pointer"
                  >
                    <option value="Full Adherence">Full Adherence (All Prescribed)</option>
                    <option value="Partial Adherence">Partial Adherence (Some Missed)</option>
                    <option value="Non-Compliant">Non-Compliant / Missed Dose</option>
                  </select>
                </div>
              </div>

              {/* Wellbeing Index Sliders */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                  Subjective Health Indices (1 - 10)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Mood Index:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{readMood}/10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" value={readMood} onChange={(e) => setReadMood(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Stress Level:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{readStress}/10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" value={readStress} onChange={(e) => setReadStress(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Pain Severity:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{readPain}/10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" value={readPain} onChange={(e) => setReadPain(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Reported Symptoms Selectable Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                  Active Clinical Symptoms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Normal / Stable', 'Headache', 'Dizziness', 'Shortness of Breath', 
                    'Fatigue', 'Chest Tightness', 'Leg Swelling', 'Nausea', 'Palpitations', 'Vision Changes'
                  ].map(symptom => {
                    const isSelected = readSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => {
                          if (symptom === 'Normal / Stable') {
                            setReadSymptoms(['Normal / Stable']);
                          } else {
                            let updated = readSymptoms.filter(s => s !== 'Normal / Stable');
                            if (isSelected) {
                              updated = updated.filter(s => s !== symptom);
                              if (updated.length === 0) updated = ['Normal / Stable'];
                            } else {
                              updated.push(symptom);
                            }
                            setReadSymptoms(updated);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observations & Admin Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                  Administrative / Clinical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Record additional observation notes, clinical context, or patient feedback..."
                  value={readNotes}
                  onChange={(e) => setReadNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit / Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogReadingsPatient(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Save & Dispatch Telemetry Entry</span>
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
