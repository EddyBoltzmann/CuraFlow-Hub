/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  HealthLog, Message, Conversation, AIChatMessage, CMSArticle, AppUser, FAQ, Announcement,
  ProviderInfo, AhomkaEntry, CommunityMessage, AppointmentBooking
} from '../types';
import { 
  Activity, MessageSquare, Brain, BookOpen, Bell, User, Settings, Plus, Search, Trash2, 
  Check, CheckCircle2, AlertCircle, TrendingUp, ChevronRight, Moon, Sun, ShieldCheck, 
  Send, Paperclip, FileText, X, Heart, Droplet, BatteryCharging, Clock, Sparkles, 
  Info, Mic, MicOff, Play, Pause, Video, ExternalLink, ShieldAlert, CheckCircle, RefreshCw,
  Users, Stethoscope, Edit, Upload
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

interface PatientLayoutProps {
  session: AppUser;
  logs: HealthLog[];
  conversations: Conversation[];
  aiChat: AIChatMessage[];
  articles: CMSArticle[];
  faqs: FAQ[];
  announcements: Announcement[];
  searchQuery: string;
  onAddLog: (metric: any, value: string, notes: string) => void;
  onDeleteLog: (id: string) => void;
  onSendMessage: (convId: string, text: string, attachment?: any) => void;
  onSendAIChat: (text: string) => Promise<void>;
  isAiTyping: boolean;
  isDoctorTyping: boolean;
  onUpdateProfile: (updatedSession: AppUser) => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  providers: ProviderInfo[];
  ahomkaEntries: AhomkaEntry[];
  onAddAhomkaEntry: (
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
    readings?: { systolic: number; diastolic: number; pulse: number }[]
  ) => void;
  communityMessages: CommunityMessage[];
  onSendCommunityMessage: (channel: string, content: string) => void;
  bookings: AppointmentBooking[];
  onAddBooking: (providerId: string, providerName: string, providerAvatar: string, specialty: string, mode: 'Video Call' | 'Audio Call' | 'Secure Chat', dateTime: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onDeleteMessage?: (convId: string, msgId: string) => void;
  onEditMessage?: (convId: string, msgId: string, newContent: string) => void;
}

export default function PatientLayout({
  session, logs, conversations, aiChat, articles, faqs, announcements, searchQuery,
  onAddLog, onDeleteLog, onSendMessage, onSendAIChat, isAiTyping, isDoctorTyping,
  onUpdateProfile, onTriggerToast,
  providers, ahomkaEntries, onAddAhomkaEntry, communityMessages, onSendCommunityMessage, bookings, onAddBooking, onCancelBooking,
  onDeleteMessage, onEditMessage
}: PatientLayoutProps) {
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Confirmation state for deleting health logs
  const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);
  
  // Local state for interactive logger
  const [logMetric, setLogMetric] = useState<'Blood Pressure' | 'Blood Glucose' | 'Active Calories' | 'Sleep Quality' | 'Weight' | 'Heart Rate'>('Blood Pressure');
  const [logValue, setLogValue] = useState('');
  const [logNotes, setLogNotes] = useState('');
  
  // Interactive chart filter tab
  const [chartMetricTab, setChartMetricTab] = useState<'BP' | 'Glucose' | 'Sleep' | 'Weight' | 'HeartRate'>('BP');

  // Interactive messaging attachment & voice
  const [chatSelectedConvId, setChatSelectedConvId] = useState(conversations[0]?.id || 'c1');
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Profile forms
  const [profName, setProfName] = useState(session.name);
  const [profEmail, setProfEmail] = useState(session.email);
  const [profAvatar, setProfAvatar] = useState(session.avatar || '');
  const [profContactName, setProfContactName] = useState(session.emergencyContactName || '');
  const [profContactPhone, setProfContactPhone] = useState(session.emergencyContactPhone || '');
  const [profContactRelation, setProfContactRelation] = useState(session.emergencyContactRelation || '');
  const [profInsProvider, setProfInsProvider] = useState(session.insuranceProvider || '');
  const [profInsMemberId, setProfInsMemberId] = useState(session.insuranceMemberId || '');
  const [profInsGroupId, setProfInsGroupId] = useState(session.insuranceGroupId || '');
  const [profAddrStreet, setProfAddrStreet] = useState(session.addressStreet || '');
  const [profAddrCity, setProfAddrCity] = useState(session.addressCity || '');
  const [profAddrState, setProfAddrState] = useState(session.addressState || '');
  const [profAddrZip, setProfAddrZip] = useState(session.addressZip || '');

  // Active healthcare educational video modal & play simulation
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoPlayTicks, setVideoPlayTicks] = useState(0);

  // GAP Health - Providers Booking Local States
  const [bookingProviderId, setBookingProviderId] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'Video Call' | 'Audio Call' | 'Secure Chat'>('Video Call');
  const [bookingDateTime, setBookingDateTime] = useState<string>('');
  const [bookingReason, setBookingReason] = useState<string>('');

  // GAP Health - Ahomka Ho Well-being Local States
  const [ahomkaMood, setAhomkaMood] = useState<number>(8);
  const [ahomkaStress, setAhomkaStress] = useState<number>(3);
  const [ahomkaPain, setAhomkaPain] = useState<number>(2);
  const [ahomkaSelectedSymptoms, setAhomkaSelectedSymptoms] = useState<string[]>([]);
  const [ahomkaNotes, setAhomkaNotes] = useState<string>('');

  // Redesigned Step-by-Step Vitals States from screenshots
  const [vitalsStep, setVitalsStep] = useState<'dashboard' | 'step1' | 'step2' | 'reading1' | 'rest1' | 'reading2' | 'rest2' | 'reading3'>('dashboard');
  const [vitalsFeeling, setVitalsFeeling] = useState<string>('');
  const [vitalsSymptoms, setVitalsSymptoms] = useState<string[]>([]);
  const [vitalsMedication, setVitalsMedication] = useState<string>('');
  
  // Individual readings local values
  const [sys1, setSys1] = useState<string>('120');
  const [dia1, setDia1] = useState<string>('80');
  const [pulse1, setPulse1] = useState<string>('72');

  const [sys2, setSys2] = useState<string>('122');
  const [dia2, setDia2] = useState<string>('82');
  const [pulse2, setPulse2] = useState<string>('73');

  const [sys3, setSys3] = useState<string>('118');
  const [dia3, setDia3] = useState<string>('79');
  const [pulse3, setPulse3] = useState<string>('70');

  // Interactive countdown and slide indexes
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [showTimesUpModal, setShowTimesUpModal] = useState<boolean>(false);
  const [showVitalsSuccessModal, setShowVitalsSuccessModal] = useState<boolean>(false);
  const [rotatingSlideIndex, setRotatingSlideIndex] = useState<number>(0);
  const [vitalsChartView, setVitalsChartView] = useState<'systolic' | 'diastolic'>('systolic');
  const [defaultTooltipCoord, setDefaultTooltipCoord] = useState<{ x: number, y: number } | null>(null);
  const [isHoveringChart, setIsHoveringChart] = useState<boolean>(false);
  const [isVitalsHistoryOpen, setIsVitalsHistoryOpen] = useState<boolean>(false);

  // Success BP readings to show inside success modal dialog
  const [vitalsSuccessSummary, setVitalsSuccessSummary] = useState<{ systolic: number; diastolic: number; pulse: number; status: string } | null>(null);

  // GAP Health - Community Chat Local States
  const [commSelectedChannel, setCommSelectedChannel] = useState<string>('#nutrition-and-diabetes');
  const [commInput, setCommInput] = useState<string>('');

  // GAP Health - AI Document / Lab Report Summarizer States
  const [summarizerText, setSummarizerText] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summarizerResult, setSummarizerResult] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for parsing dropped or uploaded files
  const handleFileProcess = (file: File) => {
    if (!file) return;
    
    // Check if simple text/csv/json file
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setSummarizerText(text.slice(0, 1500));
          onTriggerToast(`File '${file.name}' loaded successfully!`, 'success');
        }
      };
      reader.readAsText(file);
    } else {
      // For images, PDFs, etc. we generate a friendly professional summary reference text
      const generatedPrompt = `📄 Loaded File: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Type: ${file.type || 'Clinical Document'}.\n\nThis diagnostic record contains patient clinical biometric numbers. Please process the cardiovascular and endocrine metrics.`;
      setSummarizerText(generatedPrompt);
      onTriggerToast(`Referenced document '${file.name}' successfully!`, 'success');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Filter educational articles in real time based on portal search query
  const filteredArticles = articles.filter(art => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(query) ||
      art.category.toLowerCase().includes(query) ||
      art.summary.toLowerCase().includes(query)
    );
  });

  // Filter Ahomka blood pressure history logs based on portal search query
  const filteredAhomkaEntries = ahomkaEntries.filter(e => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.timestamp.toLowerCase().includes(query) ||
      e.notes.toLowerCase().includes(query) ||
      (e.feeling && e.feeling.toLowerCase().includes(query)) ||
      (e.symptoms && e.symptoms.some(s => s.toLowerCase().includes(query)))
    );
  });

  const handleExportPatientLogsToCSV = () => {
    if (ahomkaEntries.length === 0) {
      onTriggerToast("No logs available to export.", "error");
      return;
    }
    const csvRows = [
      ["Timestamp", "Averaged Systolic (mmHg)", "Averaged Diastolic (mmHg)", "Averaged Pulse (bpm)", "Physical Well-being", "Medication Adherence Adhered", "Clinical Notes/Symptoms"],
    ];

    ahomkaEntries.forEach(entry => {
      const notesEscaped = `"${(entry.notes || '').replace(/"/g, '""')}"`;
      csvRows.push([
        entry.timestamp,
        entry.systolic?.toString() || '',
        entry.diastolic?.toString() || '',
        entry.pulse?.toString() || '',
        entry.feeling || '',
        entry.medicationAdherence || 'unspecified',
        notesEscaped
      ]);
    });

    const csvString = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const patientNameClean = session.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.setAttribute("download", `ahomka_ho_bp_logs_${patientNameClean}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onTriggerToast("Your blood pressure logs have been exported successfully to CSV!", "success");
  };

  // Patient educational resources
  const videosList = [
    { id: 'v1', title: 'Hypertension Control: Dynamic Breathing Measures', duration: '4:15', category: 'Cardiology', views: 310 },
    { id: 'v2', title: 'Food Glucose Index: Unpacking Diurnal Spikes', duration: '6:40', category: 'Nutrition', views: 245 },
    { id: 'v3', title: 'Developing Clear REM Vectors for Nightly Recovery', duration: '8:12', category: 'Sleep', views: 520 }
  ];

  // Daily checklists state
  const [reminders, setReminders] = useState([
    { id: 'rem-1', label: 'Monitor Blood Glucose (Fasting state)', done: true },
    { id: 'rem-2', label: 'Submit Heart Rate log pre-dinner walking', done: false },
    { id: 'rem-3', label: 'Read: Circadian sleep index analysis', done: false },
    { id: 'rem-4', label: 'Walk 15 minutes post glycemic intake', done: true }
  ]);

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, done: !r.done } : r));
    onTriggerToast('Checked reminder update success');
  };

  // Countdown Timer and Rest Period Slideshow Auto-rotation support
  useEffect(() => {
    let intervalId: any = null;
    let slideIntervalId: any = null;

    if (vitalsStep === 'rest1' || vitalsStep === 'rest2') {
      intervalId = setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setShowTimesUpModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      slideIntervalId = setInterval(() => {
        setRotatingSlideIndex(prev => (prev + 1) % 4);
      }, 4000);
    } else {
      setRestSeconds(60);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (slideIntervalId) clearInterval(slideIntervalId);
    };
  }, [vitalsStep]);

  // Recharts: Dynamically generate clean weekly trend datasets from logs
  const getDynamicTrendData = () => {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bpLogs = logs.filter(l => l.metric === 'Blood Pressure').reverse();
    const glucoseLogs = logs.filter(l => l.metric === 'Blood Glucose').reverse();
    const sleepLogs = logs.filter(l => l.metric === 'Sleep Quality').reverse();
    const weightLogs = logs.filter(l => l.metric === 'Weight').reverse();
    const hrLogs = logs.filter(l => l.metric === 'Heart Rate').reverse();

    return weekdays.map((day, idx) => {
      // Find logs or default to healthy realistic medical presets
      const bpItem = bpLogs[idx];
      const systolic = bpItem ? (parseInt(bpItem.value.split('/')[0]) || 120) : (118 + (idx % 3) * 3);
      const diastolic = bpItem ? (parseInt(bpItem.value.split('/')[1]) || 80) : (78 + (idx % 2) * 2);

      const glucoseItem = glucoseLogs[idx];
      const glucose = glucoseItem ? (parseFloat(glucoseItem.value) || 100) : (94 + (idx % 3) * 6);

      const sleepItem = sleepLogs[idx];
      const sleep = sleepItem ? (parseFloat(sleepItem.value) || 7.0) : (6.8 + (idx % 2) * 0.4);

      const weightItem = weightLogs[idx];
      const weight = weightItem ? (parseFloat(weightItem.value) || 154) : (154 - (idx % 4) * 0.2);

      const hrItem = hrLogs[idx];
      const hr = hrItem ? (parseFloat(hrItem.value) || 72) : (68 + (idx % 5) * 2);

      return {
        name: day,
        SystolicBP: systolic,
        DiastolicBP: diastolic,
        Glucose: glucose,
        Sleep: sleep,
        Weight: weight,
        HeartRate: hr
      };
    });
  };

  const currentTrendData = getDynamicTrendData();

  // Handle active record logging
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logValue.trim()) {
      onTriggerToast('Provide a value for the metric', 'error');
      return;
    }
    onAddLog(logMetric, logValue, logNotes);
    setLogValue('');
    setLogNotes('');
  };

  // Profile saves
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppUser = {
      ...session,
      name: profName,
      email: profEmail,
      avatar: profAvatar,
      emergencyContactName: profContactName,
      emergencyContactPhone: profContactPhone,
      emergencyContactRelation: profContactRelation,
      insuranceProvider: profInsProvider,
      insuranceMemberId: profInsMemberId,
      insuranceGroupId: profInsGroupId,
      addressStreet: profAddrStreet,
      addressCity: profAddrCity,
      addressState: profAddrState,
      addressZip: profAddrZip
    };
    onUpdateProfile(updated);
    onTriggerToast('Healthcare account profile committed successfully!', 'success');
  };

  // Recommendation 1: Dynamic Initial SVG Creator & Custom Image reader
  const generateInitialSvg = (colorGradientHexes: string[]) => {
    const initial = (profName || session.name || "U").charAt(0).toUpperCase();
    // Clean SVG with radial gradient and initial text
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorGradientHexes[0]}"/>
          <stop offset="100%" stop-color="${colorGradientHexes[1]}"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#avatarGrad)"/>
      <text x="50%" y="55%" font-family="system-ui, sans-serif" font-size="46" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    setProfAvatar(dataUrl);
    onTriggerToast("Custom initials gradient profile icon generated!", "success");
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onTriggerToast("Profile image exceeds 2MB limit structure.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProfAvatar(reader.result);
          onTriggerToast("Device clinical photograph uploaded!", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // GAP Health - Booking Form Submission Handler
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProviderId) {
      onTriggerToast('Please select a healthcare provider first.', 'error');
      return;
    }
    if (!bookingDateTime) {
      onTriggerToast('Please select an appointment time slot.', 'error');
      return;
    }
    const selectedProvider = providers.find(p => p.id === bookingProviderId);
    if (!selectedProvider) {
      onTriggerToast('Invalid physician profile selection.', 'error');
      return;
    }

    onAddBooking(
      bookingProviderId,
      selectedProvider.name,
      selectedProvider.avatar,
      selectedProvider.specialty,
      bookingMode,
      bookingDateTime
    );

    // Reset fields
    setBookingDateTime('');
    setBookingReason('');
    onTriggerToast(`Appointment successfully booked with ${selectedProvider.name}!`, 'success');
  };

  // GAP Health - Redesigned Ahomka/Vitals Submission Handler
  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse individual blood pressure readings
    const s1 = parseInt(sys1) || 120;
    const d1 = parseInt(dia1) || 80;
    const p1 = parseInt(pulse1) || 72;

    const s2 = parseInt(sys2) || 122;
    const d2 = parseInt(dia2) || 82;
    const p2 = parseInt(pulse2) || 73;

    const s3 = parseInt(sys3) || 118;
    const d3 = parseInt(dia3) || 79;
    const p3 = parseInt(pulse3) || 70;

    // Calculate averages mathematically
    const avgSys = Math.round((s1 + s2 + s3) / 3);
    const avgDia = Math.round((d1 + d2 + d3) / 3);
    const avgPulse = Math.round((p1 + p2 + p3) / 3);

    // Compute dynamic wellbeing index based on physical feeling rating:
    let mood = 8;
    let stress = 3;
    let painLevel = 2;

    if (vitalsFeeling.includes('Great')) {
      mood = 10;
      stress = 1;
      painLevel = 1;
    } else if (vitalsFeeling.includes('Good')) {
      mood = 8;
      stress = 3;
      painLevel = 2;
    } else if (vitalsFeeling.includes('Not Good')) {
      mood = 5;
      stress = 6;
      painLevel = 5;
    } else if (vitalsFeeling.includes('Poor')) {
      mood = 3;
      stress = 8;
      painLevel = 8;
    }

    // Compose clinical notes summary
    const symptomsStr = vitalsSymptoms.length > 0 ? `Symptoms: ${vitalsSymptoms.join(', ')}` : 'No Symptoms';
    const finalNotes = `Feelings today: ${vitalsFeeling}. Adherence status: ${vitalsMedication}. Reported: ${symptomsStr}.`;

    // Commit entry to overall ahomkaEntries list using props function
    onAddAhomkaEntry(
      mood,
      stress,
      painLevel,
      vitalsSymptoms,
      finalNotes,
      avgSys,
      avgDia,
      avgPulse,
      vitalsFeeling,
      vitalsMedication,
      [
        { systolic: s1, diastolic: d1, pulse: p1 },
        { systolic: s2, diastolic: d2, pulse: p2 },
        { systolic: s3, diastolic: d3, pulse: p3 }
      ]
    );

    // Evaluate current blood pressure standing classification
    let statusText = 'Normal';
    if (avgSys >= 140 || avgDia >= 90) {
      statusText = 'Hypertension Stage 2 (High Risk)';
    } else if ((avgSys >= 130 && avgSys <= 139) || (avgDia >= 80 && avgDia <= 89)) {
      statusText = 'Hypertension Stage 1 (Elevated)';
    } else if (avgSys >= 120 && avgSys <= 129 && avgDia < 80) {
      statusText = 'Pre-Hypertension (Elevated)';
    }

    // Set success summary modal elements
    setVitalsSuccessSummary({
      systolic: avgSys,
      diastolic: avgDia,
      pulse: avgPulse,
      status: statusText
    });

    setShowVitalsSuccessModal(true);
    onTriggerToast('Health Vitals blood pressure logged successfully!', 'success');
  };

  const toggleVitalsSymptom = (symptom: string) => {
    setVitalsSymptoms(prev => {
      // If user checks 'No Symptoms', toggle it
      if (symptom === 'No Symptoms') {
        if (prev.includes('No Symptoms')) {
          return [];
        }
        return ['No Symptoms'];
      }
      const filtered = prev.filter(s => s !== 'No Symptoms');
      return filtered.includes(symptom) ? filtered.filter(s => s !== symptom) : [...filtered, symptom];
    });
  };

  const resetVitalsForm = () => {
    setVitalsFeeling('');
    setVitalsSymptoms([]);
    setVitalsMedication('');
    setSys1('120');
    setDia1('80');
    setPulse1('72');
    setSys2('122');
    setDia2('82');
    setPulse2('73');
    setSys3('118');
    setDia3('79');
    setPulse3('70');
    setVitalsStep('dashboard');
  };

  // GAP Health - Send Community Board Message Header
  const handleSendCommMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commInput.trim()) return;
    onSendCommunityMessage(commSelectedChannel, commInput.trim());
    setCommInput('');
    onTriggerToast('Community feed message posted!', 'success');
  };

  // GAP Health - AI Clinical Lab Summarizer Handler
  const handleSummarizeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summarizerText.trim()) {
      onTriggerToast('Please provide some clinical report text or data metrics.', 'error');
      return;
    }
    setIsSummarizing(true);
    setSummarizerResult('');
    try {
      // Connect to full-stack Gemini API endpoint
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please act as standard expert clinician. Summarize this lab test or medical report: "${summarizerText}". Highlight out-of-bounds metrics (elevated, deficient), explain clinical implications briefly, and offer standard natural food/lifestyle advice in bullet points. Deliver response in clean Markdown with clear division lines.`,
          roleContext: 'patient'
        })
      });

      if (!response.ok) {
        throw new Error('Full-stack API is restricted.');
      }
      const data = await response.json();
      setSummarizerResult(data.reply || data.text || 'Unavailable.');
      onTriggerToast('Lab report analyzed with server-side AI!', 'success');
    } catch (err: any) {
      console.warn('summarizer prompt fallback triggered:', err.message);
      // Clean diagnostic parameters offline matching structure
      setTimeout(() => {
        let fakeResult = "📊 **GAP Clinical AI Diagnostic Summary (Sandbox Backup Mode)**\n\n";
        
        const lowerText = summarizerText.toLowerCase();
        if (lowerText.includes('pressure') || lowerText.includes('bp') || lowerText.includes('systolic')) {
          fakeResult += "### 🔴 Cardiovascular Blood Pressure Profile\n";
          fakeResult += "- **Observations**: Elevating metrics imply mild cardiovascular tension.\n";
          fakeResult += "- **Standard Bounds**: Target range is ≤ 120/80 mmHg. Critical concerns are classified > 140/90.\n";
          fakeResult += "- **Action Plan**: Practice sodium restriction (< 1500mg/day) and review circadian REM guidance on the Education Library.\n\n";
        }
        if (lowerText.includes('hba1c') || lowerText.includes('glucose') || lowerText.includes('sugar')) {
          fakeResult += "### 🩸 Endocrinology Glycemic Profile\n";
          fakeResult += "- **Observations**: High fasting blood sugar or glycemic spiking noted.\n";
          fakeResult += "- **Standard Bounds**: Fasting glucose target is 70-99 mg/dL. Chronic elevation signifies insulin resistance.\n";
          fakeResult += "- **Action Plan**: Plan 15-minute post-intake moderate walking, focus on high-fiber whole foods (like local brown millet), and monitor indices pre-meal.\n\n";
        }
        if (lowerText.includes('cholesterol') || lowerText.includes('ldl') || lowerText.includes('lipid')) {
          fakeResult += "### 🧪 Lipid Cardiovascular Profile\n";
          fakeResult += "- **Observations**: Hyperlipidemia parameters are detected.\n";
          fakeResult += "- **Standard Bounds**: Standard LDL target lies below 100 mg/dL.\n";
          fakeResult += "- **Action Plan**: Shift dietary focus towards high soluble fats (omega-3 oils, local seeds) and decrease hydrogenated lipids.\n\n";
        }
        
        if (fakeResult === "📊 **GAP Clinical AI Diagnostic Summary (Sandbox Backup Mode)**\n\n") {
          fakeResult += "### 📋 General Diagnostic Telemetry\n";
          fakeResult += "- **Observations**: Logged report data evaluated.\n";
          fakeResult += "- **Baseline Analysis**: Primary indices reflect stable clinical margins, but some metrics invite adjustments.\n";
          fakeResult += "- **Action Plan**: Daily log trackings across sleep and blood pressure on the Health Tracker Logs pane. Consult Dr. Jenkins during your next consultation slot.";
        }
        
        setSummarizerResult(fakeResult);
        onTriggerToast('Diagnostic report analyzed with medical offsets.', 'info');
      }, 1200);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Simulating live wave recording notes
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      // Stop recording and emit fake voice message
      clearInterval(recordingTimerRef.current);
      setIsRecordingVoice(false);
      onSendMessage(chatSelectedConvId, `🎤 Voice Note (${recordingSeconds}s) [Transcription: My resting blood pressure feels incredibly stable post medication dosage, but my sleep duration dropped slightly. I will watch REM curves.]`, {
        attachmentType: 'audio',
        attachmentName: `Voice_Memo_00${recordingSeconds}.wav`
      });
      setRecordingSeconds(0);
      onTriggerToast('Voice message dispatched encrypted', 'success');
    } else {
      // Start recording
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      onTriggerToast('Recording biometric voice note...');
    }
  };

  useEffect(() => {
    return () => clearInterval(recordingTimerRef.current);
  }, []);

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputMessage.trim()) return;
    
    if (editingMessageId) {
      if (onEditMessage) {
        onEditMessage(chatSelectedConvId, editingMessageId, chatInputMessage.trim());
      }
      setEditingMessageId(null);
    } else {
      onSendMessage(chatSelectedConvId, chatInputMessage.trim());
    }
    setChatInputMessage('');
  };

  // Fake image attachment uploading
  const handleImageAttachment = () => {
    const mockImageName = 'Heart_Biometrics_Screenshot.png';
    onSendMessage(chatSelectedConvId, `🖼️ Shared Screenshot Details`, {
      attachmentType: 'image',
      attachmentName: mockImageName,
      attachmentUrl: 'https://images.unsplash.com/photo-1516062423079-7ca13cca77a8?w=300&auto=format&fit=crop&q=80'
    });
    onTriggerToast('Cardiology scan uploaded successfully', 'success');
  };

  const handleFileAttachment = () => {
    const mockFileName = 'Standard_Telemetry_Report_June.pdf';
    onSendMessage(chatSelectedConvId, `📄 Shared File: ${mockFileName}`, {
      attachmentType: 'file',
      attachmentName: mockFileName
    });
    onTriggerToast('Telemetry report referenced', 'success');
  };

  // Calculated BMI and high risk indicators calculations
  const calculateCurrentBMI = () => {
    const weightItem = logs.find(l => l.metric === 'Weight');
    if (!weightItem) return '--';
    const weight = parseFloat(weightItem.value);
    if (isNaN(weight)) return '--';
    // Assume general BMI tracking height (70 inches)
    const heightInches = 70;
    const bmiVal = (weight * 703) / (heightInches * heightInches);
    return bmiVal.toFixed(1);
  };

  const get30DaysSummary = () => {
    // Current local time is 2026-06-08T00:50:51Z
    const now = new Date("2026-06-08T00:50:51Z").getTime();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Gather heart rate entries
    const hrLogs = logs.filter(l => l.metric === 'Heart Rate');
    const hrAhomka = ahomkaEntries.filter(e => e.pulse !== undefined).map(e => ({
      timestamp: e.timestamp,
      value: String(e.pulse)
    }));
    const allHR = [...hrLogs, ...hrAhomka];

    // Gather glucose entries
    const glucoseLogs = logs.filter(l => l.metric === 'Blood Glucose');

    // Gather blood pressure entries
    const bpLogs = logs.filter(l => l.metric === 'Blood Pressure');
    const bpAhomka = ahomkaEntries.filter(e => e.systolic !== undefined && e.diastolic !== undefined).map(e => ({
      timestamp: e.timestamp,
      value: `${e.systolic}/${e.diastolic}`
    }));
    const allBP = [...bpLogs, ...bpAhomka];

    const parseLogDate = (ts: string) => {
      try {
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      } catch {
        return 0;
      }
    };

    const isWithin30Days = (ts: string) => {
      const t = parseLogDate(ts);
      if (t === 0) return true; // fallback
      return t >= thirtyDaysAgo;
    };

    // Filter within 30 days or fallback
    let hr30 = allHR.filter(h => isWithin30Days(h.timestamp));
    if (hr30.length === 0) hr30 = allHR;

    let glucose30 = glucoseLogs.filter(g => isWithin30Days(g.timestamp));
    if (glucose30.length === 0) glucose30 = glucoseLogs;

    let bp30 = allBP.filter(b => isWithin30Days(b.timestamp));
    if (bp30.length === 0) bp30 = allBP;

    // Calculate Average HR
    let avgHR = 0;
    if (hr30.length > 0) {
      const sum = hr30.reduce((acc, curr) => acc + (parseFloat(curr.value) || 72), 0);
      avgHR = Math.round(sum / hr30.length);
    }

    // Calculate Average Glucose
    let avgGlucose = 0;
    if (glucose30.length > 0) {
      const sum = glucose30.reduce((acc, curr) => acc + (parseFloat(curr.value) || 104), 0);
      avgGlucose = Math.round(sum / glucose30.length);
    }

    // Calculate Average BP
    let avgSystolic = 0;
    let avgDiastolic = 0;
    if (bp30.length > 0) {
      let sysSum = 0;
      let diaSum = 0;
      let count = 0;
      bp30.forEach(b => {
        const parts = b.value.split('/');
        if (parts.length === 2) {
          const sys = parseFloat(parts[0]);
          const dia = parseFloat(parts[1]);
          if (!isNaN(sys) && !isNaN(dia)) {
            sysSum += sys;
            diaSum += dia;
            count++;
          }
        }
      });
      if (count > 0) {
        avgSystolic = Math.round(sysSum / count);
        avgDiastolic = Math.round(diaSum / count);
      }
    }

    return {
      avgHR: avgHR || 72,
      avgGlucose: avgGlucose || 104,
      avgSystolic: avgSystolic || 122,
      avgDiastolic: avgDiastolic || 81,
      hrCount: hr30.length,
      glucoseCount: glucose30.length,
      bpCount: bp30.length
    };
  };

  const activeBMI = calculateCurrentBMI();
  const activeBP = logs.find(l => l.metric === 'Blood Pressure')?.value || '--';
  const activeGlucose = logs.find(l => l.metric === 'Blood Glucose')?.value || '--';
  const activeSleep = logs.find(l => l.metric === 'Sleep Quality')?.value || '--';
  const activeHR = logs.find(l => l.metric === 'Heart Rate')?.value || '--';
  const activeWeight = logs.find(l => l.metric === 'Weight')?.value || '--';

  const selectedConv = conversations.find(c => c.id === chatSelectedConvId) || conversations[0] || null;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      
      {/* Patient Sidebar navigation rails */}
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0 p-4 space-y-1.5 flex md:flex-col justify-between md:justify-start">
        <div className="w-full space-y-1">
          <button 
            id="tab-pat-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Activity className="w-4 h-4" />
            <span className="md:inline">Wellness Dashboard</span>
          </button>
          
          <button 
            id="tab-pat-messages"
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="md:inline flex items-center justify-between w-full">
              <span>Secure Messaging</span>
              {selectedConv?.unread > 0 && (
                <span className="bg-rose-500 text-white w-2.5 h-2.5 rounded-full animate-ping"></span>
              )}
            </span>
          </button>

          <button 
            id="tab-pat-providers"
            onClick={() => setActiveTab('providers')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'providers' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Stethoscope className="w-4 h-4" />
            <span className="md:inline">Book Provider</span>
          </button>

          <button 
            id="tab-pat-ahomka"
            onClick={() => setActiveTab('ahomka')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'ahomka' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Heart className="w-4 h-4" />
            <span className="md:inline font-bold">Ahomka Ho (Health Vitals)</span>
          </button>

          <button 
            id="tab-pat-community"
            onClick={() => setActiveTab('community')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'community' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            <span className="md:inline">Community Chat</span>
          </button>

          <button 
            id="tab-pat-education"
            onClick={() => setActiveTab('education')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'education' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="md:inline">Education Library</span>
          </button>

          <button 
            id="tab-pat-ai"
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Brain className="w-4 h-4" />
            <span className="md:inline flex items-center gap-1">
              <span>GAP Clinical AI</span>
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
            </span>
          </button>

          <button 
            id="tab-pat-profile"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <User className="w-4 h-4" />
            <span className="md:inline">Update Profile Info</span>
          </button>
        </div>
      </aside>

      {/* Primary Patient tabs rendering viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* TAB 1: Patient Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="bg-gradient-to-r from-indigo-800 to-slate-900 text-white rounded-2xl shadow-xl p-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 w-44">
                <Heart className="w-full h-full text-white" />
              </div>
              <div className="relative">
                <span className="bg-indigo-500 text-[10px] font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wider">Patient Portal</span>
                <h2 className="font-display text-xl font-bold mt-3 leading-tight">Welcome to your secure health desk, {session.name}</h2>
                <p className="text-xs text-indigo-200 mt-1 max-w-lg">Monitor critical trends, direct message Dr. Jenkins in real time, and audit educational journals HIPAA-securely.</p>
              </div>
            </div>

            {/* Dashboard grid metrics cards - 6 clinical measures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Systolic pressure</span>
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                </p>
                <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{activeBP} <span className="text-[10px] font-normal text-slate-400">mmHg</span></p>
                <span className="text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">Healthy BP Target</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Serum Glucose</span>
                  <Droplet className="w-3.5 h-3.5 text-red-500" />
                </p>
                <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{activeGlucose} <span className="text-[10px] font-normal text-slate-400">mg/dL</span></p>
                <span className="text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">Fasting Optimal</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Rest bpm</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                </p>
                <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{activeHR} <span className="text-[10px] font-normal text-slate-400">bpm</span></p>
                <span className="text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">Standard Rhythm</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Circadian Sleep</span>
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                </p>
                <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{activeSleep} <span className="text-[10px] font-normal text-slate-400">hrs</span></p>
                <span className="text-[10px] text-sky-500 font-bold bg-sky-50 px-2 py-0.5 rounded mt-2 inline-block">REM Efficiency</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Body Mass Weight</span>
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                </p>
                <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{activeWeight} <span className="text-[10px] font-normal text-slate-400">lbs</span></p>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded mt-2 inline-block">Consistent Target</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Computed BMI</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </p>
                <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{activeBMI}</p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded mt-2 inline-block">Healthy BMI (18.5-24.9)</span>
              </div>

              {/* Combined caloric and compliance summary details */}
              <div className="col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Adherence Compliance
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">92% weekly compliance. You checked in logs for 6 consecutive days. Stretch targets finalized.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">Stable</span>
                </div>
              </div>

            </div>

            {/* GAP Health - Summary Stats Widget: 30-Day Clinical Summary Stats */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    30-Day Clinical Summary Stats
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Calculated longitudinal averages of logged physiological criteria</p>
                </div>
                <span className="text-[9px] font-mono font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/60 self-start sm:self-auto">
                  Period: Last 30 Days
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Average BP Card */}
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30 flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 rounded-xl shadow-2xs shrink-0 border border-slate-100 dark:border-slate-700">
                    <Heart className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">Blood Pressure Average</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {get30DaysSummary().avgSystolic}/{get30DaysSummary().avgDiastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span>
                    </h4>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold block mt-0.5">Compiled from {get30DaysSummary().bpCount} records</span>
                  </div>
                </div>

                {/* 2. Average Glucose Card */}
                <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl border border-rose-100/60 dark:border-rose-900/30 flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-450 rounded-xl shadow-2xs shrink-0 border border-slate-100 dark:border-slate-700">
                    <Droplet className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">Serum Glucose Average</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {get30DaysSummary().avgGlucose} <span className="text-xs text-slate-400 font-normal">mg/dL</span>
                    </h4>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold block mt-0.5">Compiled from {get30DaysSummary().glucoseCount} records</span>
                  </div>
                </div>

                {/* 3. Average Heart Rate Card */}
                <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30 flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-405 rounded-xl shadow-2xs shrink-0 border border-slate-100 dark:border-slate-700">
                    <Activity className="w-5 h-5 text-indigo-505" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">Heart Rate Average</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {get30DaysSummary().avgHR} <span className="text-xs text-slate-400 font-normal">bpm</span>
                    </h4>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold block mt-0.5">Compiled from {get30DaysSummary().hrCount} records</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Middle Section: Trends preview and checklists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Checklist cards */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Active Daily Reminders</h4>
                  <p className="text-[10px] text-slate-400">Complete tasks to optimize your wellness index</p>
                </div>
                
                <div className="space-y-2">
                  {reminders.map(rem => (
                    <div 
                      key={rem.id}
                      onClick={() => toggleReminder(rem.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition ${rem.done ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 line-through border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 hover:border-indigo-400 text-slate-800 dark:text-slate-105 shadow-2xs'}`}
                    >
                      <div className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 ${rem.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {rem.done && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium">{rem.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini AI workspace summary */}
              <div className="lg:col-span-2 bg-[#F8FAFC] dark:bg-slate-900/60 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Clinician Assistant Recommendation
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-2 italic">
                    "{session.name.split(' ')[0]}, your health score registers optimal at 92%. We detected a slight elevation in Systolic index yesterday. We highly suggest maintaining strict sodium limit targets and consulting Dr. Jenkins if dizziness returns during morning logging."
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-between items-center mt-4">
                  <span className="text-[10px] text-slate-440 font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Clinical references up-to-date
                  </span>
                  <button 
                    onClick={() => setActiveTab('ai')}
                    className="p-1 px-3 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-lg text-[10px] transition"
                  >
                    Discuss with AI Assistant
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: Messages Thread */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex h-[480px] overflow-hidden">
            
            {/* Conversations List */}
            <div className="w-48 border-r border-slate-150 shrink-0 flex flex-col pt-4 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-4 mb-3">Care Team Providers</span>
              <div className="flex-1 overflow-y-auto space-y-1">
                {conversations.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => { setChatSelectedConvId(c.id); c.unread = 0; }}
                    className={`p-3 mx-2 rounded-lg cursor-pointer transition ${c.id === chatSelectedConvId ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <p className="font-bold text-xs truncate leading-none">{c.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{c.specialty}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main message window */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-3 border-b bg-slate-50/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={selectedConv.avatar} alt={selectedConv.name} className="w-8 h-8 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-none">{selectedConv.name}</h5>
                    <p className="text-[9px] text-slate-400 mt-1">{selectedConv.specialty}</p>
                  </div>
                </div>
                <div className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">Encrypted Connection</div>
              </div>

              {/* Message balloons list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-slate-950/20">
                {selectedConv.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-xl text-xs ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1 border-b border-indigo-500/20 pb-0.5">
                        <p className="font-bold text-[9px] opacity-75">{m.senderName}</p>
                        {m.sender === 'user' && (
                          <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition shrink-0 select-none">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(m.id);
                                setChatInputMessage(m.content);
                              }}
                              className="text-white hover:text-indigo-200 transition p-0.5"
                              title="Edit sent message"
                            >
                              <Edit className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteMessage) {
                                  onDeleteMessage(chatSelectedConvId, m.id);
                                }
                              }}
                              className="text-white hover:text-rose-200 transition p-0.5"
                              title="Delete message"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Optional attachments renderings */}
                      {m.attachmentType === 'image' && m.attachmentUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
                          <img src={m.attachmentUrl} alt="scan" className="w-full h-auto max-h-36 object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      {m.attachmentType === 'file' && (
                        <div className="mb-2 p-2 bg-slate-900/10 rounded border flex items-center gap-2 text-[11px] font-semibold text-slate-100">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{m.attachmentName}</span>
                        </div>
                      )}

                      {m.attachmentType === 'audio' && (
                        <div className="mb-2 p-2 bg-indigo-900/20 rounded border border-indigo-500/20 flex items-center gap-2 text-[10px] font-semibold">
                          <span className="animate-pulse">🎙️</span>
                          <span className="truncate">Voice Memo (Simulated Playback ready)</span>
                        </div>
                      )}

                      <p className="leading-snug">{m.content}</p>
                      <span className="text-[8px] opacity-60 text-right block mt-1.5">{m.time}</span>
                    </div>
                  </div>
                ))}
                
                {isDoctorTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-xs rounded-tl-none animate-pulse">
                      Dr. Aris is summarizing recommendations...
                    </div>
                  </div>
                )}
              </div>

              {/* Secure message composer with attachments */}
              <div className="p-3 border-t shrink-0 bg-slate-50/10 space-y-2">
                
                {editingMessageId && (
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] py-1.5 px-3 rounded-lg">
                    <span className="font-medium">Editing previously sent message...</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingMessageId(null);
                        setChatInputMessage('');
                      }}
                      className="text-indigo-500 hover:text-indigo-750 font-bold dark:text-indigo-405 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}

                {/* Simulated recording control bar */}
                {isRecordingVoice && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-2 px-3 rounded-lg flex items-center justify-between animate-pulse">
                    <span className="font-bold flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-red-500 animate-bounce" />
                      <span>Recording encrypted voice: 0:0{recordingSeconds} seconds</span>
                    </span>
                    <button 
                      onClick={toggleVoiceRecording}
                      className="bg-red-600 px-2 py-1 text-white font-bold rounded text-[10px]"
                    >
                      Stop & Dispatch
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendTextMessage} className="flex gap-2">
                  <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={toggleVoiceRecording}
                      title="Simulate Voice recording"
                      className={`p-1.5 border rounded-lg transition ${isRecordingVoice ? 'bg-red-500 text-white' : 'hover:bg-slate-100 bg-white'}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleImageAttachment}
                      title="Attach Medical Screenshot Scan"
                      className="p-1.5 border hover:bg-slate-100 bg-white rounded-lg transition"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>

                  <input 
                    id="pat-message-input"
                    type="text"
                    value={chatInputMessage}
                    onChange={(e) => setChatInputMessage(e.target.value)}
                    placeholder="Type encrypted message notices..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-800"
                  />
                  <button 
                    id="pat-message-submit"
                    type="submit"
                    className="bg-indigo-600 hover:bg-slate-900 text-white font-bold p-1 px-3.5 rounded-lg text-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: Educational Articles & recommended videos */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl border">
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-white">Scientific Education Hub</h4>
                <p className="text-[10px] text-slate-400 font-medium">Read medical journals or consult training visual modules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(art => (
                <div key={art.id} className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
                  <img src={art.bannerUrl} alt="banner" className="w-full h-36 object-cover" referrerPolicy="no-referrer" />
                  <div className="p-4 flex-1">
                    <span className="text-[9px] font-bold text-indigo-600 tracking-widest uppercase">{art.category}</span>
                    <h5 className="font-bold text-xs text-slate-900 mt-1 leading-snug">{art.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2">{art.summary}</p>
                  </div>
                  <div className="p-4 bg-slate-50/20 border-t flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-400">By {art.author}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 5: GAP Clinical AI assistant with split-grid Diagnostic Summarizer */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Conversations with AI Assistant */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-900">
              <div className="p-3 border-b border-indigo-900/30 flex justify-between items-center bg-slate-900/30 shrink-0">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">GAP AI Clinician Companion</h4>
                    <p className="text-[9px] text-indigo-400">Powered by server-side gemini-3.5-flash with local offsets</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded font-bold">API Online</span>
              </div>

              {/* AI message history bubble */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed">
                {aiChat.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3.5 rounded-xl max-w-md ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-100 border-l-2 border-indigo-500'}`}>
                      <p className="text-[8px] opacity-60 font-sans uppercase mb-1">{m.role === 'user' ? session.name : 'GAP AI Assistant'}</p>
                      <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="bg-slate-900 p-3 rounded-lg text-slate-400 animate-pulse text-[10px] w-56">
                    GAP AI matching clinical benchmarks...
                  </div>
                )}
              </div>

              {/* suggested guidelines questions prompts */}
              <div className="px-4 py-2 border-t border-indigo-950 flex flex-wrap gap-1.5 shrink-0">
                <button 
                  onClick={() => onSendAIChat('Analyze blood pressure logs')}
                  className="bg-slate-900 hover:bg-slate-800 text-[9px] font-bold py-1 px-2.5 rounded border border-indigo-500/20 text-indigo-300"
                >
                  Analyze BP trends
                </button>
                <button 
                  onClick={() => onSendAIChat('Explain optimal weight target calculations')}
                  className="bg-slate-900 hover:bg-slate-800 text-[9px] font-bold py-1 px-2.5 rounded border border-indigo-500/20 text-indigo-300"
                >
                  Weight guidelines
                </button>
                <button 
                  onClick={() => onSendAIChat('How should I structure sleep REM quality cycles?')}
                  className="bg-slate-900 hover:bg-slate-800 text-[9px] font-bold py-1 px-2.5 rounded border border-indigo-500/20 text-indigo-300"
                >
                  Explain REM quality
                </button>
              </div>

              {/* input formulary */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const inputField = document.getElementById('pat-ai-input') as HTMLInputElement;
                if (inputField && inputField.value.trim()) {
                  onSendAIChat(inputField.value.trim());
                  inputField.value = '';
                }
              }} className="p-3 border-t border-indigo-950 flex gap-2 shrink-0">
                <input 
                  id="pat-ai-input"
                  type="text"
                  placeholder="Ask GAP Clinical Q&A AI (e.g. 'Explain diastolic vs systolic targets')..."
                  className="flex-1 bg-slate-900/80 rounded-xl px-4 py-2 text-xs text-white border-none focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
                <button 
                  id="pat-ai-submit"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Synthesize</span>
                </button>
              </form>
            </div>

            {/* GAP Health - Lab Diagnostic Report Summarizer */}
            <div className="bg-white dark:bg-slate-100/10 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 h-[480px] flex flex-col justify-between overflow-hidden">
              <div className="p-3 border-b border-indigo-100 flex items-center gap-3 shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white">Diagnostic Lab Report Summarizer</h4>
                  <p className="text-[10px] text-slate-400">Summarize high-risk clinical ranges with GAP AI automatically</p>
                </div>
              </div>

              {/* Summarizer view content area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-semibold">
                {summarizerResult ? (
                  <div className="p-3.5 bg-indigo-50/45 dark:bg-slate-950/40 border-l-4 border-indigo-500 rounded-lg text-slate-800 dark:text-slate-200 leading-relaxed overflow-y-auto h-full max-h-[220px] markdown-body">
                    <p className="whitespace-pre-line">{summarizerResult}</p>
                  </div>
                ) : (
                  <div 
                    onClick={triggerFileSelect}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`h-full max-h-[220px] flex flex-col items-center justify-center text-center p-4 cursor-pointer border-2 border-dashed rounded-xl transition duration-150 ${
                      isDraggingFile 
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/20' 
                        : 'border-slate-200 hover:border-indigo-400 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <Sparkles className={`w-7 h-7 text-indigo-500 mb-2 ${isDraggingFile ? 'scale-110' : 'animate-bounce animate-pulse'}`} />
                    <p className="font-bold text-slate-850 dark:text-slate-300">
                      {isDraggingFile ? 'Drop your report file here!' : 'Drag & drop report or click to select'}
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 max-w-xs mt-1">
                      Supports medical scans, text logs, or clinical CSV files up to 5MB.
                    </p>
                  </div>
                )}
              </div>

              {/* form controls */}
              <form onSubmit={handleSummarizeReport} className="p-3 border-t space-y-3 shrink-0">
                <div>
                  <textarea 
                    value={summarizerText}
                    onChange={(e) => setSummarizerText(e.target.value)}
                    placeholder="Example: HbA1c is 6.4%, Lipids show LDL limits are 128 mg/dL, with Blood Pressure measuring 138/89 mmHg..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-800 border focus:border-indigo-600 focus:outline-none rounded-xl text-xs py-2 px-3 text-slate-950 dark:text-white font-medium"
                    required
                  />
                  {/* suggested template buttons */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <button 
                      type="button"
                      onClick={() => setSummarizerText('Diagnostic Lipid blood report: LDL Cholesterol measures 148 mg/dL, Triglycerides 190. Fasting glucose is 108 mg/dL.')}
                      className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[8px] text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      LDL / Glucose Template
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSummarizerText('Cardiorespiratory checkup: Systolic average blood pressure 138 mmHg, Diastolic blood pressure average 89 mmHg. Heart rate is 84.')}
                      className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[8px] text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      BP / Pulse Template
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => { setSummarizerText(''); setSummarizerResult(''); }}
                    className="p-2 text-slate-400 hover:text-red-600 font-bold text-[10px] border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                  >
                    Clear
                  </button>
                  <button 
                    id="pat-summarize-submit"
                    type="submit"
                    disabled={isSummarizing}
                    className="flex-1 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    {isSummarizing ? (
                      <span className="animate-pulse">Processing analysis...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Summarize Report Metrics</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* GAP Health GAP-1: Book Provider tab */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-sky-800 to-indigo-900 text-white rounded-2xl shadow-xl p-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 w-44">
                <Stethoscope className="w-full h-full text-white" />
              </div>
              <div>
                <span className="bg-sky-500 text-[10px] font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wider">Clinicians Registry</span>
                <h2 className="font-display text-xl font-bold mt-2 leading-tight">Virtual Care Consultations</h2>
                <p className="text-xs text-sky-200 mt-1 max-w-lg">Connect immediately with certified medical specialists in Ghana & Gambia. Schedule video, audio, or secure messaging consults.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Booking Form Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs self-start">
                <h4 className="font-bold text-xs text-slate-905 dark:text-white mb-4">Schedule Consultations</h4>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Select Specialty Provider</label>
                    <select 
                      id="pat-book-provider"
                      value={bookingProviderId}
                      onChange={(e) => {
                        setBookingProviderId(e.target.value);
                        // Default first slot of selected provider
                        const selected = providers.find(p => p.id === e.target.value);
                        if (selected && selected.slots.length > 0) {
                          setBookingDateTime(selected.slots[0]);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 focus:border-indigo-600 focus:outline-none rounded-lg text-xs py-2 px-3 text-slate-900 dark:text-white font-semibold"
                      required
                    >
                      <option value="">-- Choose Physician --</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Consultation Mode</label>
                    <select 
                      id="pat-book-mode"
                      value={bookingMode}
                      onChange={(e) => setBookingMode(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 focus:border-indigo-600 focus:outline-none rounded-lg text-xs py-2 px-3 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Video Call">📹 Video Telehealth Consultation</option>
                      <option value="Audio Call">📞 Standard Audio Call</option>
                      <option value="Secure Chat">💬 Extended Secure Messaging</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Available Slots</label>
                    <select 
                      id="pat-book-slot"
                      value={bookingDateTime}
                      onChange={(e) => setBookingDateTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 focus:border-indigo-600 focus:outline-none rounded-lg text-xs py-2 px-3 font-semibold text-slate-900 dark:text-white"
                      required
                      disabled={!bookingProviderId}
                    >
                      <option value="">-- Select Time Slot --</option>
                      {bookingProviderId && providers.find(p => p.id === bookingProviderId)?.slots.map((slot, idx) => (
                        <option key={idx} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Consultation Reason Notes</label>
                    <textarea 
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      placeholder="Describe symptoms, questions, or drug prescription renewal demands..."
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 focus:border-indigo-600 focus:outline-none rounded-lg text-xs py-2 px-3 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <button 
                    id="pat-book-submit-btn"
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Confirm Clinic Appointment</span>
                  </button>
                </form>
              </div>

              {/* Clinics Directory & Booking Logs Lists */}
              <div className="lg:col-span-2 space-y-6">
                {/* Booked appointment list */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-4">My Booked Sessions</h4>
                  <div className="space-y-3">
                    {bookings.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-900">
                        No clinical consultations scheduled yet. Choose a doctor or specialist slot to reserve!
                      </div>
                    ) : (
                      bookings.map(b => (
                        <div key={b.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={b.providerAvatar} alt={b.providerName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-none">{b.providerName}</h5>
                              <p className="text-[10px] text-slate-400 mt-1">{b.specialty}</p>
                              <p className="text-[11px] text-slate-500 font-bold mt-2 flex items-center gap-1">
                                <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded text-[10px]">
                                  {b.mode}
                                </span>
                                <span>on {b.dateTime}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                            <span className="bg-green-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded text-[10px]">
                              Confirmed
                            </span>
                            <button 
                              onClick={() => onCancelBooking(b.id)}
                              className="p-1 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Professional Clinician Cards */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-4">Available Doctors & Healthcare Providers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers.map(p => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 dark:border-slate-800 transition flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                          <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-full object-cover border shrink-0" />
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-none">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 mt-1">{p.specialty}</p>
                            <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mt-2">{p.hospital}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{p.location}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-800 dark:text-white">Fee: {p.fee}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setBookingProviderId(p.id);
                              if (p.slots.length > 0) {
                                setBookingDateTime(p.slots[0]);
                              }
                              onTriggerToast(`Selected ${p.name}. Review slots on the left menu Form.`, 'info');
                            }}
                            className="p-1.5 px-3 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Select Slots
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GAP Health GAP-2: Ahomka Ho Logs Well-being tab */}
        {activeTab === 'ahomka' && (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-indigo-900 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 w-48">
                <Activity className="w-full h-full text-white" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                    Ahomka Ho Vitals Platform
                  </span>
                  <h2 className="font-display text-2xl font-bold mt-2 tracking-tight">Clinical Blood Pressure Logger</h2>
                  <p className="text-xs text-slate-200 mt-1 max-w-xl">
                    "Ahomka Ho" is Twi for physical ease and relieving comfort. This module helps you register clinical-grade averages by logging three sequential measurements and resting to eliminate white-coat stress anomalies.
                  </p>
                </div>
                {vitalsStep === 'dashboard' && (
                  <button
                    onClick={() => {
                      resetVitalsForm();
                      setVitalsStep('step1');
                    }}
                    className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs py-3 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start Daily Vitals Logging</span>
                  </button>
                )}
              </div>
            </div>

            {/* DASHBOARD PREVIEW VIEW */}
            {vitalsStep === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Stats & Streak Bento Box Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Streak Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Daily Consistency</span>
                      <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                        <span>3 Days Streak</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">Excellent stability! Keep logging daily to track circulatory health.</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 text-xl font-bold animate-pulse">
                      ⚡
                    </div>
                  </div>

                  {/* Latest BP Average Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Latest BP (3-Reading Average)</span>
                      {ahomkaEntries.length > 0 && ahomkaEntries[0].systolic ? (
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {ahomkaEntries[0].systolic}/{ahomkaEntries[0].diastolic} <span className="text-xs text-slate-400 font-medium font-sans">mmHg</span>
                          </h4>
                          <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded ${
                            ahomkaEntries[0].systolic >= 140 ? 'bg-red-50 text-red-600' :
                            ahomkaEntries[0].systolic >= 130 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {ahomkaEntries[0].systolic >= 140 ? 'High Risk' :
                             ahomkaEntries[0].systolic >= 130 ? 'Stage 1 Elevated' : 'Optimal Normal'}
                          </span>
                        </div>
                      ) : (
                        <h4 className="text-base font-bold text-slate-400 mt-2">No readings logged yet</h4>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
                      <Heart className="w-6 h-6 fill-emerald-500" />
                    </div>
                  </div>

                  {/* Heart Rate / Pulse Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">My Pulse (Average Rate)</span>
                      {ahomkaEntries.length > 0 && ahomkaEntries[0].pulse ? (
                        <div>
                          <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            {ahomkaEntries[0].pulse} <span className="text-xs text-slate-400 font-medium font-sans">bpm</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1">Resting tachycardia screen stable.</p>
                        </div>
                      ) : (
                        <h4 className="text-base font-bold text-slate-400 mt-2">72 bpm (preset)</h4>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600">
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                </div>

                {/* Main Graph & Recommendations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Recharts Vital Averages Trend AreaGraph */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Multi-Reading Longitudinal Trends</h4>
                        <p className="text-[10px] text-slate-500">Ahomka Ho calculated blood pressure indices</p>
                      </div>
                      
                      {/* Interactive toggle view pagination dots for chart */}
                      <div className="flex items-center gap-1.5 self-start sm:self-center">
                        <button
                          onClick={() => setVitalsChartView('systolic')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            vitalsChartView === 'systolic' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Systolic Trend
                        </button>
                        <button
                          onClick={() => setVitalsChartView('diastolic')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            vitalsChartView === 'diastolic' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Diastolic Trend
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={ahomkaEntries.slice().reverse()} 
                          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                          accessibilityLayer={true}
                          onMouseMove={(e) => {
                            if (e && e.activeTooltipIndex !== undefined) {
                              setIsHoveringChart(true);
                            }
                          }}
                          onMouseLeave={() => {
                            setIsHoveringChart(false);
                          }}
                        >
                          <defs>
                            <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                          <XAxis dataKey="timestamp" fontSize={8} stroke="#94a3b8" />
                          <YAxis fontSize={9} domain={[40, 160]} stroke="#94a3b8" />
                          <Tooltip 
                            active={true}
                            {...({ coordinate: (!isHoveringChart && defaultTooltipCoord) ? defaultTooltipCoord : undefined } as any)}
                            content={({ payload }) => {
                              const hasPayload = payload && payload.length > 0;
                              const reversedEntries = ahomkaEntries.slice().reverse();
                              const defaultEntry = reversedEntries[reversedEntries.length - 1]; // latest entry
                              const entry = hasPayload ? payload[0].payload : defaultEntry;
                              
                              if (!entry) return null;
                              
                              return (
                                <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white rounded-xl p-3 shadow-2xl space-y-1.5 text-left border-l-4 border-l-indigo-500 font-sans min-w-[155px]">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                    {entry.timestamp}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-350 text-[11px] font-medium">Systolic:</span>
                                      <span className="font-mono text-xs font-bold text-white">{entry.systolic} mmHg</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-350 text-[11px] font-medium">Diastolic:</span>
                                      <span className="font-mono text-xs font-bold text-emerald-400">{entry.diastolic} mmHg</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-slate-350 text-[11px] font-medium">Pulse:</span>
                                      <span className="font-mono text-xs font-bold text-rose-450">{entry.pulse || 'N/A'} bpm</span>
                                    </div>
                                  </div>
                                  {entry.feeling && (
                                    <div className="pt-1.5 border-t border-slate-850 text-[9px] text-slate-450 italic break-words max-w-[150px]">
                                      "{entry.feeling}"
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          />
                          {vitalsChartView === 'systolic' ? (
                            <Area 
                              type="monotone" 
                              dataKey="systolic" 
                              stroke="#4f46e5" 
                              strokeWidth={2} 
                              fillOpacity={1} 
                              fill="url(#colorSys)" 
                              name="Systolic Average (mmHg)" 
                              dot={(props: any) => {
                                const { cx, cy, index } = props;
                                const isLast = index === (ahomkaEntries.length - 1);
                                if (isLast && cx && cy) {
                                  if (!defaultTooltipCoord || Math.abs(defaultTooltipCoord.x - cx) > 1 || Math.abs(defaultTooltipCoord.y - cy) > 1) {
                                    setTimeout(() => {
                                      setDefaultTooltipCoord({ x: cx - 75, y: cy - 130 });
                                    }, 50);
                                  }
                                }
                                return (
                                  <circle 
                                    key={`dot-sys-${index}`}
                                    cx={cx} 
                                    cy={cy} 
                                    r={isLast ? 6.5 : 4} 
                                    stroke="#ffffff" 
                                    strokeWidth={isLast ? 2.5 : 1.5} 
                                    fill="#4f46e5" 
                                    className={isLast ? "animate-pulse shadow-sm" : ""}
                                  />
                                );
                              }} 
                              activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }} 
                            />
                          ) : (
                            <Area 
                              type="monotone" 
                              dataKey="diastolic" 
                              stroke="#059669" 
                              strokeWidth={2} 
                              fillOpacity={1} 
                              fill="url(#colorDia)" 
                              name="Diastolic Average (mmHg)" 
                              dot={(props: any) => {
                                const { cx, cy, index } = props;
                                const isLast = index === (ahomkaEntries.length - 1);
                                if (isLast && cx && cy) {
                                  if (!defaultTooltipCoord || Math.abs(defaultTooltipCoord.x - cx) > 1 || Math.abs(defaultTooltipCoord.y - cy) > 1) {
                                    setTimeout(() => {
                                      setDefaultTooltipCoord({ x: cx - 75, y: cy - 130 });
                                    }, 50);
                                  }
                                }
                                return (
                                  <circle 
                                    key={`dot-dia-${index}`}
                                    cx={cx} 
                                    cy={cy} 
                                    r={isLast ? 6.5 : 4} 
                                    stroke="#ffffff" 
                                    strokeWidth={isLast ? 2.5 : 1.5} 
                                    fill="#059669" 
                                    className={isLast ? "animate-pulse shadow-sm" : ""}
                                  />
                                );
                              }} 
                              activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }} 
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pagination indicators visual cues */}
                    <div className="flex justify-center gap-1.5 mt-3">
                      <span className={`w-2 h-2 rounded-full transition-all ${vitalsChartView === 'systolic' ? 'bg-indigo-600 w-4' : 'bg-slate-200'}`}></span>
                      <span className={`w-2 h-2 rounded-full transition-all ${vitalsChartView === 'diastolic' ? 'bg-emerald-600 w-4' : 'bg-slate-200'}`}></span>
                    </div>

                  </div>

                  {/* African Contextualized Herb & Guideline Advice Box */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Cardio-Diet Advisory Support
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium">
                        Your latest arterial pressure average matches a highly stable compliance score. Leverage regional diet adaptations for high comfort:
                      </p>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="shrink-0 text-amber-500">☕</span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white block">Unsweetened Sobolo / Bissap</span>
                            Organic hibiscus active elements act as standard circulatory buffers. Boil without heavy sugar.
                          </div>
                        </div>

                        <div className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="shrink-0 text-indigo-500">🌾</span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white block">Sorghum & Sorrel Flours</span>
                            Low sodium index grain replacements avoid glycemic tension spike loads.
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab('education')}
                      className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] transition text-center"
                    >
                      Read Clinical Hypertension Guides
                    </button>
                  </div>

                </div>

                {/* Recent Logs Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">Recent Ahomka Ho Logs</h5>
                      <p className="text-[9px] text-slate-400">Clinical-ready 3-Reading systolic and diastolic snapshots</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                        {filteredAhomkaEntries.length} entries
                      </span>
                      {ahomkaEntries.length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportPatientLogsToCSV}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wide rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                          title="Export all blood pressure registers to safe CSV sheet"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Export CSV</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-150 dark:divide-slate-800 overflow-x-auto">
                    {filteredAhomkaEntries.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">No matching blood pressure vitals logs found.</div>
                    ) : (
                      filteredAhomkaEntries.map(e => (
                        <div key={e.id} className="p-4 hover:bg-slate-50/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2.5 py-0.5 rounded font-mono">
                                {e.timestamp}
                              </span>
                              {e.feeling && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                                  {e.feeling}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic mt-1.5">
                              "{e.notes}"
                            </p>
                            {e.symptoms && e.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {e.symptoms.map(s => (
                                  <span key={s} className="text-[9px] text-indigo-600 bg-indigo-50 font-semibold px-2 py-0.2 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            {/* Averaged BP Metric Display */}
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-mono">3-Reading Average</span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {e.systolic}/{e.diastolic} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
                              </span>
                            </div>

                            {/* Avg Pulse Rate Display */}
                            <div className="text-right border-l pl-4">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-mono font-sans">Avg Pulse</span>
                              <span className="text-sm font-bold text-indigo-600">
                                {e.pulse} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                              </span>
                            </div>

                            {/* Mini readings array breakdown tag */}
                            {e.readings && e.readings.length > 0 && (
                              <button 
                                onClick={() => {
                                  onTriggerToast(`Readings logged: ${e.readings?.map(r => `${r.systolic}/${r.diastolic} (P:${r.pulse})`).join(' | ')}`);
                                }}
                                className="p-1 px-2.5 bg-slate-105 border hover:bg-slate-200 rounded text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                View Details ({e.readings.length})
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* WIZARD STEP 1: General Feeling question */}
            {vitalsStep === 'step1' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-150 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 1 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Physical Comfort State</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">How are you feeling physically today?</h4>
                    <p className="text-[11px] text-slate-400">Select the description that aligns closest with your immediate cardiovascular and kinetic comfort levels.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'Great (Absorb complete relief and high comfort)', desc: 'Feeling highly lighthearted, energetic, no palpitations or light tension.', icon: '🌟', bg: 'hover:border-emerald-500 hover:bg-emerald-50/20' },
                      { key: 'Good (I am feeling good today)', desc: 'Generally light physical comfort, minor muscle strain, breathing naturally.', icon: '😊', bg: 'hover:border-teal-500 hover:bg-teal-50/20' },
                      { key: 'Not Good (Minor headaches or discomfort present)', desc: 'Slight fatigue, physical pressure, or dull headaches. Standard threshold.', icon: '😟', bg: 'hover:border-amber-500 hover:bg-amber-50/20' },
                      { key: 'Poor (Experiencing heavier tension/dizziness)', desc: 'Elevated dizzy periods, heavy pressure, physical discomfort. Alert levels.', icon: '🤒', bg: 'hover:border-red-500 hover:bg-red-50/20' }
                    ].map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => setVitalsFeeling(opt.key)}
                        className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                          vitalsFeeling === opt.key ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs' : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 ' + opt.bg
                        }`}
                      >
                        <span className="text-2xl shrink-0">{opt.icon}</span>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">{opt.key}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-medium">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button onClick={resetVitalsForm} className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700 font-bold">
                      Cancel & Exit
                    </button>
                    <button
                      disabled={!vitalsFeeling}
                      onClick={() => setVitalsStep('step2')}
                      className="px-6 py-2.5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD STEP 2: Symptoms verification checklist */}
            {vitalsStep === 'step2' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 2 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Symptoms Checklist</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Place a check mark near all the symptoms you are experiencing today</h4>
                    <p className="text-[11px] text-slate-400">Selecting "No Symptoms" will automatically deselect all other indicators to ensure clinical clarity.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { val: 'No Symptoms', text: 'Clear of mild fatiguing and other anomalies', desc: 'No symptoms' },
                      { val: 'Mild Fatigue', text: 'Slight muscle fatigue/lethargy', desc: 'Mild Fatigue' },
                      { val: 'Headache', text: 'Tension, pressure, throbbing temporal fields', desc: 'Headache' },
                      { val: 'Dizziness', text: 'Lightheaded sensation or balance wobble', desc: 'Dizziness' },
                      { val: 'Palpitations', text: 'Fluttering or racing heartbeat indicators', desc: 'Palpitations' },
                      { val: 'Sweating', text: 'Excessive sweat unrelated to temperature', desc: 'Sweating' },
                      { val: 'Blurred Vision', text: 'Temporary difficulty focusing visual frames', desc: 'Blurred Vision' }
                    ].map(symp => {
                      const isSelected = vitalsSymptoms.includes(symp.val);
                      return (
                        <div
                          key={symp.val}
                          onClick={() => toggleVitalsSymptom(symp.val)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 text-left ${
                            isSelected 
                              ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white' 
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-xs border shrink-0 flex items-center justify-center mt-0.5 ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{symp.val}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{symp.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button onClick={() => setVitalsStep('step1')} className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700 font-bold">
                      Back
                    </button>
                    <button
                      disabled={vitalsSymptoms.length === 0}
                      onClick={() => setVitalsStep('reading1')}
                      className="px-6 py-2.5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                    >
                      Next: BP Reading #1
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD STEP 3: Blood Pressure Reading #1 Input */}
            {vitalsStep === 'reading1' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 3 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">First Logged Measurement</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 p-4 rounded-lg flex gap-3 text-xs border border-amber-200 dark:border-amber-900/30">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Correct Posture Checklist for BP Cuff:</span>
                      To avoid anomalous temporary systolic spikes, ensure you sit completely still, both feet flat on the floor, back supported, arm resting at mid-chest heart level. Do not speak during inflation.
                    </div>
                  </div>

                  {/* BP Log cuff inputs panel */}
                  <div className="bg-slate-50/55 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex justify-around items-center gap-6">
                    
                    {/* Systolic */}
                    <div className="text-center space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Systolic (Top)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={sys1}
                          onChange={(e) => setSys1(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-705 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mmHg</span>
                      </div>
                    </div>

                    {/* Diastolic */}
                    <div className="text-center space-y-2 border-l pl-6 border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Diastolic (Bottom)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={dia1}
                          onChange={(e) => setDia1(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-705 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mmHg</span>
                      </div>
                    </div>

                    {/* Pulse */}
                    <div className="text-center space-y-2 border-l pl-6 border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Pulse Rate</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pulse1}
                          onChange={(e) => setPulse1(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-705 font-mono font-black text-xl py-3 rounded-lg text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">bpm</span>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setVitalsStep('step2')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold">
                      Back
                    </button>
                    <button
                      onClick={() => setVitalsStep('rest1')}
                      disabled={!sys1.trim() || !dia1.trim() || !pulse1.trim()}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition"
                    >
                      Next: Start Rest Period (60s)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD COOLDOWN STEP 4: Rest Intermission Timer 1 with slideshow guides */}
            {vitalsStep === 'rest1' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 3 of 5 (Rest Cooldown)</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">White-Coat Comfort Buffer</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Circular timer indicator */}
                  <div className="flex flex-col items-center justify-center p-6 border-b">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-95">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#059669" strokeWidth="6"
                          strokeDasharray={351.8}
                          strokeDashoffset={351.8 * (1 - restSeconds / 60)}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="text-center z-10 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest block">Rest Left</span>
                        <span className="font-mono text-3xl font-black text-slate-905">{restSeconds}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">seconds</span>
                      </div>
                    </div>
                  </div>

                  {/* Autoplay regional medical slideshow */}
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-indigo-900 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="bg-indigo-100 text-[8px] font-bold px-2 py-0.5 rounded text-indigo-700 tracking-wider font-mono uppercase">
                        Heart wellness snippet
                      </span>
                      <h5 className="font-bold text-xs mt-2 text-indigo-950">
                        {rotatingSlideIndex === 0 && "Avoid speaking or moving during wait periods."}
                        {rotatingSlideIndex === 1 && "Limit heavily sodiumized broths or fast processed foods."}
                        {rotatingSlideIndex === 2 && "Hydrate with at least 2.5 Litres of safe water daily."}
                        {rotatingSlideIndex === 3 && "S sorghum porridges act as steady arterial buffers."}
                      </h5>
                      <p className="text-[10px] text-indigo-700/80 leading-relaxed mt-1 font-medium">
                        {rotatingSlideIndex === 0 && "Speaking generates vocal cords strain that can temporarily spike reading systolic values up to 8-12 mmHg."}
                        {rotatingSlideIndex === 1 && "Regional cubes often contain high sodium content. Try seasoning recipes with garlic, ginger, or native African basil."}
                        {rotatingSlideIndex === 2 && "Sufficient cellular hydration helps expand plasma volumetrics naturally and minimizes high systemic shear friction."}
                        {rotatingSlideIndex === 3 && "Sorghum is exceptionally rich in natural anti-oxidants and potassium which encourages blood vessel dilatation."}
                      </p>
                    </div>

                    {/* Pagination bullet dots */}
                    <div className="flex gap-1 justify-center mt-4">
                      {[0, 1, 2, 3].map(dot => (
                        <button
                          key={dot}
                          onClick={() => setRotatingSlideIndex(dot)}
                          className={`w-2 h-2 rounded-full transition-all ${rotatingSlideIndex === dot ? 'bg-indigo-600 w-4' : 'bg-indigo-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setVitalsStep('reading1')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold">
                      Back
                    </button>
                    <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-700 font-bold flex items-center gap-1.5 animate-pulse">
                      ⌛ Awaiting Cooldown Complete...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD STEP 5: Blood Pressure Reading #2 Input */}
            {vitalsStep === 'reading2' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 4 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Second Logged Measurement</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-250 p-4 rounded-lg flex gap-3 text-xs border border-indigo-100 dark:border-indigo-900/30">
                    <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Stability verified:</span>
                      Your body has stabilized for over 1 minute. Place the second cuff inflation and write in the indices below.
                    </div>
                  </div>

                  {/* BP Log cuff inputs panel */}
                  <div className="bg-slate-50/55 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-205 dark:border-slate-700/80 flex justify-around items-center gap-6">
                    
                    {/* Systolic */}
                    <div className="text-center space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Systolic (Top)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={sys2}
                          onChange={(e) => setSys2(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mmHg</span>
                      </div>
                    </div>

                    {/* Diastolic */}
                    <div className="text-center space-y-2 border-l pl-6 border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Diastolic (Bottom)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={dia2}
                          onChange={(e) => setDia2(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mmHg</span>
                      </div>
                    </div>

                    {/* Pulse */}
                    <div className="text-center space-y-2 border-l pl-6 border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Pulse Rate</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pulse2}
                          onChange={(e) => setPulse2(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">bpm</span>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setVitalsStep('reading1')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold">
                      Back
                    </button>
                    <button
                      onClick={() => setVitalsStep('rest2')}
                      disabled={!sys2.trim() || !dia2.trim() || !pulse2.trim()}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition"
                    >
                      Next: Start Rest Period (60s)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD COOLDOWN STEP 6: Rest Intermission Timer 2 with slideshow guides */}
            {vitalsStep === 'rest2' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 4 of 5 (Rest Cooldown)</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Second Comfort Intermission</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Circular timer indicator */}
                  <div className="flex flex-col items-center justify-center p-6 border-b">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-95">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#059669" strokeWidth="6"
                          strokeDasharray={351.8}
                          strokeDashoffset={351.8 * (1 - restSeconds / 60)}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="text-center z-10 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest block">Rest Left</span>
                        <span className="font-mono text-3xl font-black text-slate-905">{restSeconds}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">seconds</span>
                      </div>
                    </div>
                  </div>

                  {/* Autoplay regional medical slideshow */}
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-indigo-900 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="bg-indigo-100 text-[8px] font-bold px-2 py-0.5 rounded text-indigo-700 tracking-wider font-mono uppercase">
                        Sodium management guides
                      </span>
                      <h5 className="font-bold text-xs mt-2 text-indigo-950">
                        {rotatingSlideIndex === 0 && "Avoid speaking or moving during wait periods."}
                        {rotatingSlideIndex === 1 && "Limit heavily sodiumized broths or fast processed foods."}
                        {rotatingSlideIndex === 2 && "Hydrate with at least 2.5 Litres of safe water daily."}
                        {rotatingSlideIndex === 3 && "S sorghum porridges act as steady arterial buffers."}
                      </h5>
                      <p className="text-[10px] text-indigo-700/80 leading-relaxed mt-1 font-medium">
                        {rotatingSlideIndex === 0 && "Speaking generates vocal cords strain that can temporarily spike reading systolic values up to 8-12 mmHg."}
                        {rotatingSlideIndex === 1 && "Regional cubes often contain high sodium content. Try seasoning recipes with garlic, ginger, or native African basil."}
                        {rotatingSlideIndex === 2 && "Sufficient cellular hydration helps expand plasma volumetrics naturally and minimizes high systemic shear friction."}
                        {rotatingSlideIndex === 3 && "Sorghum is exceptionally rich in natural anti-oxidants and potassium which encourages blood vessel dilatation."}
                      </p>
                    </div>

                    {/* Pagination bullet dots */}
                    <div className="flex gap-1 justify-center mt-4">
                      {[0, 1, 2, 3].map(dot => (
                        <button
                          key={dot}
                          onClick={() => setRotatingSlideIndex(dot)}
                          className={`w-2 h-2 rounded-full transition-all ${rotatingSlideIndex === dot ? 'bg-indigo-600 w-4' : 'bg-indigo-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setVitalsStep('reading2')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold">
                      Back
                    </button>
                    <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-700 font-bold flex items-center gap-1.5 animate-pulse">
                      ⌛ Awaiting Cooldown Complete...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD STEP 7: Blood Pressure Reading #3 & Medication Adherence */}
            {vitalsStep === 'reading3' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-600 uppercase font-mono">Step 5 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Final Reading & Medication Adherence</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <form onSubmit={handleVitalsSubmit} className="p-6 space-y-6">
                  
                  {/* BP Log cuff inputs panel */}
                  <div className="bg-slate-50/55 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-205 dark:border-slate-700/80 flex justify-around items-center gap-6">
                    
                    {/* Systolic */}
                    <div className="text-center space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Systolic (Top)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={sys3}
                          onChange={(e) => setSys3(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          required
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mmHg</span>
                      </div>
                    </div>

                    {/* Diastolic */}
                    <div className="text-center space-y-2 border-l pl-6 border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Diastolic (Bottom)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={dia3}
                          onChange={(e) => setDia3(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          required
                        />
                        <span className="text-[10px] text-slate-400 font-bold">mmHg</span>
                      </div>
                    </div>

                    {/* Pulse */}
                    <div className="text-center space-y-2 border-l pl-6 border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Pulse Rate</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pulse3}
                          onChange={(e) => setPulse3(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-indigo-650 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          required
                        />
                        <span className="text-[10px] text-slate-400 font-bold">bpm</span>
                      </div>
                    </div>

                  </div>

                  {/* Medication adherence checklist within search parameters */}
                  <div className="space-y-3">
                    <label className="font-bold text-xs text-slate-755 dark:text-slate-350 block uppercase tracking-wide">
                      Within the past 4 days, did you take your BP medication?
                    </label>
                    <p className="text-[11px] text-slate-400">Strict medical guideline compliance safeguards cardiovascular baselines against sudden stroke episodes.</p>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        'I took its exactly as prescribed',
                        'I missed 1 or 2 days total',
                        'I did not take any medication',
                        'I have no prescribed blood pressure medications'
                      ].map(adherenceOpt => (
                        <div
                          key={adherenceOpt}
                          onClick={() => setVitalsMedication(adherenceOpt)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition ${
                            vitalsMedication === adherenceOpt 
                              ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 font-bold text-indigo-850 dark:text-indigo-300' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-805 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            vitalsMedication === adherenceOpt ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {vitalsMedication === adherenceOpt && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{adherenceOpt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => setVitalsStep('reading2')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 font-bold">
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!vitalsMedication || !sys3.trim() || !dia3.trim() || !pulse3.trim()}
                      className="px-6 py-2.5 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-md shadow-emerald-600/10"
                    >
                      Calculate & Submit Vitals
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TIME'S UP! NOTIFICATION MODAL */}
            {showTimesUpModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center text-xl mx-auto">
                    🔔
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Time's Up!</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                      Your rest countdown interval has finished successfully. Please inflate the cuff to register the next measurement!
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowTimesUpModal(false);
                      if (vitalsStep === 'rest1') {
                        setVitalsStep('reading2');
                      } else if (vitalsStep === 'rest2') {
                        setVitalsStep('reading3');
                      }
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Start Measurement Now
                  </button>
                </div>
              </div>
            )}

            {/* BLOOD PRESSURE SUMMARY SUCCESS DIALOG */}
            {showVitalsSuccessModal && vitalsSuccessSummary && (
              <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-md w-full space-y-6">
                  
                  {/* Success Header info */}
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-md">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Ahomka Ho Vitals Logged!</h3>
                      <p className="text-[11px] text-slate-400">Your daily three-measurement averages are logged securely.</p>
                    </div>
                  </div>

                  {/* Calculated metrics table preview */}
                  <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center divide-y divide-slate-100 dark:divide-slate-800">
                    
                    {/* BP Average */}
                    <div className="pb-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Calculated 3-Reading BP Average</span>
                      <span className="font-mono text-3xl font-black text-slate-900 dark:text-white block mt-1">
                        {vitalsSuccessSummary.systolic}/{vitalsSuccessSummary.diastolic} <span className="text-sm text-slate-400 font-normal">mmHg</span>
                      </span>
                      <span className={`inline-block mt-2 text-[10px] font-bold px-3 py-1 rounded-full ${
                        vitalsSuccessSummary.status.includes('High') ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' :
                        vitalsSuccessSummary.status.includes('Elevated') ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        Classification: {vitalsSuccessSummary.status}
                      </span>
                    </div>

                    {/* Averaged Pulse Rate */}
                    <div className="pt-3.5 flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 px-4">
                      <span className="font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <span>Average Pulse Rate</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded text-[11px]">
                        {vitalsSuccessSummary.pulse} bpm
                      </span>
                    </div>

                  </div>

                  {/* Context Advice details feedback */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900/90 dark:text-emerald-200 p-4 rounded-xl text-xs space-y-1 border border-emerald-100 dark:border-emerald-900/20">
                    <span className="font-bold block">Advisory Clinical Support:</span>
                    <p className="leading-relaxed font-semibold">
                      {vitalsSuccessSummary.systolic < 120 && vitalsSuccessSummary.diastolic < 80 ? (
                        "Your blood pressure is within the normal range. Thanks. Keep maintaining active sorghum flours, steady hydration, and compliance check-ins!"
                      ) : vitalsSuccessSummary.systolic >= 140 || vitalsSuccessSummary.diastolic >= 90 ? (
                        "Your averaged parameters indicate a high-risk hypertension Stage 2 threshold. We suggest reviewing these logs with Dr. Jenkins via the Providers chat tab and avoiding sudden physical stresses."
                      ) : (
                        "Your averaged elements represent mildly elevated pre-hypertension tendencies. Rest comfortably, maintain steady herbal Bissap tea limits, and check again tomorrow."
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowVitalsSuccessModal(false);
                      setVitalsSuccessSummary(null);
                      resetVitalsForm();
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Return to Dashboard
                  </button>

                </div>
              </div>
            )}

            {/* Quick guideline alert overlay warning */}
            {vitalsStep !== 'dashboard' && (
              <div className="bg-blue-50 text-blue-900 p-4 rounded-xl flex gap-3 text-xs max-w-xl mx-auto border border-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Secure encrypted connection session:</span>
                  All logged vitals are cryptographically protected under clinical secrecy protocols before transmission to care providers.
                </div>
              </div>
            )}

          </div>
        )}

        {/* GAP Health GAP-3: Community Support Forums tab */}
        {activeTab === 'community' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-805 shadow-sm flex h-[480px] overflow-hidden">
            
            {/* Channels select list */}
            <div className="w-56 border-r border-slate-150 dark:border-slate-800 shrink-0 flex flex-col pt-4 bg-slate-50/40 dark:bg-slate-900/10">
              <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-3">Support Forum Boards</span>
              <div className="flex-1 overflow-y-auto space-y-1">
                {[
                  { id: '#nutrition-and-diabetes', label: 'Nutrition & Diabetes', desc: 'Millet eating, glucose spike limits' },
                  { id: '#cardio-wellness', label: 'Cardio Wellness', desc: 'Salt limits, walks, BP baseline stability' },
                  { id: '#mental-fitness', label: 'Mental Fitness', desc: 'Respiration stress reduction & REM sleep' },
                  { id: '#reproductive-health', label: 'Reproductive Health', desc: 'Neonatal care advisory support' }
                ].map(ch => (
                  <div 
                    key={ch.id}
                    onClick={() => setCommSelectedChannel(ch.id)}
                    className={`p-3 mx-2 rounded-lg cursor-pointer transition ${ch.id === commSelectedChannel ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                  >
                    <p className="font-bold text-xs truncate leading-none">{ch.id}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-1.5 font-bold">{ch.label}</p>
                    <p className="text-[9px] text-slate-400 truncate leading-snug mt-0.5 font-medium">{ch.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat messages screen */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/10">
              <div className="p-3 border-b bg-slate-50/10 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-none">{commSelectedChannel}</h5>
                  <span className="text-[9px] text-slate-400 block mt-1">Peer-to-peer secure medical advisory board</span>
                </div>
                <div className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold">Moderated and Verified</div>
              </div>

              {/* Chat bubble list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-slate-950/30">
                {communityMessages.filter(msg => msg.channel === commSelectedChannel).map(msg => (
                  <div key={msg.id} className="flex gap-3">
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full border shrink-0 object-cover" />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl max-w-lg text-xs leading-relaxed border border-transparent">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-200">{msg.senderName}</span>
                          <span className="text-[8px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm font-black uppercase font-sans">
                            {msg.senderRole}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                      </div>
                      <p className="leading-snug text-slate-700 dark:text-slate-300 font-medium">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer input */}
              <form onSubmit={handleSendCommMessage} className="p-3 border-t bg-slate-50/10 dark:bg-slate-900/30 shrink-0 flex gap-2">
                <input 
                  value={commInput}
                  onChange={(e) => setCommInput(e.target.value)}
                  placeholder={`Share, ask, or comment standard clinical parameters on ${commSelectedChannel}...`}
                  className="flex-1 bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-900 dark:text-white"
                  required
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-slate-900 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer"
                >
                  Share
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: My Profile Personal, Emergencies & Insurances */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-xs space-y-6">
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Healthcare Profile Settings</h4>
              <p className="text-[10px] text-slate-400">Keep emergency, personal ID numbers, and insurance mappings up to date</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              
              {/* Personal Block */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b pb-1.5">Personal details</h5>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Full Name</label>
                  <input type="text" value={profName} onChange={(e) => setProfName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Email Address</label>
                  <input type="email" value={profEmail} onChange={(e) => setProfEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" />
                </div>

                {/* Recommendation 1: Personal Avatar Studio */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-2">Avatar Choice Studio (Initials & Uploads)</span>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800">
                    <img 
                      src={profAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'} 
                      alt="Avatar Studio Preview" 
                      className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-white" 
                      id="avatar-preview-thumbnail"
                    />
                    <div className="space-y-1 w-full text-left">
                      <p className="text-[9px] font-bold text-slate-500">Pick initials style gradient or upload custom:</p>
                      
                      {/* Gradient preseters row */}
                      <div className="flex gap-2 pb-1.5">
                        {[
                          { name: 'Indigo Dusk', colors: ['#6366f1', '#4338ca'] },
                          { name: 'Sea Emerald', colors: ['#10b981', '#047857'] },
                          { name: 'Cosmic Rose', colors: ['#f43f5e', '#be123c'] },
                          { name: 'Amber Glow', colors: ['#f59e0b', '#b45309'] },
                          { name: 'Slate Dark', colors: ['#1e293b', '#0f172a'] }
                        ].map(pal => (
                          <button 
                            key={pal.name}
                            type="button"
                            onClick={() => generateInitialSvg(pal.colors)}
                            className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition"
                            style={{ background: `linear-gradient(135deg, ${pal.colors[0]} 0%, ${pal.colors[1]} 100%)` }}
                            title={`Generate Initial with ${pal.name}`}
                          />
                        ))}
                      </div>

                      {/* File select button */}
                      <div className="relative inline-block">
                        <label className="py-1 px-2.5 bg-indigo-650 hover:bg-slate-900 text-white text-[9px] font-bold rounded-lg transition cursor-pointer select-none">
                          Upload Custom Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleCustomAvatarUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts Block */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b pb-1.5">Emergency contact details</h5>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Contact Name</label>
                  <input type="text" value={profContactName} onChange={(e) => setProfContactName(e.target.value)} placeholder="e.g. Robert Jenkins" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Contact Phone</label>
                  <input type="text" value={profContactPhone} onChange={(e) => setProfContactPhone(e.target.value)} placeholder="+1 (555) 012-3456" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Relationship</label>
                  <input type="text" value={profContactRelation} onChange={(e) => setProfContactRelation(e.target.value)} placeholder="Spouse, Mother, Sibling" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t flex justify-end">
              <button 
                id="pat-profile-submit-btn"
                type="submit" 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition"
              >
                Commit Changes
              </button>
            </div>
          </form>
        )}

      </div>

      {/* CONFIRMATION DIALOG MODAL FOR LOG DELETION */}
      {logIdToDelete && (
        <div id="delete-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Delete Biometric Telemetry Entry?</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Are you sure you want to delete this health log? This biometric telemetry record is confidential, and manual deletion cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 text-[10.5px]">
              <button
                id="cancel-delete-btn"
                type="button"
                onClick={() => setLogIdToDelete(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                type="button"
                onClick={() => {
                  onDeleteLog(logIdToDelete);
                  setLogIdToDelete(null);
                  onTriggerToast("Biometric telemetry record deleted permanently", "success");
                }}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Yes, Delete Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
