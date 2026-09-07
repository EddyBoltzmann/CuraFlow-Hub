/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppUser } from '../types';
import { formatUserId } from './userId';

export interface CsvParsedUserRow {
  rowNumber: number;
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
  user?: AppUser;
}

export interface CsvParseResult {
  rows: CsvParsedUserRow[];
  validUsers: AppUser[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

/**
 * Robust RFC-4180 compliant CSV text parser.
 * Handles quoted cells with commas, newlines, and escaped double quotes ("").
 * Strips UTF-8 BOM if present.
 */
export function parseCsvText(csvText: string): string[][] {
  // Strip BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          // End of quoted string
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  // Final cell and row if file didn't end with a newline
  currentRow.push(currentCell.trim());
  if (currentRow.some(c => c !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Normalizes a header string for flexible fuzzy matching.
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Maps standard field names to parsed column indices.
 */
function mapHeaderColumns(headerRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};

  headerRow.forEach((col, idx) => {
    const norm = normalizeHeader(col);
    if (!norm) return;

    if (norm === 'firstname' || norm === 'fname' || norm === 'first') {
      map.firstName = idx;
    } else if (norm === 'lastname' || norm === 'lname' || norm === 'last' || norm === 'surname') {
      map.lastName = idx;
    } else if (norm === 'name' || norm === 'fullname' || norm === 'patientname' || norm === 'username') {
      map.name = idx;
    } else if (norm === 'email' || norm === 'emailaddress' || norm === 'mail') {
      map.email = idx;
    } else if (norm === 'role' || norm === 'userrole' || norm === 'accounttype' || norm === 'type') {
      map.role = idx;
    } else if (norm === 'sex' || norm === 'gender' || norm === 'biologicalsex') {
      map.sex = idx;
    } else if (norm === 'dob' || norm === 'dateofbirth' || norm === 'birthdate' || norm === 'birthday') {
      map.dob = idx;
    } else if (norm === 'phone' || norm === 'telephone' || norm === 'tel' || norm === 'phonenumber' || norm === 'mobile') {
      map.phone = idx;
    } else if (norm === 'password' || norm === 'temppassword' || norm === 'temporarypassword' || norm === 'pass') {
      map.password = idx;
    } else if (norm === 'id' || norm === 'userid' || norm === 'customid' || norm === 'patientid' || norm === 'customuserid') {
      map.id = idx;
    } else if (norm === 'maritalstatus' || norm === 'marital') {
      map.maritalStatus = idx;
    } else if (norm === 'employmentstatus' || norm === 'employment') {
      map.employmentStatus = idx;
    } else if (norm === 'educationlevel' || norm === 'education') {
      map.educationLevel = idx;
    } else if (norm === 'preferredlanguage' || norm === 'language') {
      map.preferredLanguage = idx;
    } else if (norm === 'address' || norm === 'street' || norm === 'streetaddress' || norm === 'addressstreet') {
      map.street = idx;
    } else if (norm === 'city' || norm === 'addresscity') {
      map.city = idx;
    } else if (norm === 'state' || norm === 'region' || norm === 'addressstate') {
      map.state = idx;
    } else if (norm === 'zip' || norm === 'zipcode' || norm === 'postalcode' || norm === 'addresszip') {
      map.zip = idx;
    } else if (norm === 'emergencycontactphone' || norm === 'emergencyphone') {
      map.emergencyPhone = idx;
    }
  });

  return map;
}

/**
 * Calculates age from date of birth string.
 */
function calculateAgeFromDob(dobStr?: string): number {
  if (!dobStr) return 38;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return 38;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 && age <= 130 ? age : 38;
}

/**
 * Allocates next available 4-digit User ID strictly in range 0001 to 9999,
 * taking into account both existing users and batch-assigned IDs.
 */
function allocateNextUserId(assignedSet: Set<string>): string {
  const usedNumbers = new Set<number>();
  assignedSet.forEach(id => {
    const num = parseInt(id, 10);
    if (!isNaN(num) && num >= 1 && num <= 9999) {
      usedNumbers.add(num);
    }
  });

  for (let candidate = 1; candidate <= 9999; candidate++) {
    if (!usedNumbers.has(candidate)) {
      const formatted = String(candidate).padStart(4, '0');
      assignedSet.add(formatted);
      return formatted;
    }
  }

  // Fallback random
  const rand = Math.floor(Math.random() * 9999) + 1;
  const randStr = String(rand).padStart(4, '0');
  assignedSet.add(randStr);
  return randStr;
}

/**
 * Validates CSV text and converts rows into complete AppUser objects.
 */
export function validateAndBuildUsersFromCsv(
  csvText: string,
  existingUsers: AppUser[] = []
): CsvParseResult {
  const parsedGrid = parseCsvText(csvText);
  if (parsedGrid.length === 0) {
    return {
      rows: [],
      validUsers: [],
      totalRows: 0,
      validCount: 0,
      errorCount: 0
    };
  }

  const headerRow = parsedGrid[0];
  const dataRows = parsedGrid.slice(1);
  const colMap = mapHeaderColumns(headerRow);

  // Set of existing emails in lowercase
  const existingEmails = new Set<string>();
  existingUsers.forEach(u => {
    if (u.email) existingEmails.add(u.email.trim().toLowerCase());
  });

  // Track emails within this batch to prevent internal duplicates
  const batchEmails = new Set<string>();

  // Track assigned IDs
  const assignedIds = new Set<string>();
  existingUsers.forEach(u => {
    if (u.id) assignedIds.add(formatUserId(u.id));
  });

  const parsedRows: CsvParsedUserRow[] = [];
  const validUsers: AppUser[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  dataRows.forEach((row, rowIdx) => {
    // Skip empty rows
    if (row.every(cell => !cell.trim())) {
      return;
    }

    const rowNum = rowIdx + 2; // 1-indexed, header is line 1
    const errors: string[] = [];

    // Extract raw dictionary
    const raw: Record<string, string> = {};
    headerRow.forEach((h, cIdx) => {
      raw[h] = row[cIdx] || '';
    });

    const getVal = (key?: number) => (key !== undefined && row[key] !== undefined ? row[key].trim() : '');

    // Name resolution
    const fName = getVal(colMap.firstName);
    const lName = getVal(colMap.lastName);
    let fullName = getVal(colMap.name);

    if (!fullName && (fName || lName)) {
      fullName = `${fName} ${lName}`.trim();
    } else if (fullName && !fName && !lName) {
      // Split full name
      const parts = fullName.split(' ').filter(Boolean);
      // fName and lName can be derived
    }

    if (!fullName) {
      errors.push('Missing Name: either First & Last Name or Full Name is required.');
    }

    // Email resolution & validation
    const email = getVal(colMap.email).toLowerCase();
    if (!email) {
      errors.push('Missing Email Address.');
    } else if (!emailRegex.test(email)) {
      errors.push(`Invalid Email Format: "${email}".`);
    } else if (existingEmails.has(email)) {
      errors.push(`Email already registered in system: "${email}".`);
    } else if (batchEmails.has(email)) {
      errors.push(`Duplicate Email in this CSV: "${email}".`);
    } else {
      batchEmails.add(email);
    }

    // Role resolution
    const rawRole = getVal(colMap.role).toLowerCase();
    let role: 'patient' | 'provider' | 'admin' = 'patient';
    if (rawRole) {
      if (rawRole.includes('doc') || rawRole.includes('prov') || rawRole.includes('physician') || rawRole.includes('clinician')) {
        role = 'provider';
      } else if (rawRole.includes('admin') || rawRole.includes('manager')) {
        role = 'admin';
      } else if (rawRole.includes('pat') || rawRole.includes('client') || rawRole.includes('user')) {
        role = 'patient';
      } else {
        errors.push(`Invalid Role "${rawRole}": must be "patient", "provider", or "admin".`);
      }
    }

    // ID allocation
    const customId = getVal(colMap.id);
    let finalId: string;
    if (customId) {
      const formatted = formatUserId(customId);
      if (assignedIds.has(formatted)) {
        errors.push(`Custom User ID #${formatted} is already in use.`);
        finalId = allocateNextUserId(assignedIds);
      } else {
        finalId = formatted;
        assignedIds.add(finalId);
      }
    } else {
      finalId = allocateNextUserId(assignedIds);
    }

    // DOB & Age
    const rawDob = getVal(colMap.dob);
    let dob = '1986-05-14';
    if (rawDob) {
      const parsedDate = new Date(rawDob);
      if (!isNaN(parsedDate.getTime())) {
        dob = parsedDate.toISOString().slice(0, 10);
      } else {
        // Try simple regex YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
          dob = rawDob;
        }
      }
    }
    const age = calculateAgeFromDob(dob);

    // Biological sex / gender
    const rawSex = getVal(colMap.sex);
    let sex: 'Male' | 'Female' | 'Other' = 'Female';
    if (rawSex) {
      const s = rawSex.toLowerCase();
      if (s.startsWith('m')) sex = 'Male';
      else if (s.startsWith('f')) sex = 'Female';
      else sex = 'Other';
    }

    // Phone
    const phone = getVal(colMap.phone) || getVal(colMap.emergencyPhone) || undefined;

    // Password
    const password = getVal(colMap.password) || 'Ghana_Ahomka_26';

    // Socio-demographic extras
    const maritalStatus = getVal(colMap.maritalStatus) || 'Married';
    const employmentStatus = getVal(colMap.employmentStatus) || 'Employed';
    const educationLevel = getVal(colMap.educationLevel) || 'Tertiary Degree';
    const preferredLanguage = getVal(colMap.preferredLanguage) || 'English';
    const addressStreet = getVal(colMap.street) || '15 Giffard Road';
    const addressCity = getVal(colMap.city) || 'Cantonments';
    const addressState = getVal(colMap.state) || 'Greater Accra';
    const addressZip = getVal(colMap.zip) || '00233';

    // Derived first and last name
    let finalFirstName = fName;
    let finalLastName = lName;
    if (!finalFirstName && fullName) {
      finalFirstName = fullName.split(' ')[0] || 'User';
      finalLastName = fullName.split(' ').slice(1).join(' ') || '';
    }

    const isValid = errors.length === 0;

    let userObj: AppUser | undefined;
    if (isValid) {
      userObj = {
        id: finalId,
        userId: finalId,
        name: fullName,
        firstName: finalFirstName,
        lastName: finalLastName,
        email: email,
        role: role,
        status: 'Active',
        verified: true,
        password: password,
        sex: sex,
        gender: sex,
        dob: dob,
        age: age,
        phone: phone,
        emergencyContactPhone: phone || '',
        maritalStatus: maritalStatus,
        employmentStatus: employmentStatus,
        educationLevel: educationLevel,
        preferredLanguage: preferredLanguage,
        addressStreet: addressStreet,
        addressCity: addressCity,
        addressState: addressState,
        addressZip: addressZip,
        primaryDiagnosis: role === 'patient' ? 'Primary Stage 1 Essential Hypertension' : undefined
      };
      validUsers.push(userObj);
    }

    parsedRows.push({
      rowNumber: rowNum,
      raw,
      isValid,
      errors,
      user: userObj
    });
  });

  return {
    rows: parsedRows,
    validUsers,
    totalRows: parsedRows.length,
    validCount: validUsers.length,
    errorCount: parsedRows.length - validUsers.length
  };
}

/**
 * Generates a clean, ready-to-fill sample CSV string with headers and realistic dummy data.
 */
export function generateSampleCsvTemplate(): string {
  const headers = [
    'First Name',
    'Last Name',
    'Email Address',
    'Role',
    'Biological Sex',
    'Date of Birth',
    'Phone',
    'Temporary Password',
    'Custom User ID',
    'Marital Status',
    'Employment Status',
    'Preferred Language',
    'Street Address',
    'City',
    'State / Region',
    'Zip Code'
  ];

  const sampleRows = [
    [
      'Kwame',
      'Mensah',
      'kwame.mensah@example.com',
      'patient',
      'Male',
      '1985-04-12',
      '+233 24 123 4567',
      'PatientSecure2026!',
      '1501',
      'Married',
      'Employed',
      'English',
      '24 Castle Road',
      'Osu',
      'Greater Accra',
      '00233'
    ],
    [
      'Dr. Abena',
      'Osei',
      'dr.abena.osei@hospital.org',
      'provider',
      'Female',
      '1979-11-03',
      '+233 20 987 6543',
      'DoctorAuth_2026',
      '1502',
      'Married',
      'Employed',
      'English',
      'Korle Bu Teaching Hospital',
      'Accra',
      'Greater Accra',
      '00233'
    ],
    [
      'Akosua',
      'Agyemang',
      'akosua.agyemang@example.com',
      'patient',
      'Female',
      '1992-09-25',
      '+233 50 555 1212',
      'AkosuaAhomka99',
      '1503',
      'Single',
      'Self-Employed',
      'Twi',
      '88 Ring Road Central',
      'Adabraka',
      'Greater Accra',
      '00233'
    ]
  ];

  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...sampleRows.map(row => row.map(escapeCsv).join(','))
  ];

  return csvLines.join('\r\n');
}
