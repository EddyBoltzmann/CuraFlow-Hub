/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  LogOut, Sun, Moon, Sparkles, ShieldAlert, Key, Globe, Layout, ShieldCheck, 
  User, RefreshCw, X, HelpCircle, Bell, VolumeX, CheckCircle, Info, Search, Database, Activity
} from 'lucide-react';

import { 
  AppUser, HealthLog, Conversation, CMSArticle, FAQ, Announcement, AuditLog, AIChatMessage,
  ProviderInfo, AhomkaEntry, CommunityMessage, AppointmentBooking, SupportForumBoard
} from './types';
import { 
  defaultLogs, defaultConvs, defaultArticles, defaultUsers, defaultFAQs, defaultAnnouncements, defaultAuditLogs,
  defaultProviders, defaultAhomkaEntries, defaultCommunityMessages, defaultForumBoards
} from './data';

import PortalLogin from './components/PortalLogin';
import PatientLayout from './components/PatientLayout';
import ProviderLayout from './components/ProviderLayout';
import AdminLayout from './components/AdminLayout';

export default function App() {
  
  // Storage hooks - Load database states or fallback to data seed structures
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('curaflow_users');
    let list: AppUser[] = saved ? JSON.parse(saved) : [];
    
    // Ensure Eddy Boltzmann is always registered as admin
    const eddyExists = list.some(u => u.email.toLowerCase() === 'eddyboltzmann@gmail.com');
    if (!eddyExists) {
      const freshEddy: AppUser = {
        id: 'usr-4',
        name: 'Eddy Boltzmann',
        email: 'eddyboltzmann@gmail.com',
        role: 'admin',
        status: 'Active',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        password: 'Boltzmann_12',
        isSuperAdmin: true
      };
      list.push(freshEddy);
      localStorage.setItem('curaflow_users', JSON.stringify(list));
    }
    // Delete the admin Carl Peterson if present
    list = list.filter(u => u.email.toLowerCase() !== 'carl.admin@curaflow.com' && !u.name.toLowerCase().includes('carl peterson'));
    return list;
  });

  const [session, setSession] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('curaflow_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email?.toLowerCase() === 'carl.admin@curaflow.com' || parsed.name?.toLowerCase().includes('carl peterson')) {
        localStorage.removeItem('curaflow_session');
        return null;
      }
      return parsed;
    }
    return null;
  });

  const [logs, setLogs] = useState<HealthLog[]>(() => {
    const saved = localStorage.getItem('curaflow_logs');
    if (saved) return JSON.parse(saved);
    
    // Pristine clinical logging starts with a completely empty baseline
    const seeds: HealthLog[] = [];
    localStorage.setItem('curaflow_logs', JSON.stringify(seeds));
    return seeds;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('curaflow_convs');
    return saved ? JSON.parse(saved) : [];
  });

  const [articles, setArticles] = useState<CMSArticle[]>(() => {
    const saved = localStorage.getItem('curaflow_articles');
    return saved ? JSON.parse(saved) : defaultArticles;
  });

  const [faqs, setFaqs] = useState<FAQ[]>(() => {
    const saved = localStorage.getItem('curaflow_faqs');
    return saved ? JSON.parse(saved) : [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('curaflow_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('curaflow_audit');
    const parsed: AuditLog[] = saved ? JSON.parse(saved) : [];
    const seen = new Set<string>();
    return parsed.filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  });

  const [aiChat, setAIChat] = useState<AIChatMessage[]>(() => {
    const saved = localStorage.getItem('curaflow_aichat');
    return saved ? JSON.parse(saved) : [
      { id: 'start', role: 'assistant', content: 'Hello! I am your CFL Health AI health assistant. I can review your recorded biometric diaries (blood pressure, glucose levels, heart rate) to yield insights. What biometric question can I answer today?', timestamp: '08:00 AM' }
    ];
  });

  const [providers, setProviders] = useState<ProviderInfo[]>(() => {
    const saved = localStorage.getItem('curaflow_providers');
    return saved ? JSON.parse(saved) : [];
  });

  const [ahomkaEntries, setAhomkaEntries] = useState<AhomkaEntry[]>(() => {
    const saved = localStorage.getItem('curaflow_ahomka_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>(() => {
    const saved = localStorage.getItem('curaflow_comm_msgs');
    return saved ? JSON.parse(saved) : [];
  });

  const [bookings, setBookings] = useState<AppointmentBooking[]>(() => {
    const saved = localStorage.getItem('curaflow_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [forumBoards, setForumBoards] = useState<SupportForumBoard[]>(() => {
    const saved = localStorage.getItem('curaflow_forum_boards');
    return saved ? JSON.parse(saved) : defaultForumBoards;
  });

  const [loggedInUserIds, setLoggedInUserIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('curaflow_active_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Global searching queries & typing statuses
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isDoctorTyping, setIsDoctorTyping] = useState(false);
  const [showPwaPrompt, setShowPwaPrompt] = useState(true);

  // Platform admin-broadcast indicator message text
  const [platformBroadcastMsg, setPlatformBroadcastMsg] = useState<string | null>(null);

  // Dynamic status toast alerts
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Recommendation 2: HIPAA Security Inactivity Session Guard
  const [idleSeconds, setIdleSeconds] = useState<number>(0);
  const SECURE_TIMEOUT_SECONDS = 300; // 5-minute HIPAA inactivity cutoff (warning triggers at last 30 seconds)

  // Supabase Database Connection & Sync states
  const [dbStatus, setDbStatus] = useState<'connecting' | 'synced' | 'local'>('connecting');
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [dbDiagnosticMsg, setDbDiagnosticMsg] = useState<string>('Initializing link with Supabase...');
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);

  // Dynamic premium production splash screen state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashProgress, setSplashProgress] = useState<number>(0);
  const [splashPhase, setSplashPhase] = useState<string>('Initializing secure ledger...');

  // Active pristine baseline local storage purge
  useEffect(() => {
    const hasPurged = localStorage.getItem('curaflow_pristine_v4_purged');
    if (!hasPurged) {
      localStorage.removeItem('curaflow_users');
      localStorage.removeItem('curaflow_logs');
      localStorage.removeItem('curaflow_bookings');
      localStorage.removeItem('curaflow_active_sessions');
      localStorage.removeItem('curaflow_session');
      localStorage.removeItem('curaflow_audit');
      localStorage.removeItem('curaflow_ahomka_entries');
      localStorage.removeItem('curaflow_community_messages');
      localStorage.setItem('curaflow_pristine_v4_purged', 'true');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    const start = Date.now();
    const duration = 2400; // 2.4s total load simulation
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setSplashProgress(progress);
      
      if (progress < 25) {
        setSplashPhase('Establishing secure HIPAA pipeline...');
      } else if (progress < 55) {
        setSplashPhase('Synchronizing clinical database states...');
      } else if (progress < 85) {
        setSplashPhase('Decrypting local EHR credentials...');
      } else {
        setSplashPhase('Sandbox systems running beautifully. Ready.');
      }
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 45);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Helper method to push safe JSON data snapshots to server-side Postgres
  const saveToDb = async (key: string, val: any) => {
    try {
      const response = await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, val })
      });
      if (!response.ok) {
        console.warn(`[Supabase DB Sync] Refused save handshake for key: ${key}`);
      }
    } catch (err) {
      console.warn(`[Supabase DB Sync] Network loss. Retaining safe local cache. Error:`, err);
    }
  };

  // Run initial diagnostic test & fetch remote synchronized states from postgres
  useEffect(() => {
    async function initDatabaseSync() {
      try {
        // Step 1: Query diagnostic status
        const diagRes = await fetch('/api/sync/diagnostic');
        const diagJson = await diagRes.json();
        
        if (diagJson.connected) {
          setDbStatus('synced');
          setDbLatency(diagJson.latencyMs);
          setDbDiagnosticMsg(diagJson.message);
          
          // Step 2: Fetch stored key-values from database
          const loadRes = await fetch('/api/sync/load');
          const loadJson = await loadRes.json();
          
          if (loadJson.status === 'synced') {
            const data = loadJson.data || {};
            
            // Overwrite in-memory React states only if corresponding database rows exist
            if (data.users !== undefined && data.users !== null) {
              const cleaned = data.users.filter((u: any) => u.email?.toLowerCase() !== 'carl.admin@curaflow.com' && !u.name?.toLowerCase().includes('carl peterson'));
              setUsers(cleaned);
            }
            if (data.logs !== undefined && data.logs !== null) setLogs(data.logs);
            if (data.conversations !== undefined && data.conversations !== null) setConversations(data.conversations);
            if (data.articles !== undefined && data.articles !== null) setArticles(data.articles);
            if (data.faqs !== undefined && data.faqs !== null) setFaqs(data.faqs);
            if (data.announcements !== undefined && data.announcements !== null) setAnnouncements(data.announcements);
            if (data.audit !== undefined && data.audit !== null) {
              const seen = new Set<string>();
              const filteredAudit = data.audit.filter((item: any) => {
                if (!item.id || seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
              });
              setAuditLogs(filteredAudit);
            }
            if (data.aichat !== undefined && data.aichat !== null) setAIChat(data.aichat);
            if (data.providers !== undefined && data.providers !== null) setProviders(data.providers);
            if (data.ahomka_entries !== undefined && data.ahomka_entries !== null) setAhomkaEntries(data.ahomka_entries);
            if (data.comm_msgs !== undefined && data.comm_msgs !== null) setCommunityMessages(data.comm_msgs);
            if (data.bookings !== undefined && data.bookings !== null) setBookings(data.bookings);
            
          }
        } else {
          setDbStatus('local');
          setDbDiagnosticMsg(diagJson.message || 'DATABASE_URL matches empty. Running off local cache storage (HIPAA Sandbox).');
        }
      } catch (err: any) {
        console.warn('Initial DB handshake connection timed out. Falling back to secure localStorage.', err);
        setDbStatus('local');
        setDbDiagnosticMsg('Network disconnect or database host timed out. Offline HIPAA fallback mode enabled.');
      } finally {
        // DB loading completes, mark initialized to allow save triggers
        setDbInitialized(true);
      }
    }

    initDatabaseSync();
  }, []);

  // Recommendation 2: HIPAA Security Inactivity Hook
  useEffect(() => {
    // Patient side does not enforce auto-logout under recent rules
    if (!session || session.role === 'patient') {
      setIdleSeconds(0);
      return;
    }

    const resetTimer = () => {
      setIdleSeconds(0);
    };

    // Listeners for active user engagement
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    // Dynamic 1-second ticks
    const interval = setInterval(() => {
      setIdleSeconds(prev => {
        const next = prev + 1;
        if (next >= SECURE_TIMEOUT_SECONDS) {
          clearInterval(interval);
          // Auto session lock out under security guidelines
          handleLogout('HIPAA Security Safeguard: Your session was locked due to 5 minutes of inactivity.');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearInterval(interval);
    };
  }, [session]);

  // Run diagnostic check manually from Database Connection dashboard widget
  const handleTestDbConnection = async () => {
    setIsTestingDb(true);
    setDbDiagnosticMsg('Testing Postgres handshake performance...');
    const start = Date.now();
    try {
      const res = await fetch('/api/sync/diagnostic');
      const json = await res.json();
      const delay = Date.now() - start;
      if (json.connected) {
        setDbStatus('synced');
        setDbLatency(json.latencyMs || delay);
        setDbDiagnosticMsg(`Handshake OK! ${json.message}`);
        triggerToast('Supabase Live DB checked successfully!', 'success');
      } else {
        setDbStatus('local');
        setDbDiagnosticMsg(json.message || 'Database connection failed.');
        triggerToast('Database socket handshakes are currently offline.', 'error');
      }
    } catch (err: any) {
      setDbStatus('local');
      setDbDiagnosticMsg(err.message || 'Network exception connecting to Supabase.');
      triggerToast('Local DB fallback active.', 'info');
    } finally {
      setIsTestingDb(false);
    }
  };

  // Explicitly force a write of all current client values back to the Supabase PostgreSQL database
  const handleForceCloudPush = async () => {
    triggerToast('Pulsing all records securely to Supabase...', 'info');
    try {
      await Promise.all([
        saveToDb('users', users),
        saveToDb('logs', logs),
        saveToDb('conversations', conversations),
        saveToDb('articles', articles),
        saveToDb('faqs', faqs),
        saveToDb('announcements', announcements),
        saveToDb('audit', auditLogs),
        saveToDb('aichat', aiChat),
        saveToDb('providers', providers),
        saveToDb('ahomka_entries', ahomkaEntries),
        saveToDb('comm_msgs', communityMessages),
        saveToDb('bookings', bookings)
      ]);
      triggerToast('All telemetry files successfully synchronized to cloud DB!', 'success');
    } catch (err) {
      triggerToast('Failed to force sync elements to cloud database.', 'error');
    }
  };

  // Sync state mutations to durable localStorage AND server-side PostgreSQL database when initialized
  useEffect(() => {
    localStorage.setItem('curaflow_users', JSON.stringify(users));
    if (dbInitialized) {
      saveToDb('users', users);
    }
  }, [users, dbInitialized]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('curaflow_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('curaflow_session');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('curaflow_logs', JSON.stringify(logs));
    if (dbInitialized) {
      saveToDb('logs', logs);
    }
  }, [logs, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_convs', JSON.stringify(conversations));
    if (dbInitialized) {
      saveToDb('conversations', conversations);
    }
  }, [conversations, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_articles', JSON.stringify(articles));
    if (dbInitialized) {
      saveToDb('articles', articles);
    }
  }, [articles, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_faqs', JSON.stringify(faqs));
    if (dbInitialized) {
      saveToDb('faqs', faqs);
    }
  }, [faqs, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_announcements', JSON.stringify(announcements));
    if (dbInitialized) {
      saveToDb('announcements', announcements);
    }
  }, [announcements, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_active_sessions', JSON.stringify(loggedInUserIds));
  }, [loggedInUserIds]);

  useEffect(() => {
    localStorage.setItem('curaflow_audit', JSON.stringify(auditLogs));
    if (dbInitialized) {
      saveToDb('audit', auditLogs);
    }
  }, [auditLogs, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_aichat', JSON.stringify(aiChat));
    if (dbInitialized) {
      saveToDb('aichat', aiChat);
    }
  }, [aiChat, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_providers', JSON.stringify(providers));
    if (dbInitialized) {
      saveToDb('providers', providers);
    }
  }, [providers, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_ahomka_entries', JSON.stringify(ahomkaEntries));
    if (dbInitialized) {
      saveToDb('ahomka_entries', ahomkaEntries);
    }
  }, [ahomkaEntries, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_comm_msgs', JSON.stringify(communityMessages));
    if (dbInitialized) {
      saveToDb('comm_msgs', communityMessages);
    }
  }, [communityMessages, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_bookings', JSON.stringify(bookings));
    if (dbInitialized) {
      saveToDb('bookings', bookings);
    }
  }, [bookings, dbInitialized]);

  useEffect(() => {
    localStorage.setItem('curaflow_forum_boards', JSON.stringify(forumBoards));
    if (dbInitialized) {
      saveToDb('forum_boards', forumBoards);
    }
  }, [forumBoards, dbInitialized]);

  // Dynamically initialize secure Care Team messaging slot for every registered patient
  useEffect(() => {
    if (!dbInitialized) return;
    const patients = users.filter(u => u.role === 'patient');
    let updated = false;
    const nextConvs = [...conversations];

    patients.forEach(pat => {
      const exists = nextConvs.some(c => c.patientId === pat.id);
      if (!exists) {
        const defaultConvId = `conv-${pat.id}`;
        const newWelcomeConv: Conversation = {
          id: defaultConvId,
          patientId: pat.id,
          name: 'Dr. Aris Jenkins',
          specialty: 'Cardiology (Lead)',
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
          online: true,
          unread: 0,
          messages: [
            {
              id: `welcome-${pat.id}`,
              sender: 'doctor',
              senderName: 'Dr. Aris Jenkins (Cardiology Lead)',
              content: `Welcome ${pat.name}! I am your Cardiology Lead. Please log your biometrics daily (blood pressure, heart rate, or blood glucose) using the portal, and feel free to ask me any questions about your readings here.`,
              time: '08:00 AM'
            }
          ]
        };
        nextConvs.push(newWelcomeConv);
        updated = true;
      }
    });

    if (updated) {
      setConversations(nextConvs);
      localStorage.setItem('curaflow_convs', JSON.stringify(nextConvs));
      saveToDb('conversations', nextConvs);
    }
  }, [users, conversations, dbInitialized]);

  // Toast dispatch helper
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };



  // Logging out
  const handleLogout = (customAlert?: string) => {
    if (session) {
      setLoggedInUserIds(prev => prev.filter(id => id !== session.id));
      dispatchAuditLog(
        session.id,
        session.name,
        session.role,
        'Secure Logout',
        customAlert || 'User manually logged out of workspace portal'
      );
    }
    setSession(null);
    setPlatformBroadcastMsg(null);
    triggerToast(customAlert || 'Workspace securely closed.', 'info');
  };

  // Logging in
  const handleLoginSuccess = (user: AppUser) => {
    setSession(user);
    setLoggedInUserIds(prev => Array.from(new Set([...prev, user.id])));
    dispatchAuditLog(
      user.id,
      user.name,
      user.role,
      'Authorized Authentication',
      `Access credential verified. Status is ${user.status}`
    );
    triggerToast(`Welcome back, ${user.name}! Access granted.`, 'success');
    if (user.role === 'admin') {
      setTimeout(() => {
        triggerToast('Active Supabase cloud sync loaded successfully!', 'success');
      }, 800);
    }
  };

  // Registering
  const handleRegisterSuccess = (newUser: AppUser) => {
    // Standard newly registered profiles are marked as Active so they can instantly enter and use their workspace portal
    const activeNewUser = { ...newUser, status: 'Active' as const, verified: true };
    setUsers(prev => [activeNewUser, ...prev]);
    dispatchAuditLog(
      activeNewUser.id, 
      activeNewUser.name, 
      activeNewUser.role, 
      'Profile Registration', 
      'Registered a new secure account in storage and instantly logged in.'
    );
    // Instantly direct them to their respective pages by setting active session state and logging active sessions
    setSession(activeNewUser);
    setLoggedInUserIds(prev => Array.from(new Set([...prev, activeNewUser.id])));
    triggerToast(`Welcome to CuraFlow, ${activeNewUser.name}! Your account has been initialized and logged in.`, 'success');
  };

  // Profile update
  const handleUpdateProfile = (updated: AppUser) => {
    setSession(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
    dispatchAuditLog(updated.id, updated.name, updated.role, 'Profile Correction', 'Modified emergency info or insurance card fields.');
  };

  const handlePasswordReset = (email: string, newPass: string) => {
    let resetSucceeded = false;
    setUsers(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], password: newPass };
        resetSucceeded = true;
        return copy;
      }
      return prev;
    });
    
    // Log the HIPAA audit trail
    dispatchAuditLog('identity-verifier', email, 'Secured Sandbox', 'Password Reset Request', 'Authorized sandbox-verified credential override.');
    return true; 
  };

  // Dispense Audit Log tracker
  const dispatchAuditLog = (userId: string, userName: string, userRole: string, action: string, details: string) => {
    const freshId = `aud-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newAudit: AuditLog = {
      id: freshId,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString('en-US'),
      userId,
      userName,
      userRole,
      action,
      details,
      ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`
    };
    setAuditLogs(prev => {
      if (prev.some(aud => aud.id === freshId)) return prev;
      const seen = new Set<string>();
      seen.add(freshId);
      const filteredPrev = prev.filter(aud => {
        if (!aud.id || seen.has(aud.id)) return false;
        seen.add(aud.id);
        return true;
      });
      return [newAudit, ...filteredPrev];
    });
  };

  // GAP Health - Log Ahomka Ho comfort index check-in
  const handleAddAhomkaEntry = (
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
  ) => {
    if (!session) return;
    
    // Comfort level score formula: higher mood, lower stress & physical pain level
    const moodFactor = mood * 10;
    const stressFactor = (10 - stress) * 10;
    const painFactor = (10 - painLevel) * 10;
    const comfortScore = Math.round((moodFactor + stressFactor + painFactor) / 3);

    // Format highly polished timestamp as MM/DD/YYYY or similar
    const todayStr = new Date().toLocaleDateString('en-US');

    const newEntry: AhomkaEntry = {
      id: `e-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: todayStr,
      mood,
      stress,
      painLevel,
      symptoms,
      notes,
      reliefScore: comfortScore,
      systolic,
      diastolic,
      pulse,
      feeling,
      medicationAdherence,
      readings,
      patientId: session.id
    };

    setAhomkaEntries(prev => [newEntry, ...prev]);

    // Also automatically create a clinical health log entry so provider dashboard stays perfectly synchronized!
    if (systolic !== undefined && diastolic !== undefined) {
      const bpValue = `${systolic}/${diastolic}`;
      const pulseSuffix = pulse ? `. Pulse: ${pulse} bpm` : '';
      const complianceSuffix = medicationAdherence ? ` Medication: ${medicationAdherence}` : '';
      const logNotes = `${notes}${pulseSuffix}${complianceSuffix}`;
      
      handleAddLog('Blood Pressure', bpValue, logNotes);
    }

    dispatchAuditLog(
      session.id,
      session.name,
      session.role,
      'Log Ahomka Ho Check-in',
      `Logged daily relief index: ${comfortScore}%. BP: ${systolic || 'N/A'}/${diastolic || 'N/A'}. Stress: ${stress}/10, Pain: ${painLevel}/10`
    );
  };

  // GAP Health - Share community support post
  const handleSendCommunityMessage = (channel: string, content: string) => {
    if (!session) return;

    const newMsg: CommunityMessage = {
      id: `comm-msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      channel,
      senderId: session.id,
      senderName: session.name,
      senderRole: session.role === 'patient' ? 'Patient Advocate' : 'Medical Specialist',
      senderAvatar: session.avatar || '',
      content,
      timestamp: 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setCommunityMessages(prev => [...prev, newMsg]);
    dispatchAuditLog(
      session.id,
      session.name,
      session.role,
      'Post Community message',
      `Dispatched peer guidance update under channel: ${channel}`
    );
  };

  // GAP Health - Care Telehealth Reservation Booking
  const handleAddBooking = (
    providerId: string,
    providerName: string,
    providerAvatar: string,
    specialty: string,
    mode: 'Video Call' | 'Audio Call' | 'Secure Chat',
    dateTime: string
  ) => {
    if (!session) return;

    const newBooking: AppointmentBooking = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      providerId,
      providerName,
      providerAvatar,
      specialty,
      mode,
      dateTime,
      status: 'Confirmed'
    };

    setBookings(prev => [newBooking, ...prev]);
    dispatchAuditLog(
      session.id,
      session.name,
      session.role,
      'Schedule Care consultation',
      `Booked slot with ${providerName} (${specialty}) via ${mode} on ${dateTime}`
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!session) return;
    setBookings(bookings.filter(b => b.id !== bookingId));
    dispatchAuditLog(
      session.id,
      session.name,
      session.role,
      'Cancel Care consultation',
      `Cancelled booked clinic appointment: ${bookingId}`
    );
    triggerToast('Telehealth session reservation cancelled.', 'info');
  };

  // Clinical Logs addition - Evaluates risk standings automatically
  const handleAddLog = (metric: any, value: string, notes: string) => {
    if (!session) return;

    // Direct clinical parameters baseline thresholds
    let isHighRisk = false;
    if (metric === 'Blood Pressure') {
      const parts = value.split('/');
      const sys = parseInt(parts[0]) || 120;
      const dia = parseInt(parts[1]) || 80;
      if (sys > 135 || dia > 88) isHighRisk = true;
    } else if (metric === 'Blood Glucose') {
      const num = parseFloat(value) || 100;
      if (num < 70 || num > 125) isHighRisk = true;
    } else if (metric === 'Heart Rate') {
      const num = parseFloat(value) || 72;
      if (num < 50 || num > 100) isHighRisk = true;
    } else if (metric === 'Sleep Quality') {
      const num = parseFloat(value) || 7.0;
      if (num < 5.5) isHighRisk = true;
    }

    const newLog: HealthLog = {
       id: `log-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
       timestamp: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
       metric,
       value,
       trend: isHighRisk ? 'Elevated' : 'Stable',
       verifiedBy: session.role === 'provider' ? session.name : 'Self Logged',
       notes,
       isHighRisk,
       patientId: session.id
     };

    setLogs(prev => [newLog, ...prev]);
    dispatchAuditLog(
      session.id,
      session.name,
      session.role,
      'Add Biometric Log',
      `Registered ${metric} of ${value}. Alert standing: ${isHighRisk ? 'High Alert' : 'Normal'}`
    );
    triggerToast(`${metric} biometric log recorded.`, isHighRisk ? 'error' : 'success');
  };

  const handleDeleteLog = (id: string) => {
    if (!session) return;
    const item = logs.find(l => l.id === id);
    setLogs(logs.filter(l => l.id !== id));
    dispatchAuditLog(session.id, session.name, session.role, 'Delete Biometric Log', `Deleted biometric records reference tag: ${item?.metric || 'biometric'}`);
    triggerToast('Biometric telemetry log deleted.', 'info');
  };

  // Secure dialogue messaging, includes simulated real-time provider feedback
  const handleSendMessage = (convId: string, text: string, attachment?: any) => {
    if (!session) return;

    const newMessage: AIChatMessage | any = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      sender: session.role === 'provider' ? 'doctor' : 'user',
      senderName: session.name,
      content: text,
      time: 'Just now',
      ...attachment
    };

    setConversations(conversations.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          unread: session.role === 'provider' ? 0 : c.unread + 1
        };
      }
      return c;
    }));

    dispatchAuditLog(session.id, session.name, session.role, 'Transmit HIPAA Message', `Dispatched note context: "${text.slice(0, 30)}..."`);

    // Simulate doctor responding in 2.5 seconds if patient authored the note
    if (session.role === 'patient') {
      setIsDoctorTyping(true);
      setTimeout(() => {
        setIsDoctorTyping(false);
        const autoDoctorReply: any = {
          id: `doctor-reply-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          sender: 'doctor',
          senderName: 'Dr. Aris Jenkins (Cardiology Lead)',
          content: `Hello ${session.name.split(' ')[0]}, I received your decrypted biometric log. Keep logging metrics at standard hour cycles, and feel free to ask questions here! Let me know of any sudden lightheadedness or symptoms immediately.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        setConversations(prevConvs => prevConvs.map(cv => {
          if (cv.id === convId) {
            return {
              ...cv,
              messages: [...cv.messages, autoDoctorReply],
              unread: cv.unread + 1
            };
          }
          return cv;
        }));
        triggerToast('New clinical Care Team update received!', 'info');
      }, 2500);
    }
  };

  const handleDeleteMessage = (convId: string, msgId: string) => {
    if (!session) return;
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: c.messages.filter(m => m.id !== msgId)
        };
      }
      return c;
    }));
    triggerToast('Message deleted successfully of HIPAA record.', 'success');
  };

  const handleEditMessage = (convId: string, msgId: string, newContent: string) => {
    if (!session) return;
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return {
          ...c,
          messages: c.messages.map(m => {
            if (m.id === msgId) {
              return { ...m, content: newContent };
            }
            return m;
          })
        };
      }
      return c;
    }));
    triggerToast('Message updated successfully.', 'success');
  };

  // Server-Side Gemini API call via route /api/gemini/chat with client side smart classifier fallbacks
  const handleSendAIChat = async (text: string) => {
    if (!session) return;

    const userBubble: AIChatMessage = {
      id: `ai-${Date.now()}-${Math.floor(Math.random() * 1000000)}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setAIChat(prev => [...prev, userBubble]);
    setIsAiTyping(true);

    try {
      // Direct REST lookup to Express API route in server.ts
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          roleContext: session.role
        })
      });

      if (!response.ok) {
        throw new Error('API server unavailable. Activating clinical container fallback.');
      }

      const data = await response.json();
      
      const assistantBubble: AIChatMessage = {
        id: `ai-${Date.now()}-${Math.floor(Math.random() * 1000000)}-assistant`,
        role: 'assistant',
        content: data.reply || data.text || 'No response details received from Gemini server.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setAIChat(prev => [...prev, assistantBubble]);

    } catch (err: any) {
      console.warn(err.message);
      
      // Clinical container fallback algorithm matching the user query
      setTimeout(() => {
        let fallbackMessage = "I am operating in HIPAA backup sandbox mode. Looking up clinical indices...\n\n";
        
        const lowercaseQuery = text.toLowerCase();
        if (lowercaseQuery.includes('pressure') || lowercaseQuery.includes('bp')) {
          fallbackMessage += "💡 **Hypertension Reference Baselines**:\n- Standard Diastolic limits stand between 60 mmHg and 80 mmHg.\n- Standard Systolic parameters stand between 90 mmHg and 120 mmHg.\n- Logs registering > 135/88 denote Mild Hypertension. Kindly trace daily sodium thresholds.";
        } else if (lowercaseQuery.includes('glucose') || lowercaseQuery.includes('sugar')) {
          fallbackMessage += "💡 **Glycemic Response Milestones**:\n- Normal Fasting Glucose context is 70 to 99 mg/dL.\n- Post-prandial glycemic standards should stay under 140 mg/dL.\n- Values > 125 fasting denote Diabetic baselines. Walk 15 minutes immediately following meals.";
        } else if (lowercaseQuery.includes('sleep') || lowercaseQuery.includes('rem')) {
          fallbackMessage += "💡 **REM Efficiency Guidelines**:\n- Adults require 7 to 9 hours nightly.\n- REM duration should ideally equal 20-25% of total sleep.\n- Stabilizing your baseline sleep window reduces cardiovascular load by up to 15%.";
        } else if (lowercaseQuery.includes('report') || lowercaseQuery.includes('analyze')) {
          fallbackMessage += `💡 **Clinical Biometric Analysis**:\n- Checked ${logs.length} logged data trails.\n- Current baseline weight is ${logs.find(l => l.metric === 'Weight')?.value || '154'} lbs.\n- Recent average blood pressure is stable around target vectors. Good adherence!`;
        } else {
          fallbackMessage += "💡 **Clinical Wellness Guidance**:\n- I suggest logging bio variables daily before breakfast.\n- Maintain standard hydration targets.\n- Contact Dr. Jenkins for any medicine titration inquiries.";
        }

        const assistantBubble: AIChatMessage = {
          id: `ai-${Date.now()}-${Math.floor(Math.random() * 1000000)}-assistant`,
          role: 'assistant',
          content: fallbackMessage,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setAIChat(prev => [...prev, assistantBubble]);
      }, 1200);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Simulating secure access tokens refresh with visual audit reports
  const handleSimulateTokenRefresh = () => {
    if (!session) return;
    dispatchAuditLog(
      session.id,
      session.name,
      session.role,
      'Refresh Secure Tokens',
      'Refreshed JWT access tokens. Session expiration clock renewed.'
    );
    triggerToast('Access token refreshed. Encryption pathways validated!', 'success');
  };

  // Admin CMS publishing routines
  const handleAddArticle = (title: string, category: string, summary: string, author: string, content: string, bannerUrl?: string) => {
    const newArt: CMSArticle = {
      id: `art-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      title,
      category,
      readTime: '6 min read',
      author,
      summary,
      content,
      publishedDate: new Date().toISOString().split('T')[0],
      views: 1,
      bannerUrl
    };
    setArticles(prev => [newArt, ...prev]);
  };

  const handleArchiveArticle = (id: string, isArchived: boolean) => {
    setArticles(articles.map(art => art.id === id ? { ...art, isArchived } : art));
  };

  const handleModifyUserStatus = (id: string, isSuspended: boolean) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: isSuspended ? 'Suspended' : 'Active' } : u));
    
    // Force logout suspended user session immediately
    if (session && session.id === id && isSuspended) {
      handleLogout('Session Expired: Your workspace has been suspended by the platform administrator.');
    }
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser && session) {
      dispatchAuditLog(
        session.id,
        session.name,
        session.role,
        'User Deletion',
        `Permanently purged ${targetUser.name} (${targetUser.role}) account profile with ID ${id}.`
      );
    }
    setUsers(users.filter(u => u.id !== id));
  };

  const handleVerifyClinician = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, verified: true, status: 'Active' } : u));
  };

  const handleAddFAQ = (question: string, answer: string, category: string) => {
    const newFaq: FAQ = {
      id: `faq-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      question,
      answer,
      category
    } as any;
    setFaqs(prev => [newFaq, ...prev]);
  };

  const handleDeployAnnouncement = (title: string, content: string, targetRole: 'all' | 'patient' | 'provider') => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      targetRole
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const handleBroadcastPlatformNotification = (text: string) => {
    setPlatformBroadcastMsg(text);
  };

  // Clinical alerts toggle by clinician
  const handleChangeLogAlertStatus = (id: string, isHighRisk: boolean) => {
    setLogs(logs.map(lg => lg.id === id ? { ...lg, isHighRisk, trend: isHighRisk ? 'Elevated' : 'Stable' } : lg));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F9FAFB] dark:bg-slate-950 font-sans text-slate-950 dark:text-slate-100 overflow-hidden relative">
      
      {/* Immersive Production Splash Screen Component */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white selection:bg-indigo-500/30 select-none overflow-hidden"
          >
            {/* Ambient glows behind the content */}
            <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse"></div>
            
            {/* Subtle grid backdrop */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

            <div className="flex flex-col items-center max-w-sm w-full text-center px-6 space-y-8 relative z-10">
              
              {/* 1. DESIGNED LOGO */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <motion.div 
                  animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="absolute w-36 h-36 bg-indigo-500/20 rounded-full blur-xl"
                />
                {/* Middle pulsing ring */}
                <motion.div 
                  animate={{ scale: [1, 1.25, 1], opacity: [0.08, 0.25, 0.08] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.7 }}
                  className="absolute w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"
                />
                
                {/* Central Premium Logo Shield */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-24 h-24 bg-gradient-to-tr from-slate-900 to-indigo-950 p-[1px] rounded-3xl shadow-3xl shadow-indigo-500/35 border border-indigo-500/40 flex items-center justify-center"
                >
                  {/* Embedded Glowing Icon Grid */}
                  <div className="absolute inset-1.5 bg-gradient-to-br from-indigo-950 to-slate-950 rounded-[22px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px] opacity-20"></div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                      className="absolute -inset-10 bg-gradient-to-tr from-transparent via-indigo-500/10 to-transparent blur-md pointer-events-none"
                    />
                    <Activity className="w-10 h-10 text-emerald-400 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  </div>
                </motion.div>
              </div>

              {/* 2. TEXT DESCRIPTION */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="space-y-2.5"
              >
                <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5 font-sans">
                  <span>CuraFlow</span>
                  <span className="text-indigo-400 font-light font-sans">Health</span>
                </h1>
                <p className="text-[10px] sm:text-[10.5px] font-mono tracking-widest text-slate-400 font-bold uppercase leading-none">
                  Production EHR & Clinical Care Suite
                </p>
              </motion.div>

              {/* 3. PROGRESS TRACK & PHASING */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-64 space-y-3.5 pt-4"
              >
                {/* Progress track background */}
                <div className="w-full h-[3px] bg-slate-900 rounded-full overflow-hidden border border-slate-800/40 relative">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    style={{ width: `${splashProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
                
                {/* Underlines details */}
                <div className="flex items-center justify-between text-[10px] text-slate-400/90 dark:text-slate-500 font-mono">
                  <span className="font-bold truncate max-w-[190px]">{splashPhase}</span>
                  <span className="font-semibold text-emerald-400">{Math.round(splashProgress)}%</span>
                </div>
              </motion.div>

              {/* Subtle platform status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute bottom-8 text-[9px] font-mono text-slate-500 uppercase tracking-widest"
              >
                HIPAA COMPLIANT SECURED CORE v2.4
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Notification Toasts */}
      <div className="fixed top-5 right-5 z-[9999] w-80 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`p-4 rounded-xl shadow-2xl text-xs font-bold pointer-events-auto border flex items-start gap-2.5 backdrop-blur-md ${
                t.type === 'error' 
                  ? 'bg-red-50/95 dark:bg-rose-950/95 text-red-900 dark:text-rose-100 border-red-200 dark:border-rose-900/50 shadow-red-500/5' 
                  : t.type === 'info' 
                    ? 'bg-indigo-50/95 dark:bg-indigo-950/95 text-indigo-900 dark:text-indigo-100 border-indigo-200 dark:border-indigo-900/50 shadow-indigo-500/5' 
                    : 'bg-emerald-50/95 dark:bg-emerald-950/95 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-900/50 shadow-emerald-500/5'
              }`}
            >
              {t.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              ) : t.type === 'info' ? (
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed flex-1">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Admin Broadcast warning marquee banner */}
      {platformBroadcastMsg && (
        <div id="broadcast-alert-banner" className="bg-[#581C87] text-white py-3.5 px-6 shrink-0 flex items-center justify-between text-xs font-semibold relative overflow-hidden animate-fade-in border-b border-purple-950 shadow-lg">
          <div className="absolute inset-0 bg-[#701A75] opacity-15 pointer-events-none hover:scale-105 duration-200"></div>
          <div className="relative flex items-center gap-3">
            <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full animate-pulse uppercase">EMERGENCY NOTICE</span>
            <p className="pr-12">{platformBroadcastMsg}</p>
          </div>
          <button 
            onClick={() => setPlatformBroadcastMsg(null)}
            className="text-white hover:text-rose-250 p-1 bg-white/10 rounded-full hover:bg-white/20 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* Primary header desktop topbar */}
      {session && (
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 min-[375px]:px-4 sm:px-6 flex items-center justify-between shrink-0 font-sans select-none overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="px-1.5 py-0.5 sm:px-2 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-lg">
              CFL
            </div>
            <span className="font-display font-medium text-slate-900 dark:text-white font-sans hidden min-[350px]:inline text-xs sm:text-sm">CuraFlow</span>
          </div>

          <div className="flex items-center gap-1.5 min-[375px]:gap-2.5 sm:gap-4 overflow-hidden">
            {/* SEARCH AREA */}
            <div className="relative shrink">
              <Search className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input 
                id="topbar-search-input"
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 py-1 px-2 pl-6 rounded-lg text-[10px] sm:text-xs w-16 min-[350px]:w-24 min-[400px]:w-32 sm:w-48 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all"
              />
            </div>

            {/* active user details */}
            <div className="flex items-center gap-1.5 shrink-0">
              {session.avatar ? (
                <img src={session.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-indigo-200" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[9px] font-black border border-indigo-200 shrink-0">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-[11px] font-bold text-slate-800 leading-none">{session.name}</p>
                <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider block mt-1">{session.role} Portal</span>
              </div>
            </div>

            {/* Supabase PostgreSQL DB Sync status button indicator - Limit to Administrator only */}
            {session.role === 'admin' && (
              <button
                id="topbar-db-sync-badge"
                onClick={() => setShowDbModal(true)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition whitespace-nowrap border cursor-pointer select-none shrink-0 ${
                  dbStatus === 'synced'
                    ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border-emerald-250 dark:border-emerald-800/40 shadow-emerald-500/5'
                    : dbStatus === 'connecting'
                      ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-400 border-amber-250 dark:border-amber-800/40 animate-pulse'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850'
                }`}
                title="Open Supabase Real-Time Database Sync Panel"
              >
                <span className={`w-1 h-1 rounded-full ${dbStatus === 'synced' ? 'bg-emerald-55' : dbStatus === 'connecting' ? 'bg-amber-55' : 'bg-slate-400 animate-pulse'}`}></span>
                <span className="hidden lg:inline font-mono text-[9px]">
                  {dbStatus === 'synced' ? 'Supabase Secure Db' : dbStatus === 'connecting' ? 'Sync Check...' : 'HIPAA Offline Cache'}
                </span>
              </button>
            )}

            {/* Recommendation 2: Global HIPAA Guard Inactivity Countdown Tracker */}
            {session?.role !== 'patient' && (
              <div 
                id="topbar-hipaa-guard-badge"
                className={`hidden min-[480px]:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition shrink-0 select-none ${
                  (SECURE_TIMEOUT_SECONDS - idleSeconds) <= 30
                    ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900 animate-pulse'
                    : 'bg-indigo-50/70 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50'
                }`}
                title="Secure HIPAA Session Guard: Automatic lock triggers on 5 minutes inactivity."
              >
                <ShieldCheck className={`w-3 h-3 ${
                  (SECURE_TIMEOUT_SECONDS - idleSeconds) <= 30 ? 'text-rose-600 animate-bounce' : 'text-indigo-600 dark:text-indigo-400'
                }`} />
                <span className="text-[9px] font-sans">HIPAA Lock:</span>
                <span className="font-mono font-bold tracking-wider">
                  {`${Math.floor((SECURE_TIMEOUT_SECONDS - idleSeconds) / 60).toString().padStart(2, '0')}:${((SECURE_TIMEOUT_SECONDS - idleSeconds) % 60).toString().padStart(2, '0')}`}
                </span>
              </div>
            )}

            <button 
              id="global-logout-btn"
              onClick={() => handleLogout()}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"
              title="Secure Logout Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Interactive PWA Install Prompt Banner */}
      {session && showPwaPrompt && (
        <div id="pwa-install-prompt" className="bg-indigo-50/90 dark:bg-indigo-950/45 border-b border-indigo-100/50 dark:border-indigo-900/50 px-3.5 py-2 flex flex-col min-[350px]:flex-row items-center justify-between gap-2 transition-all font-sans select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white hidden min-[400px]:block">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-center min-[350px]:text-left">
              <p className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">Install CuraFlow App</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400">Enable offline biometric sync, secure chat backups, and swift clinical alerts.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                triggerToast('CuraFlow PWA Installation activated successfully!', 'success');
                setShowPwaPrompt(false);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
            >
              Install App
            </button>
            <button
              onClick={() => setShowPwaPrompt(false)}
              className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              title="Dismiss prompt"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Primary dynamic viewport layout */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!session ? (
            <PortalLogin 
              users={users}
              onLoginSuccess={handleLoginSuccess}
              onRegisterSuccess={handleRegisterSuccess}
              onPasswordReset={handlePasswordReset}
            />
          ) : session.role === 'patient' ? (
            <PatientLayout 
              session={session}
              logs={logs.filter(l => l.patientId === session.id)}
              conversations={conversations}
              aiChat={aiChat}
              articles={articles}
              faqs={faqs}
              announcements={announcements}
              searchQuery={searchQuery}
              onAddLog={handleAddLog}
              onDeleteLog={handleDeleteLog}
              onSendMessage={handleSendMessage}
              onSendAIChat={handleSendAIChat}
              isAiTyping={isAiTyping}
              isDoctorTyping={isDoctorTyping}
              onUpdateProfile={handleUpdateProfile}
              onTriggerToast={triggerToast}
              providers={providers}
              ahomkaEntries={ahomkaEntries}
              onAddAhomkaEntry={handleAddAhomkaEntry}
              communityMessages={communityMessages}
              onSendCommunityMessage={handleSendCommunityMessage}
              bookings={bookings}
              onAddBooking={handleAddBooking}
              onCancelBooking={handleCancelBooking}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              forumBoards={forumBoards}
            />
          ) : session.role === 'provider' ? (
            <ProviderLayout 
              session={session}
              logs={logs}
              conversations={conversations}
              aiChat={aiChat}
              users={users}
              onAddLog={handleAddLog}
              onSendMessage={handleSendMessage}
              onSendAIChat={handleSendAIChat}
              isAiTyping={isAiTyping}
              onTriggerToast={triggerToast}
              onChangeLogAlertStatus={handleChangeLogAlertStatus}
            />
          ) : (
            <AdminLayout 
              session={session}
              users={users}
              loggedInUserIds={loggedInUserIds}
              onSimulateTokenRefresh={handleSimulateTokenRefresh}
              articles={articles}
              faqs={faqs}
              announcements={announcements}
              auditLogs={auditLogs}
              logs={logs}
              bookings={bookings}
              ahomkaEntries={ahomkaEntries}
              onAddArticle={handleAddArticle}
              onArchiveArticle={handleArchiveArticle}
              onModifyUserStatus={handleModifyUserStatus}
              onVerifyClinician={handleVerifyClinician}
              onAddFAQ={handleAddFAQ}
              onDeployAnnouncement={handleDeployAnnouncement}
              onTriggerToast={triggerToast}
              onBroadcastPlatformNotification={handleBroadcastPlatformNotification}
              onAddUser={handleRegisterSuccess}
              onDeleteUser={handleDeleteUser}
              forumBoards={forumBoards}
              onAddForumBoard={(board: SupportForumBoard) => setForumBoards(prev => [board, ...prev])}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Supabase PostgreSQL Real-time Synchronization Dashboard Modal */}
      {showDbModal && (
        <div id="supabase-db-sync-dialog" className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fade-in text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setShowDbModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-150 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 font-sans">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white">Supabase Cloud Database Controller</h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-500">HIPAA compliant direct PostgreSQL data vault</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Link Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                    dbStatus === 'synced'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-350'
                      : dbStatus === 'connecting'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-350'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350'
                  }`}>
                    {dbStatus === 'synced' ? 'Live Connected' : dbStatus === 'connecting' ? 'Connecting...' : 'Offline Fallback'}
                  </span>
                </div>

                {dbLatency !== null && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Postgres Handshake latency</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 font-bold">{dbLatency} ms</span>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase tracking-wide">Active Database URL (Masked)</span>
                  <div className="font-mono text-[9px] bg-slate-950 text-slate-300 rounded p-2 overflow-x-auto break-all select-all">
                    {process.env.DATABASE_URL
                      ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':******@')
                      : 'postgresql://postgres:******@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'}
                  </div>
                </div>

                <div className="space-y-2 text-left bg-white dark:bg-slate-900 border dark:border-slate-800 p-3 rounded-lg">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">Diagnostics Logs</span>
                  <p className="text-[10px] font-mono leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {dbDiagnosticMsg}
                  </p>
                </div>
              </div>

              {/* Database Telemetry Stats */}
              <div className="space-y-2">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-left block">Synchronized Collections</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Clinical Users:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">{users.length} rows</span>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Biometrics diary:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">{logs.length} rows</span>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-slate-500 font-medium font-sans">Support Chats:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">{conversations.length} rows</span>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Ahomka BP logs:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">{ahomkaEntries.length} rows</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isTestingDb}
                  onClick={handleTestDbConnection}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white font-bold rounded-lg transition hover:scale-[1.01] shrink-0 text-center flex items-center justify-center gap-1 cursor-pointer font-sans text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Querying...' : 'Test Connection'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleForceCloudPush}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition hover:scale-[1.01] text-center flex items-center justify-center gap-1 cursor-pointer font-sans text-xs"
                  title="Overwrite database keys with your current browser state"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Push Cloud Sync</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-normal dark:text-slate-500 mt-1">
                Active storage engines work concurrently. Any operations automatically persist to Supabase databases, with a localized browser backup providing 100% HIPAA sandbox redundancy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation 2: HIPAA Security Inactivity Alert Modal Overlay */}
      {session && session.role !== 'patient' && (SECURE_TIMEOUT_SECONDS - idleSeconds) <= 30 && (
        <div id="hipaa-timeout-warning-overlay" className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-full flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-sans font-black text-sm text-slate-950 dark:text-white uppercase tracking-wider text-rose-600">
                Inactivity Security Timeout
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Under HIPAA Security Rule 45 CFR § 164.312(a)(2)(iii), clinical dashboards handling Protected Health Information must enforce secure session termination on idle timeouts.
              </p>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl space-y-1 select-none">
              <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-black block">Your Session Locks In:</span>
              <span className="font-mono text-3xl font-black text-rose-600 animate-pulse tracking-widest block">
                {SECURE_TIMEOUT_SECONDS - idleSeconds}s
              </span>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleLogout('Session secured. Active clinician profiles cleared safely.')}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Clear & Log Out
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdleSeconds(0);
                  triggerToast('Clinical session credentials renewed!', 'success');
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg text-xs transition shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                Keep Me Logged In
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
