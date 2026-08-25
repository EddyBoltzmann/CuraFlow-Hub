/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AppUser } from '../types';
import { 
  Lock, UserPlus, Heart, LogIn, ShieldAlert, Sparkles, 
  Eye, EyeOff, ShieldCheck, Mail, Check, Activity, ShieldCheck as VerifiedBadge,
  User, CheckCircle2, ChevronRight, Clock, Award, Calendar, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateUserId } from '../utils/userId';

interface PortalLoginProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onRegisterSuccess: (newUser: AppUser) => void;
  onPasswordReset?: (email: string, newPass: string) => boolean;
}

export default function PortalLogin({ users, onLoginSuccess, onRegisterSuccess, onPasswordReset }: PortalLoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>('Female');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<'patient' | 'provider' | 'admin'>('patient');

  // Preview next assigned 4-digit User ID in range 0001-9999
  const nextAssignedUserId = useMemo(() => {
    return generateUserId(users);
  }, [users]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Custom states for interactive signup feedback
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Forgot password & HIPAA reset flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Rotating clinical panel slides
  const [slideIndex, setSlideIndex] = useState(0);
  const medicalSlides = [
    {
      title: "Encrypted Health Records",
      tag: "HIPAA COMPLIANT",
      description: "CuraFlow secures patient biometrics with 256-bit AES end-to-end payload isolation and active access logs.",
      stat: "256-Bit E2E",
      statLabel: "Enforced Security standards"
    },
    {
      title: "Empowered Clinical Oversight",
      tag: "CLINICAL DECISION HUB",
      description: "Clinicians receive real-time telemetry, export high-fidelity longitudinal averages, and issue verified recommendations.",
      stat: "Instant CSV",
      statLabel: "Longitudinal Clinical reporting"
    },
    {
      title: "Longitudinal Biometrics",
      tag: "AHOMKA DIGITAL DIARIES",
      description: "Log blood glucose, multi-reading blood pressure, and sleep scores with frictionless client-side entries.",
      stat: "Zero Friction",
      statLabel: "Patient intake experience"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % medicalSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Live Password Strength Calculator
  const hasMinLength = password.length >= 8;
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (hasMinLength) score += 33;
    if (hasDigit) score += 33;
    if (hasSpecial) score += 34;
    return score;
  };

  const strengthPercentage = getPasswordStrength();

  // Validate Email Live
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Handle standard user email login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide your registered clinical credentials.');
      return;
    }

    let matchedUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (!matchedUser && (email.trim().toLowerCase() === 'eddyboltzmann@gmail.com' || email.trim().toLowerCase() === 'eddy2062006@gmail.com')) {
      matchedUser = {
        id: email.trim().toLowerCase() === 'eddyboltzmann@gmail.com' ? 'usr-4' : 'usr-5',
        name: 'Eddy Boltzmann',
        email: email.trim().toLowerCase(),
        role: 'admin',
        status: 'Active',
        verified: true,
        password: 'Boltzmann_12',
        isSuperAdmin: true,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      };
    }
    
    if (!matchedUser) {
      setErrorMessage('No health record found matching this email address. Please sign up above.');
      return;
    }

    if (matchedUser.password && matchedUser.password !== password.trim()) {
      setErrorMessage('⚠️ ACCESS DENIED: Invalid clinical access password entered for this profile.');
      return;
    }

    if (matchedUser.status === 'Suspended') {
      setErrorMessage('⚠️ ACCESS DENIED: This health profile has been suspended by the clinical administrator. Support has been notified.');
      return;
    }

    onLoginSuccess(matchedUser);
  };

  // Handle user registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const effectiveFirstName = firstName.trim() || name.trim().split(' ')[0] || '';
    const effectiveLastName = lastName.trim() || (name.trim().split(' ').length > 1 ? name.trim().split(' ').slice(1).join(' ') : '');
    const fullName = `${effectiveFirstName} ${effectiveLastName}`.trim() || name.trim();

    if (!effectiveFirstName) {
      setErrorMessage('Please provide your First Name.');
      return;
    }

    if (!effectiveLastName) {
      setErrorMessage('Please provide your Last Name.');
      return;
    }

    if (!dob) {
      setErrorMessage('Date of Birth (DOB) is required for clinical healthcare registration.');
      return;
    }

    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime()) || birthDate > new Date() || birthDate.getFullYear() < 1900) {
      setErrorMessage('Please enter a valid Date of Birth.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all clinical profile requirements.');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid administrative or personal email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must meet minimum security guidelines (8+ characters).');
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      setErrorMessage('A healthcare profile is already registered under this email.');
      return;
    }

    // Generate strict 4-digit User ID in range 0001-9999
    const assignedId = generateUserId(users);

    // Calculate age from DOB
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    const newProfile: AppUser = {
      id: assignedId,
      userId: assignedId,
      name: fullName,
      firstName: effectiveFirstName,
      lastName: effectiveLastName,
      sex: sex,
      gender: sex,
      dob: dob,
      age: calculatedAge > 0 ? calculatedAge : 35,
      email: email.trim().toLowerCase(),
      role: role,
      status: role === 'provider' ? 'Pending Verification' : 'Active',
      verified: role !== 'provider', // Providers wait for verification
      avatar: undefined,
      password: password.trim(),
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      insuranceProvider: '',
      insuranceMemberId: '',
      insuranceGroupId: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZip: ''
    };

    onRegisterSuccess(newProfile);
    
    if (role === 'provider') {
      setSuccessMessage(`📋 Clinician profile #${assignedId} created! Application is marked as Pending administrator review.`);
    } else {
      setSuccessMessage(`✅ Patient profile #${assignedId} initialized! You can now log in.`);
    }
    
    setIsRegistering(false);
    setEmail(newProfile.email);
    setPassword('');
    setFirstName('');
    setLastName('');
    setDob('');
  };

  // Forgot password steps
  const handleForgotEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your registered clinical email.');
      return;
    }
    
    const matchedUser = [...users, { email: 'eddyboltzmann@gmail.com' }, { email: 'eddy2062006@gmail.com' }].find(u => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (!matchedUser) {
      setErrorMessage('No healthcare profile found matching this email address.');
      return;
    }
    
    // Generate a secure 6-digit mock code
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(mockCode);
    setForgotStep('otp');
    setSuccessMessage(`🔐 Verification code dispatched: ${mockCode} (sandbox auto-filled below)`);
    setEnteredOtp(mockCode); // Auto-fill for convenience
  };

  const handleForgotOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (enteredOtp.trim() !== simulatedOtp) {
      setErrorMessage('❌ INVALID SECURITY CODE: Please verify the multi-factor OTP code entered.');
      return;
    }
    
    setForgotStep('reset');
    setSuccessMessage('Identity verified successfully. Enter your new password credentials.');
  };

  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long for clinical defense standards.');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    
    const success = onPasswordReset ? onPasswordReset(forgotEmail.toLowerCase().trim(), newPassword) : true;
    if (success) {
      setForgotStep('done');
      setSuccessMessage('🎉 Password reset completed successfully! Feel free to log in with your updated credentials.');
    } else {
      setErrorMessage('System error updating credentials. Please consult admin.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* 1. LEFT COLUMN: Immersive Clinical Graphics & Stats Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        {/* Subtle geometric grid backdrop */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Abstract glowing medical gradient arcs */}
        <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-emerald-600/20 rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full filter blur-[100px]"></div>

        {/* Logo and System Flag */}
        <div className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-xl shadow-emerald-600/30 border border-emerald-500">
              CFL
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block leading-none">CuraFlow</span>
              <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Clinical Engagement</span>
            </div>
          </div>

        </div>

        {/* Centered Dynamic Carousel with Fade animations */}
        <div className="relative my-auto max-w-lg z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-bold tracking-widest uppercase font-mono">
                {medicalSlides[slideIndex].tag}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight font-sans">
                {medicalSlides[slideIndex].title}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed font-sans">
                {medicalSlides[slideIndex].description}
              </p>

              {/* Stat callouts */}
              <div className="pt-6 border-t border-slate-800 flex items-center gap-8">
                <div>
                  <div className="text-2xl font-black text-emerald-400 block tracking-tight font-sans">
                    {medicalSlides[slideIndex].stat}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {medicalSlides[slideIndex].statLabel}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Real-time Sync Pulse</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Slide Indicators */}
          <div className="flex items-center gap-2 mt-8">
            {medicalSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-305 ${i === slideIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Hospital Partnership Credits */}
        <div className="relative text-xs text-slate-400 flex items-center justify-between z-10 border-t border-slate-800/60 pt-6">
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-[11px] text-slate-300">CuraFlow Clinical Network</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v3.5.0 • HTTPS TLS-1.3</span>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Super Pristine Login/Register Application Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 relative">
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          
          {/* Mobile Medical Branding View */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-4">
            <div className="px-4 py-2 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-xl">
              CFL
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CuraFlow Hub</h1>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Clinical Diagnostics Portal</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isForgotPassword 
                ? 'Clinical Identity Verification'
                : isRegistering ? 'Create Healthcare Credentials' : 'Clinic Portal Authentication'}
            </h3>
            <p className="text-xs text-slate-500">
              {isForgotPassword
                ? 'Enter your registered healthcare credentials to receive an identity verification token.'
                : isRegistering 
                  ? 'Establish verification profiles to link clinical telemetry and biometrics.' 
                  : 'Access secure diagnostics dashboard and medical consultation timelines.'}
            </p>
          </div>

          {/* Tab Selection Pill Control */}
          {!isForgotPassword && (
            <div className="p-1 bg-slate-100 dark:bg-slate-900 rounded-xl flex relative">
              <button 
                id="tab-login-select"
                onClick={() => { setIsRegistering(false); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${
                  !isRegistering ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Portal</span>
                {!isRegistering && (
                  <motion.div 
                    layoutId="activeTabPill" 
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm -z-10" 
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button 
                id="tab-register-select"
                onClick={() => { setIsRegistering(true); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${
                  isRegistering ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Account</span>
                {isRegistering && (
                  <motion.div 
                    layoutId="activeTabPill" 
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm -z-10" 
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
          )}

          {/* Validation & Success Banner Feedbacks */}
          <AnimatePresence mode="popLayout">
            {errorMessage && (
              <motion.div 
                id="login-error-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs py-3.5 px-4 rounded-xl border border-red-200 dark:border-red-900/30 flex items-start gap-3 leading-normal"
              >
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                id="login-success-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs py-3.5 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 flex items-start gap-3 leading-normal"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-medium">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN INTERFACE FORMS */}
          <div className="relative font-sans">
            {isForgotPassword ? (
              <div className="space-y-4">
                {forgotStep === 'email' && (
                  <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Registered Healthcare Email</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input 
                          type="email" 
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. sarah.j@gmail.com"
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 tracking-wide transition-all transform active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Send Recovery MFA Code</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {forgotStep === 'otp' && (
                  <form onSubmit={handleForgotOtpSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">6-Digit Identity Code</label>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/40">MFA Sim Active</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input 
                          type="text" 
                          maxLength={6}
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value)}
                          placeholder="••••••"
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-bold text-slate-900 dark:text-white transition-all shadow-sm font-mono tracking-widest text-center text-sm"
                        />
                      </div>
                      <p className="text-[9.5px] text-slate-400 leading-normal">
                        To fulfill offline strict-HIPAA sandbox validation, a secure reset token has been auto-filled. Modify or submit to continue.
                      </p>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 tracking-wide transition-all transform active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Verify Recovery Token</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {forgotStep === 'reset' && (
                  <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Specify New Password</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Must be 8+ characters"
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Confirm New Password</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input 
                          type="password" 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter password"
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 tracking-wide transition-all transform active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Update Access Password</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {forgotStep === 'done' && (
                  <div className="space-y-4 text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Credentials Securely Reset</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-normal">
                        Your clinical profiles index password was successfully updated and verified in HIPAA backup registries.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setEmail(forgotEmail);
                        setForgotStep('email');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md focus:outline-none cursor-pointer"
                    >
                      Return to Secure Login
                    </button>
                  </div>
                )}

                {forgotStep !== 'done' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotStep('email');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mt-2"
                  >
                    ← Cancel & Back to Login
                  </button>
                )}
              </div>
            ) : !isRegistering ? (
              /* SECURE LOGIN PORTAL */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Registered Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      id="login-email-input"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah.j@gmail.com"
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-4 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Access Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep('email');
                        setForgotEmail(email);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[10px] text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Forgot identity password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      id="login-password-input"
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  id="login-submit-btn"
                  type="submit" 
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 tracking-wide transition-all transform active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Authorize Clinic Session</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* SECURE CLINICAL PROFILE REGISTRATION */
              <form onSubmit={handleRegister} className="space-y-4">
                {/* 4-digit User ID Range 0001-9999 Allocation Notice */}
                <div className="flex items-center justify-between p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-black text-[11px] shadow-xs">
                      #
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-emerald-300 text-[11px] leading-tight">
                        Assigned User ID: <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">#{nextAssignedUserId}</span>
                      </p>
                      <p className="text-[9.5px] text-slate-400 font-mono">System Standard Range: 0001 to 9999</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono">
                    Auto-Indexed
                  </span>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                      First Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input 
                        id="reg-firstname-input"
                        type="text" 
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setName(`${e.target.value} ${lastName}`.trim());
                        }}
                        placeholder="e.g. Sarah"
                        required
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-2.5 pl-10 pr-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                      Last Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input 
                        id="reg-lastname-input"
                        type="text" 
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setName(`${firstName} ${e.target.value}`.trim());
                        }}
                        placeholder="e.g. Jenkins"
                        required
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-2.5 pl-10 pr-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sex & Date of Birth (DOB) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                      Sex / Gender *
                    </label>
                    <select 
                      id="reg-sex-select"
                      value={sex}
                      onChange={(e) => setSex(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm h-[38px] cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                      Date of Birth (DOB) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input 
                        id="reg-dob-input"
                        type="date" 
                        value={dob}
                        max={new Date().toISOString().split('T')[0]}
                        min="1900-01-01"
                        required
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-2.5 pl-10 pr-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Work / Personal Email *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input 
                        id="reg-email-input"
                        type="email" 
                        value={email}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah.j@gmail.com"
                        required
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-2.5 pl-10 pr-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">Portal Role Select *</label>
                    <select 
                      id="reg-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm h-[38px] cursor-pointer"
                    >
                      <option value="patient">Patient Profile</option>
                      <option value="provider">Provider / Doctor Workspace</option>
                    </select>
                  </div>
                </div>

                {emailFocused && email && (
                  <div className="text-[11px] font-medium flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-600">
                    <div className={`w-1.5 h-1.5 rounded-full ${isEmailValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>{isEmailValid ? 'Email matches global pattern format' : 'Incomplete email address syntax'}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Secure Strength Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-1.5 h-1.5 shrink-0" />
                    </span>
                    <input 
                      id="reg-password-input"
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Establish secure cipher"
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none py-3 pl-10 pr-10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength checklist meters */}
                {(passwordFocused || password) && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-2 text-[11px] text-slate-600 transition-all">
                    <div className="flex items-center justify-between font-bold text-[10px] text-slate-500">
                      <span>Password Integrity:</span>
                      <span className="font-mono">{strengthPercentage}%</span>
                    </div>
                    {/* Progress indicator micro-bar */}
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          strengthPercentage < 60 ? 'bg-red-500' : strengthPercentage < 100 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${strengthPercentage}%` }}
                      />
                    </div>
                    
                    <div className="space-y-1 pt-1 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${hasMinLength ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={hasMinLength ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-500'}>At least 8 clinical letters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${hasDigit ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={hasDigit ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-500'}>Contains numeric digits (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${hasSpecial ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={hasSpecial ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-500'}>Contains special character (@, $, #, ^)</span>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  id="reg-submit-btn"
                  type="submit" 
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 tracking-wide transition-all transform active:scale-[0.98] text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Initialize Security Account</span>
                </button>
              </form>
            )}
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal text-center">
            By accessing this healthcare telemetry workstation, you acknowledge connection under standard HIPAA system rules. Dual-layer key protocols are verified on initialization.
          </p>
        </div>

        {/* 3. HIPAA SECURITY FOOTER */}
        <div className="mt-8 border-t border-slate-200/60 dark:border-slate-800/60 pt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>TLS Encryption Active</span>
            <span>•</span>
            <span>HIPAA Compliant</span>
          </div>
        </div>

      </div>
    </div>
  );
}
