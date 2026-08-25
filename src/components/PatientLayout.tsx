/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  HealthLog, Message, Conversation, AIChatMessage, CMSArticle, AppUser, FAQ, Announcement,
  ProviderInfo, AhomkaEntry, CommunityMessage, AppointmentBooking, SupportForumBoard
} from '../types';
import { 
  Activity, MessageSquare, Brain, BookOpen, Bell, User, Settings, Plus, Search, Trash2, 
  Check, CheckCircle2, AlertCircle, TrendingUp, ChevronRight, ChevronDown, Moon, Sun, ShieldCheck, 
  Send, Paperclip, FileText, X, Heart, Droplet, BatteryCharging, Clock, Sparkles, 
  Info, Mic, MicOff, Play, Pause, Video, ExternalLink, ShieldAlert, CheckCircle, RefreshCw,
  Users, Stethoscope, Edit, Upload, HelpCircle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { formatUserId } from '../utils/userId';

interface PatientLayoutProps {
  session: AppUser;
  logs: HealthLog[];
  conversations: Conversation[];
  aiChat?: AIChatMessage[];
  articles: CMSArticle[];
  faqs: FAQ[];
  announcements: Announcement[];
  searchQuery: string;
  forumBoards: SupportForumBoard[];
  onAddLog: (metric: any, value: string, notes: string) => void;
  onDeleteLog: (id: string) => void;
  onSendMessage: (convId: string, text: string, attachment?: any) => void;
  onSendAIChat?: (text: string) => Promise<void>;
  isAiTyping?: boolean;
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
    readings?: { systolic: number; diastolic: number; pulse: number }[],
    targetPatientId?: string,
    customDate?: string
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
  session, logs, conversations, aiChat, articles, faqs, announcements, searchQuery, forumBoards,
  onAddLog, onDeleteLog, onSendMessage, onSendAIChat, isAiTyping, isDoctorTyping,
  onUpdateProfile, onTriggerToast,
  providers, ahomkaEntries, onAddAhomkaEntry, communityMessages, onSendCommunityMessage, bookings, onAddBooking, onCancelBooking,
  onDeleteMessage, onEditMessage
}: PatientLayoutProps) {
  
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
  
  // Confirmation state for deleting health logs
  const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);
  
  // Selected Ahomka entry for full details view modal popup
  const [selectedAhomkaEntry, setSelectedAhomkaEntry] = useState<AhomkaEntry | null>(null);

  // Selected Care Provider for profile details view modal popup
  const [selectedDetailProvider, setSelectedDetailProvider] = useState<ProviderInfo | null>(null);
  
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
  const [profFirstName, setProfFirstName] = useState(session.firstName || (session.name ? session.name.split(' ')[0] : ''));
  const [profLastName, setProfLastName] = useState(session.lastName || (session.name ? session.name.split(' ').slice(1).join(' ') : ''));
  const [profSex, setProfSex] = useState(session.sex || session.gender || 'Female');
  const [profDob, setProfDob] = useState(session.dob || '');
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
  const [restSeconds, setRestSeconds] = useState<number>(45);
  const [showTimesUpModal, setShowTimesUpModal] = useState<boolean>(false);
  const [showVitalsSuccessModal, setShowVitalsSuccessModal] = useState<boolean>(false);
  const [rotatingSlideIndex, setRotatingSlideIndex] = useState<number>(0);
  const [vitalsChartView, setVitalsChartView] = useState<'combined' | 'systolic' | 'diastolic' | 'pulse'>('combined');
  const [defaultTooltipCoord, setDefaultTooltipCoord] = useState<{ x: number, y: number } | null>(null);
  const [isHoveringChart, setIsHoveringChart] = useState<boolean>(false);
  const [isVitalsHistoryOpen, setIsVitalsHistoryOpen] = useState<boolean>(false);

  // Searchable Help Center local states
  const [helpSearchQuery, setHelpSearchQuery] = useState<string>('');
  const [selectedHelpCategory, setSelectedHelpCategory] = useState<string>('All');
  const [expandedFaqIds, setExpandedFaqIds] = useState<string[]>([]);
  const [faqFeedback, setFaqFeedback] = useState<Record<string, 'up' | 'down'>>({});

  // Success BP readings to show inside success modal dialog
  const [vitalsSuccessSummary, setVitalsSuccessSummary] = useState<{ systolic: number; diastolic: number; pulse: number; status: string } | null>(null);

  // GAP Health - Community Chat Local States
  const [commSelectedChannel, setCommSelectedChannel] = useState<string>('#nutrition-and-diabetes');
  const [commInput, setCommInput] = useState<string>('');

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
      setRestSeconds(45);
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
    let calculatedAge = session.age;
    if (profDob) {
      const birthDate = new Date(profDob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        calculatedAge = age > 0 ? age : 0;
      }
    }
    const computedName = (profFirstName.trim() || profLastName.trim()) 
      ? `${profFirstName.trim()} ${profLastName.trim()}`.trim() 
      : (profName.trim() || session.name);

    const updated: AppUser = {
      ...session,
      name: computedName,
      firstName: profFirstName.trim() || undefined,
      lastName: profLastName.trim() || undefined,
      sex: profSex,
      gender: profSex,
      dob: profDob || undefined,
      age: calculatedAge,
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
      avgHR: hr30.length > 0 ? avgHR : 0,
      avgGlucose: glucose30.length > 0 ? avgGlucose : 0,
      avgSystolic: bp30.length > 0 ? avgSystolic : 0,
      avgDiastolic: bp30.length > 0 ? avgDiastolic : 0,
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

  const uniqueDatesLogged = new Set([
    ...logs.map(l => {
      try { return l.timestamp.split(',')[0].trim(); } catch { return l.timestamp; }
    }),
    ...ahomkaEntries.map(e => e.timestamp)
  ]);
  const totalDaysLogged = uniqueDatesLogged.size;
  const complianceRate = totalDaysLogged === 0 ? 0 : Math.min(100, Math.round((totalDaysLogged / 7) * 100));

  const selectedConv = conversations.find(c => c.id === chatSelectedConvId) || conversations[0] || null;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      
      {/* Mobile Top Sub-Header Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Panel</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {activeTab === 'dashboard' && 'Wellness Dashboard'}
            {activeTab === 'messages' && 'Secure Messaging'}
            {activeTab === 'ahomka' && 'Health Vitals'}
            {activeTab === 'community' && 'Community Chat'}
            {activeTab === 'education' && 'Education Library'}
            {activeTab === 'help' && 'Help Center & FAQs'}
            {activeTab === 'profile' && 'Patient Profile'}
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
                    <span className="font-sans font-bold text-slate-900 dark:text-white">Patient Hub</span>
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
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Wellness Dashboard</span>
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'messages' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="flex items-center justify-between w-full">
                      <span>Secure Messaging</span>
                      {selectedConv?.unread > 0 && (
                        <span className="bg-rose-500 text-white w-2.5 h-2.5 rounded-full animate-ping"></span>
                      )}
                    </span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('ahomka'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'ahomka' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>Ahomka Ho (Health Vitals)</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('community'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'community' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Community Chat</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('education'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'education' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Education Library</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('help'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'help' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Help Center & FAQs</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <User className="w-4 h-4" />
                    <span>Update Profile Info</span>
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
      
      {/* Patient Sidebar navigation rails */}
      <aside className="hidden md:flex w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0 p-4 space-y-1.5 md:flex-col justify-between md:justify-start">
        <div className="w-full space-y-1">
          <button 
            id="tab-pat-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Activity className="w-4 h-4" />
            <span className="md:inline">Wellness Dashboard</span>
          </button>
          
          <button 
            id="tab-pat-messages"
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'messages' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
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
            id="tab-pat-ahomka"
            onClick={() => setActiveTab('ahomka')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'ahomka' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Heart className="w-4 h-4" />
            <span className="md:inline font-bold">Ahomka Ho (Health Vitals)</span>
          </button>

          <button 
            id="tab-pat-community"
            onClick={() => setActiveTab('community')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'community' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            <span className="md:inline">Community Chat</span>
          </button>

          <button 
            id="tab-pat-education"
            onClick={() => setActiveTab('education')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'education' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="md:inline">Education Library</span>
          </button>

          <button 
            id="tab-pat-help"
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'help' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="md:inline">Help Center & FAQs</span>
          </button>

          <button 
            id="tab-pat-profile"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <User className="w-4 h-4" />
            <span className="md:inline">Update Profile Info</span>
          </button>
        </div>
      </aside>

      {/* Primary Patient tabs rendering viewport */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="space-y-6"
          >
        
        {/* TAB 1: Patient Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white rounded-2xl shadow-xl p-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 opacity-10 w-44">
                <Heart className="w-full h-full text-white" />
              </div>
              <div className="relative">
                <span className="bg-emerald-500 text-[10px] font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wider">Patient Portal</span>
                <h2 className="font-display text-xl font-bold mt-3 leading-tight">Welcome to your secure health desk, {session.name}</h2>
                <p className="text-xs text-emerald-200 mt-1 max-w-lg">Monitor critical trends, direct message your care providers in real time, and audit educational journals HIPAA-securely.</p>
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
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
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
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded mt-2 inline-block">Healthy BMI (18.5-24.9)</span>
              </div>

              {/* Combined caloric and compliance summary details */}
              <div className="col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Adherence Compliance
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    {totalDaysLogged === 0 ? (
                      "No health logs submitted this week yet. Track your vitals or complete an Ahomka check-in to establish log compliance."
                    ) : (
                      `${complianceRate}% weekly compliance. You checked in logs for ${totalDaysLogged} day(s) this cycle.`
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalDaysLogged === 0 ? "Pending" : totalDaysLogged >= 4 ? "Excellent" : "Stable"}
                  </span>
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
                  <div className="p-3 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-2xs shrink-0 border border-slate-100 dark:border-slate-700">
                    <Heart className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">Blood Pressure Average</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                       {get30DaysSummary().bpCount > 0 ? (
                         <>{get30DaysSummary().avgSystolic}/{get30DaysSummary().avgDiastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span></>
                       ) : (
                         <span className="text-xs text-slate-400 font-normal italic">No readings</span>
                       )}
                    </h4>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">Compiled from {get30DaysSummary().bpCount} records</span>
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
                      {get30DaysSummary().glucoseCount > 0 ? (
                        <>{get30DaysSummary().avgGlucose} <span className="text-xs text-slate-400 font-normal">mg/dL</span></>
                      ) : (
                        <span className="text-xs text-slate-400 font-normal italic">No readings</span>
                      )}
                    </h4>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">Compiled from {get30DaysSummary().glucoseCount} records</span>
                  </div>
                </div>

                {/* 3. Average Heart Rate Card */}
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30 flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-2xs shrink-0 border border-slate-100 dark:border-slate-700">
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">Heart Rate Average</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {get30DaysSummary().hrCount > 0 ? (
                        <>{get30DaysSummary().avgHR} <span className="text-xs text-slate-400 font-normal">bpm</span></>
                      ) : (
                        <span className="text-xs text-slate-400 font-normal italic">No readings</span>
                      )}
                    </h4>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">Compiled from {get30DaysSummary().hrCount} records</span>
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
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center gap-3 transition ${rem.done ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 line-through border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 hover:border-emerald-400 text-slate-800 dark:text-slate-100 shadow-2xs'}`}
                    >
                      <div className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 ${rem.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
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
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Clinician Assistant Recommendation
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-2 italic">
                    {ahomkaEntries.length === 0 && logs.length === 0 ? (
                      `Hello ${session.name.split(' ')[0]}, no biometric diaries recorded yet. Please log your daily vitals or complete an Ahomka well-being check-in to generate tailored clinician-assistant recommendations.`
                    ) : (
                      `Hello ${session.name.split(' ')[0]}, based on your ${ahomkaEntries.length + logs.length} logged entry/entries, your biometrics show stable progression. Keep tracking regularly to establish a solid diagnostic baseline.`
                    )}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center mt-4">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Clinical references up-to-date
                  </span>
                  <button 
                    onClick={() => setActiveTab('ai')}
                    className="p-1 px-3 bg-emerald-600 hover:bg-slate-900 text-white font-bold rounded-lg text-[10px] transition"
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
            <div className="w-48 border-r border-slate-200 shrink-0 flex flex-col pt-4 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-4 mb-3">Care Team Providers</span>
              <div className="flex-1 overflow-y-auto space-y-1">
                {conversations.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => { setChatSelectedConvId(c.id); c.unread = 0; }}
                    className={`p-3 mx-2 rounded-lg cursor-pointer transition ${c.id === chatSelectedConvId ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'hover:bg-slate-50 text-slate-600'}`}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="view-provider-details-btn"
                    onClick={() => {
                      const matchedProv = providers.find(p => p.name === selectedConv.name || p.id === selectedConv.id);
                      if (matchedProv) {
                        setSelectedDetailProvider(matchedProv);
                      } else {
                        // Fallback provider info for the selected conversation doctor if not fully provisioned yet
                        const fallbackProv: ProviderInfo = {
                          id: 'default-fallback-prov',
                          name: selectedConv.name,
                          specialty: selectedConv.specialty,
                          avatar: selectedConv.avatar,
                          location: 'Cantonments, Accra',
                          rating: 4.8,
                          hospital: 'Korle-Bu Teaching Hospital (KBTH)',
                          fee: 'GH₵ 150',
                          slots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
                        };
                        setSelectedDetailProvider(fallbackProv);
                      }
                    }}
                    className="p-1 px-2.5 bg-emerald-50 dark:bg-slate-800 border hover:bg-emerald-100 dark:hover:bg-slate-700 border-emerald-100 dark:border-slate-700 rounded-lg text-[9px] font-bold text-emerald-700 dark:text-emerald-400 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Stethoscope className="w-2.5 h-2.5" />
                    <span>View Provider Profile</span>
                  </button>
                  <div className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">Encrypted Connection</div>
                </div>
              </div>

              {/* Message balloons list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-slate-950/20">
                {selectedConv.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-xl text-xs ${m.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1 border-b border-emerald-500/20 pb-0.5">
                        <p className="font-bold text-[9px] opacity-75">{m.senderName}</p>
                        {m.sender === 'user' && (
                          <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition shrink-0 select-none">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(m.id);
                                setChatInputMessage(m.content);
                              }}
                              className="text-white hover:text-emerald-200 transition p-0.5"
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
                        <div className="mb-2 p-2 bg-emerald-900/20 rounded border border-emerald-500/20 flex items-center gap-2 text-[10px] font-semibold">
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
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] py-1.5 px-3 rounded-lg">
                    <span className="font-medium">Editing previously sent message...</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingMessageId(null);
                        setChatInputMessage('');
                      }}
                      className="text-emerald-500 hover:text-emerald-700 font-bold dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
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
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-800"
                  />
                  <button 
                    id="pat-message-submit"
                    type="submit"
                    className="bg-emerald-600 hover:bg-slate-900 text-white font-bold p-1 px-3.5 rounded-lg text-xs transition"
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
                    <span className="text-[9px] font-bold text-emerald-600 tracking-widest uppercase">{art.category}</span>
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

        {/* GAP Health GAP-2: Ahomka Ho Logs Well-being tab */}
        {activeTab === 'ahomka' && (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
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
                          <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {ahomkaEntries[0].pulse} <span className="text-xs text-slate-400 font-medium font-sans">bpm</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1">Resting tachycardia screen stable.</p>
                        </div>
                      ) : (
                        <h4 className="text-base font-bold text-slate-400 mt-2">No pulse logged yet</h4>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                </div>

                {/* Main Graph & Recommendations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Recharts Vital Averages Trend AreaGraph */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Multi-Reading Longitudinal Trends</h4>
                        <p className="text-[10px] text-slate-500">Ahomka Ho calculated blood pressure & heart rate indices over time</p>
                      </div>
                      
                      {/* Interactive toggle view buttons for chart */}
                      <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
                        <button
                          onClick={() => setVitalsChartView('combined')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            vitalsChartView === 'combined' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          All Vitals
                        </button>
                        <button
                          onClick={() => setVitalsChartView('systolic')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            vitalsChartView === 'systolic' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Systolic
                        </button>
                        <button
                          onClick={() => setVitalsChartView('diastolic')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            vitalsChartView === 'diastolic' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Diastolic
                        </button>
                        <button
                          onClick={() => setVitalsChartView('pulse')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            vitalsChartView === 'pulse' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Heart Rate
                        </button>
                      </div>
                    </div>

                    {/* Overall Historical Calculated Means Summary Banner */}
                    {ahomkaEntries.length > 0 && (() => {
                      const validSys = ahomkaEntries.filter(e => e.systolic !== undefined && e.systolic !== null);
                      const validDia = ahomkaEntries.filter(e => e.diastolic !== undefined && e.diastolic !== null);
                      const validPulse = ahomkaEntries.filter(e => e.pulse !== undefined && e.pulse !== null);

                      const avgSys = validSys.length > 0 ? Math.round(validSys.reduce((acc, curr) => acc + Number(curr.systolic), 0) / validSys.length) : 118;
                      const avgDia = validDia.length > 0 ? Math.round(validDia.reduce((acc, curr) => acc + Number(curr.diastolic), 0) / validDia.length) : 78;
                      const avgPulse = validPulse.length > 0 ? Math.round(validPulse.reduce((acc, curr) => acc + Number(curr.pulse), 0) / validPulse.length) : 72;

                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-xs">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">Historical Mean Readings:</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 font-mono font-extrabold text-[11px]">
                            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shadow-2xs">
                              Systolic Avg: {avgSys} mmHg
                            </span>
                            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 shadow-2xs">
                              Diastolic Avg: {avgDia} mmHg
                            </span>
                            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 shadow-2xs">
                              Pulse Avg: {avgPulse} bpm
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="w-full h-[220px]">
                      {ahomkaEntries.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-center p-6 space-y-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Activity className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-500">No longitudinal trends logged yet.</p>
                          <p className="text-[10px] text-slate-400 max-w-sm">Use the "Log Today's Entry" button on the Ahomka Ho Well-being screen to start cataloging blood pressure, blood glucose, or pulse rates.</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={ahomkaEntries.slice().reverse().map(e => ({
                              ...e,
                              systolic: e.systolic !== undefined && e.systolic !== null ? Number(e.systolic) : undefined,
                              diastolic: e.diastolic !== undefined && e.diastolic !== null ? Number(e.diastolic) : undefined,
                              pulse: e.pulse !== undefined && e.pulse !== null ? Number(e.pulse) : undefined,
                            }))} 
                            margin={{ top: 12, right: 10, left: -20, bottom: 5 }}
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
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                            <XAxis 
                              dataKey="timestamp" 
                              fontSize={9} 
                              stroke="#94a3b8" 
                              interval="preserveStartEnd"
                              minTickGap={15}
                              tickMargin={6}
                              tickFormatter={(val: string) => {
                                if (!val) return '';
                                try {
                                  const d = new Date(val);
                                  if (!isNaN(d.getTime())) {
                                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  }
                                } catch (err) {}
                                // Fallback parser for formatted strings e.g. "2026-06-04 09:00 PM" or "6/7/2026 02:19 AM"
                                const parts = val.split(' ');
                                if (parts[0].includes('-')) {
                                  const sub = parts[0].split('-');
                                  if (sub.length === 3) return `${parseInt(sub[1])}/${parseInt(sub[2])}`;
                                }
                                if (parts[0].includes('/')) {
                                  const sub = parts[0].split('/');
                                  if (sub.length === 3) return `${sub[0]}/${sub[1]}`;
                                }
                                return parts[0];
                              }}
                            />
                            <YAxis fontSize={9} domain={[30, 180]} stroke="#94a3b8" />
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
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white rounded-xl p-3 shadow-2xl space-y-1.5 text-left border-l-4 border-l-emerald-500 font-sans min-w-[155px]">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                      {entry.timestamp}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-4">
                                        <span className="text-slate-300 text-[11px] font-medium">Systolic:</span>
                                        <span className="font-mono text-xs font-bold text-emerald-400">{entry.systolic} mmHg</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <span className="text-slate-300 text-[11px] font-medium">Diastolic:</span>
                                        <span className="font-mono text-xs font-bold text-sky-400">{entry.diastolic} mmHg</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4">
                                        <span className="text-slate-300 text-[11px] font-medium">Pulse:</span>
                                        <span className="font-mono text-xs font-bold text-rose-400">{entry.pulse || 'N/A'} bpm</span>
                                      </div>
                                    </div>
                                    {entry.feeling && (
                                      <div className="pt-1.5 border-t border-slate-800 text-[9px] text-slate-400 italic break-words max-w-[150px]">
                                        "{entry.feeling}"
                                      </div>
                                    )}
                                  </div>
                                );
                              }}
                            />
                            {(vitalsChartView === 'combined' || vitalsChartView === 'systolic') && (
                              <Area 
                                type="monotone" 
                                dataKey="systolic" 
                                connectNulls={true}
                                stroke="#059669" 
                                strokeWidth={2.5} 
                                fillOpacity={vitalsChartView === 'combined' ? 0.15 : 1} 
                                fill="url(#colorSys)" 
                                name="Systolic Average (mmHg)" 
                                dot={(props: any) => {
                                  const { cx, cy, index } = props;
                                  if (cx === undefined || cy === undefined) return null;
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
                                      fill="#059669" 
                                      className={isLast ? "animate-pulse shadow-sm" : ""}
                                    />
                                  );
                                }} 
                                activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }} 
                              />
                            )}
                            {(vitalsChartView === 'combined' || vitalsChartView === 'diastolic') && (
                              <Area 
                                type="monotone" 
                                dataKey="diastolic" 
                                connectNulls={true}
                                stroke="#0284c7" 
                                strokeWidth={2.5} 
                                fillOpacity={vitalsChartView === 'combined' ? 0.12 : 1} 
                                fill="url(#colorDia)" 
                                name="Diastolic Average (mmHg)" 
                                dot={(props: any) => {
                                  const { cx, cy, index } = props;
                                  if (cx === undefined || cy === undefined) return null;
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
                                      fill="#0284c7" 
                                      className={isLast ? "animate-pulse shadow-sm" : ""}
                                    />
                                  );
                                }} 
                                activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }} 
                              />
                            )}
                            {(vitalsChartView === 'combined' || vitalsChartView === 'pulse') && (
                              <Area 
                                type="monotone" 
                                dataKey="pulse" 
                                connectNulls={true}
                                stroke="#f43f5e" 
                                strokeWidth={2.5} 
                                fillOpacity={vitalsChartView === 'combined' ? 0.10 : 1} 
                                fill="url(#colorPulse)" 
                                name="Heart Rate (BPM)" 
                                dot={(props: any) => {
                                  const { cx, cy, index } = props;
                                  if (cx === undefined || cy === undefined) return null;
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
                                      key={`dot-pulse-${index}`}
                                      cx={cx} 
                                      cy={cy} 
                                      r={isLast ? 6.5 : 4} 
                                      stroke="#ffffff" 
                                      strokeWidth={isLast ? 2.5 : 1.5} 
                                      fill="#f43f5e" 
                                      className={isLast ? "animate-pulse shadow-sm" : ""}
                                    />
                                  );
                                }} 
                                activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }} 
                              />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Pagination indicators visual cues */}
                    <div className="flex justify-center gap-2 mt-3 text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 ${vitalsChartView === 'combined' || vitalsChartView === 'systolic' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'text-slate-400'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span> Systolic
                      </span>
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 ${vitalsChartView === 'combined' || vitalsChartView === 'diastolic' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800' : 'text-slate-400'}`}>
                        <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span> Diastolic
                      </span>
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 ${vitalsChartView === 'combined' || vitalsChartView === 'pulse' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 'text-slate-400'}`}>
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Heart Rate
                      </span>
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
                          <span className="shrink-0 text-emerald-500">🌾</span>
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
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
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

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-x-auto">
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
                                  <span key={s} className="text-[9px] text-emerald-600 bg-emerald-50 font-semibold px-2 py-0.2 rounded">
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
                              <span className="text-sm font-bold text-emerald-600">
                                {e.pulse} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                              </span>
                            </div>

                            {/* Mini readings array breakdown tag */}
                            {e.readings && e.readings.length > 0 && (
                              <button 
                                onClick={() => {
                                  setSelectedAhomkaEntry(e);
                                }}
                                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 border hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-800 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
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
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 1 of 5</span>
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
                          vitalsFeeling === opt.key ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ' + opt.bg
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
                      className="px-6 py-2.5 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
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
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 2 of 5</span>
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
                      className="px-6 py-2.5 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
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
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 3 of 5</span>
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
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                          className="w-16 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">bpm</span>
                      </div>
                    </div>

                  </div>

                  {/* Realtime Posture & Value Warning Tooltip */}
                  {((sys1 && parseInt(sys1) >= 140) || (dia1 && parseInt(dia1) >= 90)) && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 p-3.5 rounded-xl text-xs leading-relaxed border border-rose-200 dark:border-rose-900/30 flex gap-2.5 items-start">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 animate-ping" />
                      <div>
                        <span className="font-bold block">Elevated Value Guideline Notice:</span>
                        First Reading resides in the Hypertension range. Please review sitting posture, relax shoulder tension, and take slow, deep inhalations during the upcoming intermission.
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setVitalsStep('step2')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold">
                      Back
                    </button>
                    <button
                      onClick={() => setVitalsStep('rest1')}
                      disabled={!sys1.trim() || !dia1.trim() || !pulse1.trim()}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition"
                    >
                      Next: Start Rest Period (45s)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD COOLDOWN STEP 4: Rest Intermission Timer 1 with slideshow guides */}
            {vitalsStep === 'rest1' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 3 of 5 (Rest Cooldown)</span>
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
                          strokeDashoffset={351.8 * (1 - restSeconds / 45)}
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
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-emerald-900 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="bg-emerald-100 text-[8px] font-bold px-2 py-0.5 rounded text-emerald-700 tracking-wider font-mono uppercase">
                        Heart wellness snippet
                      </span>
                      <h5 className="font-bold text-xs mt-2 text-emerald-950">
                        {rotatingSlideIndex === 0 && "Avoid speaking or moving during wait periods."}
                        {rotatingSlideIndex === 1 && "Limit heavily sodiumized broths or fast processed foods."}
                        {rotatingSlideIndex === 2 && "Hydrate with at least 2.5 Litres of safe water daily."}
                        {rotatingSlideIndex === 3 && "S sorghum porridges act as steady arterial buffers."}
                      </h5>
                      <p className="text-[10px] text-emerald-700/80 leading-relaxed mt-1 font-medium">
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
                          className={`w-2 h-2 rounded-full transition-all ${rotatingSlideIndex === dot ? 'bg-emerald-600 w-4' : 'bg-emerald-200'}`}
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
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 4 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Second Logged Measurement</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-250 p-4 rounded-lg flex gap-3 text-xs border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Stability verified:</span>
                      Your body has stabilized during the 45-second comfort period. Place the second cuff inflation and write in the indices below.
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
                          value={sys2}
                          onChange={(e) => setSys2(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                          className="w-16 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">bpm</span>
                      </div>
                    </div>

                  </div>

                  {/* Realtime Posture & Value Warning Tooltip */}
                  {((sys2 && parseInt(sys2) >= 140) || (dia2 && parseInt(dia2) >= 90)) && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 p-3.5 rounded-xl text-xs leading-relaxed border border-rose-200 dark:border-rose-900/30 flex gap-2.5 items-start">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 animate-ping" />
                      <div>
                        <span className="font-bold block">Persistent Elevated Range Detected:</span>
                        Second Reading is also elevated. Maintain an upright spine, avoid talking or swallowing during cuff inflations, and rest fully during the final intermission queue.
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setVitalsStep('reading1')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold">
                      Back
                    </button>
                    <button
                      onClick={() => setVitalsStep('rest2')}
                      disabled={!sys2.trim() || !dia2.trim() || !pulse2.trim()}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition"
                    >
                      Next: Start Rest Period (45s)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD COOLDOWN STEP 6: Rest Intermission Timer 2 with slideshow guides */}
            {vitalsStep === 'rest2' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 4 of 5 (Rest Cooldown)</span>
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
                          strokeDashoffset={351.8 * (1 - restSeconds / 45)}
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
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-emerald-900 flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="bg-emerald-100 text-[8px] font-bold px-2 py-0.5 rounded text-emerald-700 tracking-wider font-mono uppercase">
                        Sodium management guides
                      </span>
                      <h5 className="font-bold text-xs mt-2 text-emerald-950">
                        {rotatingSlideIndex === 0 && "Avoid speaking or moving during wait periods."}
                        {rotatingSlideIndex === 1 && "Limit heavily sodiumized broths or fast processed foods."}
                        {rotatingSlideIndex === 2 && "Hydrate with at least 2.5 Litres of safe water daily."}
                        {rotatingSlideIndex === 3 && "S sorghum porridges act as steady arterial buffers."}
                      </h5>
                      <p className="text-[10px] text-emerald-700/80 leading-relaxed mt-1 font-medium">
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
                          className={`w-2 h-2 rounded-full transition-all ${rotatingSlideIndex === dot ? 'bg-emerald-600 w-4' : 'bg-emerald-200'}`}
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
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase font-mono">Step 5 of 5</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Final Reading & Medication Adherence</h3>
                  </div>
                  <button onClick={resetVitalsForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>

                <form onSubmit={handleVitalsSubmit} className="p-6 space-y-6">
                  
                  {/* BP Log cuff inputs panel */}
                  <div className="bg-slate-50/55 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex justify-around items-center gap-6">
                    
                    {/* Systolic */}
                    <div className="text-center space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Systolic (Top)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={sys3}
                          onChange={(e) => setSys3(e.target.value)}
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                          className="w-18 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                          className="w-16 bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 font-mono font-black text-xl py-3 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          required
                        />
                        <span className="text-[10px] text-slate-400 font-bold">bpm</span>
                      </div>
                    </div>

                  </div>

                  {/* Realtime Posture & Value Warning Tooltip */}
                  {((sys3 && parseInt(sys3) >= 140) || (dia3 && parseInt(dia3) >= 90)) && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 p-3.5 rounded-xl text-xs leading-relaxed border border-rose-200 dark:border-rose-900/30 flex gap-2.5 items-start">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 animate-ping" />
                      <div>
                        <span className="font-bold block">Final Elevated Measurement Alert:</span>
                        The third reading is also high. This indicates a cumulative high blood pressure average. Your daily average logged will carry a "High Risk" indicator inside the clinical team's dashboard.
                      </div>
                    </div>
                  )}

                  {/* Medication adherence checklist within search parameters */}
                  <div className="space-y-3">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block uppercase tracking-wide">
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
                              ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 font-bold text-emerald-800 dark:text-emerald-300' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            vitalsMedication === adherenceOpt ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {vitalsMedication === adherenceOpt && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{adherenceOpt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => setVitalsStep('reading2')} className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold">
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
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
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
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>Average Pulse Rate</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded text-[11px]">
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
                        "Your averaged parameters indicate a high-risk hypertension Stage 2 threshold. We suggest reviewing these logs with your care provider via the Providers chat tab and avoiding sudden physical stresses."
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
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex h-[480px] overflow-hidden">
            
            {/* Channels select list */}
            <div className="w-56 border-r border-slate-200 dark:border-slate-800 shrink-0 flex flex-col pt-4 bg-slate-50/40 dark:bg-slate-900/10">
              <span className="text-[10px] font-black text-slate-400 uppercase px-4 mb-3">Support Forum Boards</span>
              <div className="flex-1 overflow-y-auto space-y-1">
                {forumBoards.map(ch => (
                  <div 
                    key={ch.id}
                    onClick={() => setCommSelectedChannel(ch.id)}
                    className={`p-3 mx-2 rounded-lg cursor-pointer transition ${ch.id === commSelectedChannel ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
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
                <div className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-bold">Moderated and Verified</div>
              </div>

              {/* Chat bubble list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-slate-950/30">
                {communityMessages.filter(msg => msg.channel === commSelectedChannel).map(msg => (
                  <div key={msg.id} className="flex gap-3">
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full border shrink-0 object-cover bg-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-200 dark:border-slate-800">
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl max-w-lg text-xs leading-relaxed border border-transparent">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-200">{msg.senderName}</span>
                          <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-sm font-black uppercase font-sans">
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
                  className="flex-1 bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 dark:text-white"
                  required
                />
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-slate-900 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer"
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
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Personal details & Demographics</h5>
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono font-black px-2 py-0.5 rounded">
                    User ID: {formatUserId(session.id)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={profFirstName} 
                      onChange={(e) => setProfFirstName(e.target.value)} 
                      placeholder="e.g. Ama"
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={profLastName} 
                      onChange={(e) => setProfLastName(e.target.value)} 
                      placeholder="e.g. Mensah"
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">Biological Sex</label>
                    <select 
                      value={profSex} 
                      onChange={(e) => setProfSex(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-1">
                      Date of Birth (DOB)
                      {profDob && (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono ml-1 font-normal">
                          ({(() => {
                            const bDate = new Date(profDob);
                            if (isNaN(bDate.getTime())) return session.age || 0;
                            const today = new Date();
                            let age = today.getFullYear() - bDate.getFullYear();
                            const m = today.getMonth() - bDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
                            return age > 0 ? age : 0;
                          })()} yrs)
                        </span>
                      )}
                    </label>
                    <input 
                      type="date" 
                      value={profDob} 
                      onChange={(e) => setProfDob(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-2 px-3 rounded-lg text-xs font-semibold text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Display Name</label>
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
                    {profAvatar ? (
                      <img 
                        src={profAvatar} 
                        alt="Avatar Studio Preview" 
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-white" 
                        id="avatar-preview-thumbnail"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 text-white flex items-center justify-center text-sm font-black shrink-0 border border-slate-200 dark:border-slate-700">
                        {((profName || session.name || "U").charAt(0).toUpperCase())}
                      </div>
                    )}
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
                        <label className="py-1 px-2.5 bg-emerald-600 hover:bg-slate-900 text-white text-[9px] font-bold rounded-lg transition cursor-pointer select-none">
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
                <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest border-b pb-1.5">Emergency contact details</h5>
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition"
              >
                Commit Changes
              </button>
            </div>
          </form>
        )}

        {/* TAB 7: Searchable Help Center & Clinical FAQs */}
        {activeTab === 'help' && (
          <div className="space-y-6">
            {/* Help Center Hero Search Banner */}
            <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                    Patient Knowledge & Help Center
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  How can we support your care journey today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Search through clinical protocols, blood pressure monitoring guidelines, Ahomka Ho 3-reading steps, appointment workflows, and system privacy standards.
                </p>

                {/* Real-time Search Input */}
                <div className="relative pt-2">
                  <div className="relative flex items-center">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={helpSearchQuery}
                      onChange={(e) => setHelpSearchQuery(e.target.value)}
                      placeholder="Search for answers (e.g. 3-reading, high risk, appointments, security)..."
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner font-medium"
                    />
                    {helpSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHelpSearchQuery('')}
                        className="absolute right-4 p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider shrink-0 mr-1">
                Category:
              </span>
              {[
                'All',
                'Vitals & Blood Pressure',
                'Appointments & Care',
                'Account & Security',
                'AI Assistant',
                'General Wellness',
                'Medication'
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedHelpCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedHelpCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtered FAQs Output List */}
            {(() => {
              const queryLower = helpSearchQuery.toLowerCase().trim();
              const filteredFaqs = faqs.filter((faq) => {
                const matchesCat = selectedHelpCategory === 'All' || faq.category === selectedHelpCategory;
                const matchesQuery =
                  !queryLower ||
                  faq.question.toLowerCase().includes(queryLower) ||
                  faq.answer.toLowerCase().includes(queryLower) ||
                  (faq.category && faq.category.toLowerCase().includes(queryLower));
                return matchesCat && matchesQuery;
              });

              if (filteredFaqs.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        No matching answers found
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        We couldn't find any FAQs matching "{helpSearchQuery}". Try adjusting your keywords or reach out directly to your care team.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={() => { setHelpSearchQuery(''); setSelectedHelpCategory('All'); }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Reset Search Filters
                      </button>
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Message Care Team</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                    <span>
                      Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'article' : 'articles'}
                      {helpSearchQuery && ` for "${helpSearchQuery}"`}
                    </span>
                    <button
                      onClick={() => {
                        if (expandedFaqIds.length === filteredFaqs.length) {
                          setExpandedFaqIds([]);
                        } else {
                          setExpandedFaqIds(filteredFaqs.map((f) => f.id));
                        }
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[11px] cursor-pointer"
                    >
                      {expandedFaqIds.length === filteredFaqs.length ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredFaqs.map((faq) => {
                      const isExpanded = expandedFaqIds.includes(faq.id);
                      const feedback = faqFeedback[faq.id];

                      return (
                        <div
                          key={faq.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedFaqIds((prev) =>
                                prev.includes(faq.id) ? prev.filter((id) => id !== faq.id) : [...prev, faq.id]
                              );
                            }}
                            className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 inline-block">
                                {faq.category || 'General Help'}
                              </span>
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                                {faq.question}
                              </h3>
                            </div>
                            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 mt-1">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-5 pt-1 sm:px-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 font-sans">
                              <p className="text-slate-700 dark:text-slate-300 font-medium">
                                {faq.answer}
                              </p>

                              {/* Feedback & Actions */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                  <span>Was this answer helpful?</span>
                                  <button
                                    onClick={() => setFaqFeedback((prev) => ({ ...prev, [faq.id]: 'up' }))}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      feedback === 'up'
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setFaqFeedback((prev) => ({ ...prev, [faq.id]: 'down' }))}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      feedback === 'down'
                                        ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setActiveTab('messages')}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    Ask Doctor
                                  </button>
                                  <button
                                    onClick={() => setActiveTab('ai')}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition cursor-pointer"
                                  >
                                    Discuss with AI
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Support Quick Links Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div
                onClick={() => setActiveTab('ai')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">AI Health Assistant</h4>
                  <p className="text-[11px] text-slate-400">Get immediate 24/7 evidence-based clinical answers.</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('messages')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Direct Doctor Messaging</h4>
                  <p className="text-[11px] text-slate-400">Send encrypted notes to your primary care specialist.</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('dashboard')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Book Appointment</h4>
                  <p className="text-[11px] text-slate-400">Schedule virtual video/audio consultations.</p>
                </div>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
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

      {/* AHOMKA HO ENTRY FULL DETAILS MODAL POPUP */}
      {selectedAhomkaEntry && (
        <div id="ahomka-details-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '655px', height: '500px', maxWidth: '100%', maxHeight: '100%' }}
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Ahomka Ho Vitals Detail</h4>
                  <p className="text-[10px] text-slate-400 font-mono font-medium">{selectedAhomkaEntry.timestamp}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAhomkaEntry(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-5 space-y-4 sm:space-y-5 pr-1 font-sans text-xs">
              
              {/* Vitals Summary Row */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 bg-slate-50 dark:bg-slate-950/20 p-2 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="text-center p-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Systolic BP</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white">{selectedAhomkaEntry.systolic || '--'}</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400">mmHg</span>
                  </div>
                </div>
                <div className="text-center p-0.5 border-x border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Diastolic BP</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white">{selectedAhomkaEntry.diastolic || '--'}</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400">mmHg</span>
                  </div>
                </div>
                <div className="text-center p-0.5">
                  <span className="text-[9px] uppercase font-bold text-emerald-500 font-mono block mb-1">Rest Pulse</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{selectedAhomkaEntry.pulse || '--'}</span>
                    <span className="text-[8px] sm:text-[9px] text-emerald-400">bpm</span>
                  </div>
                </div>
              </div>

              {/* Three readings sequence breakdown */}
              {selectedAhomkaEntry.readings && selectedAhomkaEntry.readings.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider font-mono">Sequential Readings Breakdown</h5>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {selectedAhomkaEntry.readings.map((reading, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-1.5 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-center relative">
                        <span className="absolute top-0.5 left-1 text-[8px] font-bold text-slate-300 dark:text-slate-600">#{idx + 1}</span>
                        <div className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                          {reading.systolic}/{reading.diastolic}
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">Pulse: {reading.pulse}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Symptoms */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider font-mono">Registered Symptoms</h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAhomkaEntry.symptoms && selectedAhomkaEntry.symptoms.length > 0 ? (
                    selectedAhomkaEntry.symptoms.map(s => (
                      <span key={s} className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-red-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-bold rounded-lg text-[9px] sm:text-[9.5px]">
                        ⚠️ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[10.5px]">No somatic symptoms registered.</span>
                  )}
                </div>
              </div>

              {/* Patient Well-being Indices */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider font-mono">Wellness & Perceived Stress Indices</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950/10 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 block font-semibold">Mood Score</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAhomkaEntry.mood}/10</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-xs shrink-0">
                      {selectedAhomkaEntry.mood >= 8 ? '😊' : selectedAhomkaEntry.mood >= 5 ? '😐' : '😞'}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/10 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 block font-semibold">Perceived Stress</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedAhomkaEntry.stress}/10</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xs shrink-0">
                      🧠
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/10 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 flex items-center justify-between sm:col-span-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-slate-400 block font-semibold">Comfort Standing</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block break-words whitespace-normal mt-0.5 leading-snug">
                        {selectedAhomkaEntry.feeling || 'N/A'}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xs shrink-0 ml-3">
                      🌿
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/10 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 flex items-center justify-between sm:col-span-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-slate-400 block font-semibold">Medication Adherence</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block break-words whitespace-normal mt-0.5 leading-snug">
                        {selectedAhomkaEntry.medicationAdherence || 'Yes, fully compliant'}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-xs shrink-0 ml-3">
                      💊
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Notes & Self-Annotations */}
              {selectedAhomkaEntry.notes && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider font-mono">Patient Self-Annotations</h5>
                  <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/15 text-slate-700 dark:text-slate-300 font-medium italic rounded-xl border border-emerald-100/60 dark:border-emerald-900/40 leading-relaxed">
                    "{selectedAhomkaEntry.notes}"
                  </div>
                </div>
              )}

              {/* HIPAA Secure Seal */}
              <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-[10px] text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">This telemetry data is HIPAA-securely sealed, cryptographically verified, and fully integrated with your health provider profile.</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAhomkaEntry(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-[11px] cursor-pointer"
              >
                Close details view
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Selected Care Provider Profile Details Modal Popup */}
      {selectedDetailProvider && (
        <div id="provider-details-dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative animate-fade-in text-slate-900 dark:text-slate-100">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">Clinical Provider Directory</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Verified Medical Practitioner Profile details</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedDetailProvider(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 font-sans">
              
              {/* Profile Card Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/30 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                <img 
                  src={selectedDetailProvider.avatar} 
                  alt={selectedDetailProvider.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-800 shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                    <h4 className="font-black text-base text-slate-900 dark:text-white leading-none">{selectedDetailProvider.name}</h4>
                    <span className="inline-flex self-center sm:self-auto items-center gap-1 text-[9px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-full font-mono">
                      <Check className="w-2.5 h-2.5" />
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedDetailProvider.specialty}</p>
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <span>★ Rating: {selectedDetailProvider.rating || '4.8'}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>Consultation copay: {selectedDetailProvider.fee || 'GH₵ 150'}</span>
                  </p>
                </div>
              </div>

              {/* Practice Location & Facility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Affiliated Medical Facility</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedDetailProvider.hospital || 'Korle-Bu Teaching Hospital (KBTH)'}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">City / Location</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedDetailProvider.location || 'Accra, Greater Accra'}</p>
                </div>
              </div>

              {/* Consultation Slots */}
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Daily Availability Hours</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(selectedDetailProvider.slots && selectedDetailProvider.slots.length > 0) ? (
                    selectedDetailProvider.slots.map(s => (
                      <div 
                        key={s} 
                        className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold text-center font-mono shadow-xs"
                      >
                        {s}
                      </div>
                    ))
                  ) : (
                    ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map(s => (
                      <div 
                        key={s} 
                        className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold text-center font-mono shadow-xs"
                      >
                        {s}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Security seal */}
              <div className="flex items-center gap-2.5 bg-emerald-50/40 dark:bg-emerald-950/15 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 text-[10px] text-slate-600 dark:text-slate-300 leading-normal">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>This medical provider is a board-certified clinical specialist registered under HIPAA data protection governance. Direct secure message loops are end-to-end encrypted.</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailProvider(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-[11px] cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
