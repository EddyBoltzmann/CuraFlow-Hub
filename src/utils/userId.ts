/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppUser } from '../types';

/**
 * Ensures user IDs are strictly in the range 0001 to 9999 (zero-padded 4-digit strings).
 */
export function formatUserId(id: string | number | undefined, indexFallback: number = 1): string {
  if (!id) {
    const safeNum = Math.min(Math.max(indexFallback, 1), 9999);
    return String(safeNum).padStart(4, '0');
  }

  const str = String(id).trim();

  // If already a valid 4-digit string in range 0001-9999
  if (/^\d{4}$/.test(str)) {
    const num = parseInt(str, 10);
    if (num >= 1 && num <= 9999) {
      return str;
    }
  }

  // Extract all numbers from string
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly) {
    const parsedNum = parseInt(digitsOnly.slice(-4), 10);
    const validNum = ((parsedNum - 1) % 9999) + 1; // 1..9999
    return String(validNum).padStart(4, '0');
  }

  // Hash string into 1..9999
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const mapped = (positiveHash % 9999) + 1;
  return String(mapped).padStart(4, '0');
}

/**
 * Generates the next available unique 4-digit User ID in the range 0001 to 9999.
 */
export function generateUserId(existingUsers: { id?: string }[] = []): string {
  const usedNumbers = new Set<number>();

  existingUsers.forEach((u) => {
    if (u?.id) {
      const num = parseInt(u.id, 10);
      if (!isNaN(num) && num >= 1 && num <= 9999) {
        usedNumbers.add(num);
      }
    }
  });

  // Find lowest available ID starting from 1
  for (let candidate = 1; candidate <= 9999; candidate++) {
    if (!usedNumbers.has(candidate)) {
      return String(candidate).padStart(4, '0');
    }
  }

  // Fallback random in range if all sequential slots are occupied
  const rand = Math.floor(Math.random() * 9999) + 1;
  return String(rand).padStart(4, '0');
}

/**
 * Resolves user full demographic details:
 * User ID (0001-9999), First Name, Last Name, Sex, DOB
 */
export function getUserDemographics(user?: Partial<AppUser> | null) {
  if (!user) {
    return {
      userId: '0001',
      firstName: 'Unknown',
      lastName: 'Patient',
      fullName: 'Unknown Patient',
      sex: 'Female',
      dob: '1990-01-01',
      age: 36,
      phone: 'N/A'
    };
  }

  const rawId = user.userId || user.id;
  const userId = formatUserId(rawId, 1);
  const fullName = (user.name || '').trim() || 'Patient';
  const nameParts = fullName.split(/\s+/);
  
  const firstName = user.firstName?.trim() || nameParts[0] || 'User';
  const lastName = user.lastName?.trim() || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
  
  // Resolve sex/gender accurately from any demographic field provided
  let sex = user.sex || user.gender || (user as any).genderIdentity || (user as any).sex_gender;
  if (!sex || sex.toLowerCase() === 'unspecified' || sex.trim() === '') {
    sex = 'Female'; // Standard default rather than Unspecified
  } else {
    // Standardize title case (e.g., "male" -> "Male", "female" -> "Female")
    const lower = sex.trim().toLowerCase();
    if (lower === 'male' || lower === 'm') sex = 'Male';
    else if (lower === 'female' || lower === 'f') sex = 'Female';
    else if (lower === 'other') sex = 'Other';
    else if (lower.includes('prefer not')) sex = 'Prefer not to say';
  }

  const dob = user.dob || '1990-01-01';
  const phone = user.phone || user.emergencyContactPhone || 'N/A';

  // Calculate age from DOB
  let age = user.age;
  if (dob) {
    const birth = new Date(dob);
    if (!isNaN(birth.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge <= 130) {
        age = calculatedAge;
      }
    }
  }

  return {
    userId,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || fullName,
    sex,
    dob,
    age: age || 36,
    phone
  };
}
