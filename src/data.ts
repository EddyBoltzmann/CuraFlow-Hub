/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthLog, Conversation, CMSArticle, AppUser, FAQ, Announcement, AuditLog, ProviderInfo, CommunityMessage, AhomkaEntry } from './types';

// Clear out simulated logs for pristine baseline state
export const defaultLogs: HealthLog[] = [];

// Clear out simulated conversations
export const defaultConvs: Conversation[] = [];

// Clear out simulated articles
export const defaultArticles: CMSArticle[] = [];

// Clear out simulated users - App will auto-bootstrap Eddy Boltzmann as admin
export const defaultUsers: AppUser[] = [];

// Clear out simulated library FAQs
export const defaultFAQs: FAQ[] = [];

// Clear out simulated announcements
export const defaultAnnouncements: Announcement[] = [];

// Clear out simulated audit trails
export const defaultAuditLogs: AuditLog[] = [];

// Clear out simulated providers list
export const defaultProviders: ProviderInfo[] = [];

// Clear out simulated community channels
export const defaultCommunityMessages: CommunityMessage[] = [];

// Clear out simulated biometric logs
export const defaultAhomkaEntries: AhomkaEntry[] = [];
