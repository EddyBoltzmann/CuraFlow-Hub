/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HealthLog {
  id: string;
  timestamp: string;
  dateOfReading?: string;
  metric: 'Blood Pressure' | 'Blood Glucose' | 'Active Calories' | 'Sleep Quality' | 'Weight' | 'Heart Rate' | 'BMI';
  value: string;
  trend: 'Stable' | 'Elevated' | 'Decline';
  verifiedBy: string;
  notes?: string;
  isHighRisk?: boolean;
  patientId?: string;
  patientName?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  dob?: string;
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
  id: string; // 4-digit User ID in range 0001 to 9999
  userId?: string; // 4-digit User ID string (0001-9999)
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'patient' | 'provider' | 'admin';
  status: 'Active' | 'Suspended' | 'Pending Verification';
  verified: boolean;
  avatar?: string;
  password?: string;
  isSuperAdmin?: boolean;
  phone?: string;
  dob?: string; // Date of birth (required for all users e.g. YYYY-MM-DD)
  sex?: 'Male' | 'Female' | 'Other' | string;
  city?: string;
  state?: string;
  primaryDiagnosis?: string;
  emergencyContact?: string;
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
  // Socio-demographic fields
  gender?: string;
  age?: number;
  maritalStatus?: string;
  employmentStatus?: string;
  educationLevel?: string;
  preferredLanguage?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
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
  role?: string;
  action: string;
  details: string;
  ip: string;
}

export interface AhomkaEntry {
  id: string;
  timestamp: string;
  dateOfReading?: string;
  mood: number;
  stress: number;
  painLevel: number;
  symptoms: string[];
  notes: string;
  reliefScore: number;
  comfortScore?: number;
  
  // Blood Pressure Step-by-Step Fields helper attributes
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  feeling?: string;
  medicationAdherence?: string;
  readings?: { systolic: number; diastolic: number; pulse: number }[];
  patientId?: string;
  patientName?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  dob?: string;
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
  patientName?: string;
  specialization?: string;
  date?: string;
  timeSlot?: string;
  type?: string;
  notes?: string;
}

export interface SupportForumBoard {
  id: string;
  label: string;
  desc: string;
  createdBy: string;
  createdDate: string;
}
