/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HealthLog, Message, Conversation, AIChatMessage, AppUser, FAQ, Announcement, AuditLog 
} from '../types';
import { 
  Activity, MessageSquare, Brain, Bell, Users, Search, Trash2, Check, AlertCircle, 
  TrendingUp, Send, Paperclip, FileText, X, Heart, Droplet, Clock, Sparkles, 
  Info, ShieldCheck, Clipboard, ExternalLink, Calendar, PlusCircle, ArrowRight, Upload
} from 'lucide-react';

interface ProviderLayoutProps {
  session: AppUser;
  logs: HealthLog[];
  conversations: Conversation[];
  aiChat: AIChatMessage[];
  users: AppUser[];
  onAddLog: (metric: any, value: string, notes: string) => void;
  onSendMessage: (convId: string, text: string) => void;
  onSendAIChat: (text: string) => Promise<void>;
  isAiTyping: boolean;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onChangeLogAlertStatus: (id: string, isHighRisk: boolean) => void;
  auditLogs?: AuditLog[];
  loggedInUserIds?: string[];
}

export default function ProviderLayout({
  session, logs, conversations, aiChat, users,
  onSendMessage, onSendAIChat, isAiTyping, onTriggerToast, onChangeLogAlertStatus,
  auditLogs = [], loggedInUserIds = []
}: ProviderLayoutProps) {
  
  const [activeTab, setActiveTab] = useState('dashboard');
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
  
  // Interactive patient selected for timeline review
  const defaultPatient = users.find(u => u.role === 'patient') || users[0];
  const [selectedPatId, setSelectedPatId] = useState<string>(defaultPatient?.id || '');
  
  const [dirSearchQuery, setDirSearchQuery] = useState('');
  const [clinicalDocNotes, setClinicalDocNotes] = useState('');

  // Messaging selected conversation
  const [provSelectedConvId, setProvSelectedConvId] = useState(conversations[0]?.id || 'c1');
  const [provMessageInput, setProvMessageInput] = useState('');

  // Care Team Consultation Referrals State (Start clean of mocks)
  const [referrals, setReferrals] = useState<{ id: string; patientName: string; targetSpecialty: string; reason: string; status: string; date: string; }[]>([]);
  const [refPatientName, setRefPatientName] = useState('');
  const [refSpecialty, setRefSpecialty] = useState('Physiotherapy');
  const [refReason, setRefReason] = useState('');

  const patientsList = users.filter(u => u.role === 'patient');

  // Synchronize referral default patient selection with the actual list
  useEffect(() => {
    if (patientsList.length > 0 && !refPatientName) {
      setRefPatientName(patientsList[0].name);
    }
  }, [patientsList, refPatientName]);

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refReason.trim()) {
      onTriggerToast('Provide reasoning details for care referral', 'error');
      return;
    }
    const newRef = {
      id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      patientName: refPatientName || 'Anonymous Patient',
      targetSpecialty: refSpecialty,
      reason: refReason.trim(),
      status: 'Referral Dispatched',
      date: new Date().toLocaleDateString('en-US')
    };
    setReferrals([newRef, ...referrals]);
    setRefReason('');
    onTriggerToast(`Encrypted Care Referral submitted to ${refSpecialty}!`, 'success');
  };

  const handleSendPatientMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provMessageInput.trim()) return;
    onSendMessage(provSelectedConvId, provMessageInput.trim());
    setProvMessageInput('');
    onTriggerToast('Clinical recommendation forwarded to patient timeline', 'success');
  };

  const handleApplyClinicalVerification = (logId: string) => {
    onTriggerToast(`Biometric log #${logId} marked as clinically verified by ${session.name}!`, 'success');
  };

  const defaultPatientMock = {
    id: '',
    name: 'No active patient',
    role: 'patient',
    status: 'Active',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    email: '',
    insuranceProvider: 'N/A',
    insuranceMemberId: ''
  };

  const selectedPatientData = users.find(u => u.id === selectedPatId) || defaultPatient || defaultPatientMock;

  // Derived active patient session status and last telemetry recording details
  const isOnline = loggedInUserIds.includes(selectedPatientData.id);
  const patientLogs = logs.filter(l => l.patientId === selectedPatientData.id || (!l.patientId && selectedPatientData.id === 'usr-1'));
  const latestLog = patientLogs.length > 0 ? patientLogs[0] : null;
  const loginLogs = auditLogs.filter(a => a.userId === selectedPatientData.id && (a.action === 'Authorized Authentication' || a.action.toLowerCase().includes('login')));
  const lastLoginLog = loginLogs.length > 0 ? loginLogs[0] : null;

  // Dynamically derive critical alert condition logs
  const criticalNotifications = logs
    .filter(l => l.isHighRisk)
    .map(l => {
      const patientObj = users.find(u => u.id === l.patientId);
      const name = patientObj ? patientObj.name : 'Unknown Patient';
      return {
        id: l.id,
        text: `${name} ${l.metric} logged: ${l.value} (${l.trend})`,
        date: l.timestamp,
        type: l.metric === 'Blood Glucose' ? 'GlucoseAlert' : 'BPAlert'
      };
    });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      
      {/* Mobile Top Sub-Header Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Panel</span>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {activeTab === 'dashboard' && 'Clinical Dashboard'}
            {activeTab === 'directory' && 'Patient Registry'}
            {activeTab === 'messaging' && 'Patient Communications'}
            {activeTab === 'referrals' && 'Consults & Referrals'}
            {activeTab === 'copilot' && 'EHR AI Co-Pilot'}
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
                    <div className="px-2 py-0.5 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg">
                      CFL
                    </div>
                    <span className="font-sans font-bold text-slate-900 dark:text-white">Provider Hub</span>
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
                    onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Clinical Dashboard</span>
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('directory'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Patient Registry</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('messaging'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'messaging' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Patient Communications</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('referrals'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'referrals' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Clipboard className="w-4 h-4" />
                    <span>Consults & Referrals</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('copilot'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'copilot' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Brain className="w-4 h-4" />
                    <span className="flex items-center gap-1">
                      <span>EHR AI Co-Pilot</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </span>
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
      
      {/* Provider navigation rails sidebar */}
      <aside className="hidden md:flex w-full md:w-56 border-b md:border-b-0 md:border-r bg-white dark:bg-slate-900 p-4 space-y-1.5 md:flex-col shrink-0">
        <div className="w-full space-y-1">
          <button 
            id="tab-prov-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Clinical Dashboard</span>
          </button>
          
          <button 
            id="tab-prov-directory"
            onClick={() => setActiveTab('directory')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            <span>Patient Registry</span>
          </button>

          <button 
            id="tab-prov-messaging"
            onClick={() => setActiveTab('messaging')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'messaging' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Patient Communications</span>
          </button>

          <button 
            id="tab-prov-referrals"
            onClick={() => setActiveTab('referrals')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'referrals' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Clipboard className="w-4 h-4" />
            <span>Consults & Referrals</span>
          </button>

          <button 
            id="tab-prov-copilot"
            onClick={() => setActiveTab('copilot')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'copilot' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Brain className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <span>EHR AI Co-Pilot</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </span>
          </button>
        </div>
      </aside>

      {/* Provider tabs rendering viewport */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="space-y-6"
          >
        
        {/* TAB 1: Clinical General Dashboard & alerts prioritizing */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Lead Clinician Portal</span>
                <h2 className="font-display text-xl font-bold mt-2.5">{session.name} — Clinical Workspace</h2>
                <p className="text-xs text-slate-400 mt-1">Select priorities, review high risk telemetry, and audit care consult feeds.</p>
              </div>
              <div className="text-sm bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 font-medium shrink-0 leading-normal">
                <span>Active Monitored Status: </span>
                <span className="text-emerald-400 font-bold">Standard Live</span>
              </div>
            </div>

            {/* Critical Biometrics Notifications panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs p-5 space-y-3.5">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 animate-swing" />
                <span>Critical Clinical Notifications (Real-Time Biometrics)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalNotifications.map(cn => (
                  <div key={cn.id} className="bg-rose-50/75 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900 rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-500 text-white p-2 rounded-lg shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-rose-900 dark:text-rose-350">{cn.text}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{cn.date}</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60 shadow-xs">Review Priority</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Logs with direct high alert status toggler */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-xs mb-3 text-slate-900 dark:text-white">Active Biometrics telemetry prioritization</h4>
              <p className="text-[10px] text-slate-400 mb-4 font-sans">Click to flag as High Risk or Normal to adjust active nursing queues.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Metric Type</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">State standing</th>
                      <th className="px-4 py-3 text-right">Action controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.slice(0, 5).map(lg => (
                      <tr key={lg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{users.find(u => u.id === lg.patientId)?.name || 'Patient Record'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">{lg.metric}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{lg.value}</td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{lg.timestamp}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${lg.isHighRisk ? 'bg-rose-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 animate-pulse' : 'bg-green-100 dark:bg-emerald-950/20 text-green-700 dark:text-emerald-400'}`}>
                            {lg.isHighRisk ? '🚨 High Risk Priority' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 shrink-0">
                          <button 
                            onClick={() => {
                              onChangeLogAlertStatus(lg.id, !lg.isHighRisk);
                              onTriggerToast('Modified alert standing priority status', 'info');
                            }}
                            className="bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-indigo-700 dark:text-indigo-300 font-bold rounded text-[10px] hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                          >
                            Toggle Alert Flag
                          </button>
                          <button 
                            onClick={() => handleApplyClinicalVerification(lg.id)}
                            className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-800 dark:text-slate-200 font-bold rounded text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
                          >
                            Mark Verified
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Patient Directory & histories chronological timeline */}
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* patient directory column */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Query Patient Index..." 
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2.5 pl-10 pr-4 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">Matched Records ({patientsList.length})</span>
              
              <div className="space-y-2">
                {patientsList.filter(p => p.name.toLowerCase().includes(dirSearchQuery.toLowerCase())).map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPatId(p.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition border ${p.id === selectedPatId ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300'}`}
                  >
                    <p className="font-bold text-xs">{p.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">{p.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* active patient timeline column */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border rounded-xl p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <img src={selectedPatientData.avatar} alt="patient" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-none">{selectedPatientData.name}</h3>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 uppercase font-sans">Patient Clinical Timeline</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-right leading-relaxed">
                  <p>Insur: {selectedPatientData.insuranceProvider || 'N/A'}</p>
                  <p className="text-[9px] lowercase opacity-75">{selectedPatientData.insuranceMemberId ? `Member ID: ${selectedPatientData.insuranceMemberId}` : 'No insurance mapped'}</p>
                </div>
              </div>

              {/* Session & Telemetry Quick Audit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Patient Session Status</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                        <span className="text-green-600 dark:text-emerald-400 text-[11px]">Online Now / Active Session</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                          Last login: <span className="font-mono font-bold">{lastLoginLog ? lastLoginLog.timestamp : "No recorded session"}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Last Telemetry Recording</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      {latestLog ? (
                        <span>{latestLog.metric} ({latestLog.value}) @ <span className="font-mono">{latestLog.timestamp}</span></span>
                      ) : (
                        "No logs recorded yet"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vertical Chronological Clinical Biometric History Timeline */}
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Telemetry Timeline Trail</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Sequential records submitted via patient portals</p>
                </div>

                <div className="relative border-l-2 border-indigo-100 pl-6 space-y-6">
                  {(() => {
                    const filtered = logs.filter(l => l.patientId === selectedPatientData.id || (!l.patientId && selectedPatientData.id === 'usr-1'));
                    if (filtered.length === 0) {
                      return (
                        <div className="text-left text-slate-400 py-2">
                          <p className="text-[11px] font-semibold">No biometric telemetry logs submitted by this patient yet.</p>
                        </div>
                      );
                    }
                    return filtered.map((log) => (
                      <div key={log.id} className="relative">
                        
                        {/* Timeline dot */}
                        <span className="absolute -left-[31px] top-1.5 bg-indigo-600 w-3 h-3 rounded-full border-2 border-white"></span>
                        
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-950 dark:text-white">{log.metric} Log</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{log.timestamp}</span>
                          </div>
                          <p className="text-sm font-black mt-1 text-slate-900 dark:text-white">{log.value}</p>
                          
                          {log.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800 mt-2 italic">
                              "{log.notes}"
                            </p>
                          )}

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                              Registered securely via TLS
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Source: {log.verifiedBy}</span>
                          </div>
                        </div>

                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: Safe Doctor communications */}
        {activeTab === 'messaging' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex h-[480px] overflow-hidden">
            
            {/* selected patients checklist */}
            <div className="w-48 border-r border-slate-200 dark:border-slate-800 shrink-0 p-4 bg-slate-50/25 dark:bg-slate-800/10 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Direct Active Chats</span>
                <div className="space-y-2">
                  {conversations.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => setProvSelectedConvId(c.id)}
                      className={`p-3 rounded-xl cursor-pointer border transition ${c.id === provSelectedConvId ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300'}`}
                    >
                      <p className="font-bold text-xs">{c.name}</p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none mt-1 block">Patient communication</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* main communication thread */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/10 flex items-center justify-between shrink-0">
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">Active patient conversation node: {conversations.find(c => c.id === provSelectedConvId)?.name || 'Patient Record'}</h5>
                <span className="text-[9px] bg-green-50 dark:bg-emerald-950/20 text-green-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded border border-green-200 dark:border-emerald-900/40">HIPAA Active</span>
              </div>

              {/* messages list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/10 dark:bg-slate-800/5 text-xs">
                {conversations.find(c => c.id === provSelectedConvId)?.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl max-w-xs ${m.sender === 'doctor' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                      <p className="font-bold text-[9px] opacity-75 mb-1">{m.senderName}</p>
                      <p className="leading-snug">{m.content}</p>
                      <span className="text-[7.5px] opacity-60 mt-1 block text-right">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* actions form */}
              <form onSubmit={handleSendPatientMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-800/10 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={provMessageInput}
                  onChange={(e) => setProvMessageInput(e.target.value)}
                  placeholder="Type clinical care directions..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                />
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs transition"
                >
                  Forward Directions
                </button>
              </form>
            </div>

          </div>
        )}

        {/* TAB 4: Forum threads & interactive referrals dispatcher */}
        {activeTab === 'referrals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Referral formulation */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-xs self-start">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">Dispatch Health Care Referral</h4>
              <p className="text-[10px] text-slate-400 mb-4">Direct secure request routing to specialty departments</p>
              
              <form onSubmit={handleCreateReferral} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Select Patient</label>
                  <select 
                    value={refPatientName}
                    onChange={(e) => setRefPatientName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {patientsList.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Target Specialty Group</label>
                  <select 
                    value={refSpecialty}
                    onChange={(e) => setRefSpecialty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Cardiology">Cardiology Department</option>
                    <option value="Endocrinology">Endocrinology Specialist Division</option>
                    <option value="Physiotherapy">Physical Therapeutics & Muscle Therapy</option>
                    <option value="Nutrition">Nutritional Planning</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Referral Reason & Clinical Summary</label>
                  <textarea 
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    rows={3}
                    placeholder="Provide patient biometrics baseline anomalies justifying specialist escalation..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Dispatch Specialist Referral</span>
                </button>
              </form>
            </div>

            {/* active dispatches list column */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Assigned Referrals Tracking Logs</h4>
                <p className="text-[10px] text-slate-400">Escalated outpatient request statuses</p>
              </div>

              <div className="space-y-3">
                {referrals.map(rf => (
                  <div key={rf.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between text-xs transition hover:border-indigo-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{rf.patientName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="font-bold text-indigo-700 dark:text-indigo-400">{rf.targetSpecialty}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium italic mt-1">"{rf.reason}"</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2">Dispatched sequence: {rf.date}</p>
                    </div>

                    <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 text-[9px] rounded-full shrink-0">
                      {rf.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: EHR AI Co-Pilot summarizes, medicines references */}
        {activeTab === 'copilot' && (
          <div className="bg-slate-950 text-white rounded-2xl p-6 h-[480px] flex flex-col justify-between overflow-hidden border border-slate-900">
            <div className="p-3 border-b border-indigo-900/30 flex justify-between items-center bg-slate-900/30 shrink-0">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div>
                  <h4 className="font-bold text-xs text-slate-200">EHR Clinician co-pilot</h4>
                  <p className="text-[9px] text-indigo-400">Assists in telemetry syntheses, draft notices, drug interaction lookups</p>
                </div>
              </div>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded font-bold">Encrypted Mode</span>
            </div>

            {/* history dialog */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed">
              {aiChat.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-xl max-w-xl ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-indigo-200 border-l-2 border-indigo-500'}`}>
                    <p className="text-[8px] opacity-60 font-sans uppercase mb-1">{m.role === 'user' ? 'Dr. Aris Clinician prompt' : 'EHR AI response summary'}</p>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="bg-slate-900 p-3 rounded-lg text-slate-400 animate-pulse text-[10px] w-56">
                  Co-pilot auditing telemetry notes...
                </div>
              )}
            </div>

            {/* quick suggestions prompts */}
            <div className="px-4 py-2 border-t border-indigo-950 flex flex-wrap gap-1.5 shrink-0">
              <button 
                onClick={() => onSendAIChat(`Create clinical report summary for hypertension patient ${selectedPatientData.name} based on BP trend measurements`)}
                className="bg-slate-900 hover:bg-slate-800 text-[9px] font-bold py-1 px-2.5 rounded border border-indigo-500/20 text-indigo-300"
              >
                Draft {selectedPatientData.name} report
              </button>
              <button 
                onClick={() => onSendAIChat('Audit drug interaction details: Lisinopril for high systolic BP values paired with metabolic nutrition guidance')}
                className="bg-slate-900 hover:bg-slate-800 text-[9px] font-bold py-1 px-2.5 rounded border border-indigo-500/20 text-indigo-300"
              >
                BP Drug interaction summary
              </button>
            </div>

            {/* form query */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = document.getElementById('prov-copilot-input') as HTMLInputElement;
              if (input && input.value.trim()) {
                onSendAIChat(input.value.trim());
                input.value = '';
              }
            }} className="p-3 border-t border-indigo-950 flex gap-2 shrink-0">
              <input 
                id="prov-copilot-input"
                type="text" 
                placeholder="Ask EHR co-pilot (e.g. 'Draft outpatient email explaining diastolic target range')..."
                className="flex-1 bg-slate-900 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Consult AI</span>
              </button>
            </form>
          </div>
          )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
