/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HealthLog {
  id: string;
  timestamp: string;
  metric: 'Blood Pressure' | 'Blood Glucose' | 'Active Calories' | 'Sleep Quality' | 'Weight' | 'Heart Rate' | 'BMI';
  value: string;
  trend: 'Stable' | 'Elevated' | 'Decline';
  verifiedBy: string;
  notes?: string;
  isHighRisk?: boolean;
  patientId?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'doctor' | 'admin' | 'system';
  senderName: string;
  content: string;
  time: string;
  attachmentType?: 'image' | 'file' | 'audio';
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface Conversation {
  id: string;
  patientId?: string;
  name: string;
  specialty: string;
  avatar: string;
  online: boolean;
  messages: Message[];
  unread: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CMSArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  author: string;
  summary: string;
  content: string;
  publishedDate: string;
  views: number;
  bannerUrl?: string;
  isArchived?: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'provider' | 'admin';
  status: 'Active' | 'Suspended' | 'Pending Verification';
  verified: boolean;
  avatar?: string;
  password?: string;
  isSuperAdmin?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceProvider?: string;
  insuranceMemberId?: string;
  insuranceGroupId?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetRole: 'all' | 'patient' | 'provider';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ip: string;
}

export interface AhomkaEntry {
  id: string;
  timestamp: string;
  mood: number;
  stress: number;
  painLevel: number;
  symptoms: string[];
  notes: string;
  reliefScore: number;
  
  // Blood Pressure Step-by-Step Fields helper attributes
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  feeling?: string;
  medicationAdherence?: string;
  readings?: { systolic: number; diastolic: number; pulse: number }[];
  patientId?: string;
}

export interface CommunityMessage {
  id: string;
  channel: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  location: string;
  rating: number;
  hospital: string;
  fee: string;
  slots: string[];
}

export interface AppointmentBooking {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  specialty: string;
  mode: 'Video Call' | 'Audio Call' | 'Secure Chat';
  dateTime: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}
