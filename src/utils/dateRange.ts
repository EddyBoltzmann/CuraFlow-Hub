/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExportMonthPreset = 
  | 'all' 
  | 'current' 
  | 'last_month' 
  | 'last_3_months' 
  | 'last_6_months' 
  | 'last_12_months' 
  | 'custom';

/**
 * Resolves a date string or entry ID to a normalized Year-Month string in 'YYYY-MM' format.
 */
export function getRecordYearMonth(dateStr?: string | null, entryId?: string | null): string | null {
  if (dateStr) {
    const trimmed = String(dateStr).trim();
    if (!trimmed || trimmed === 'N/A' || trimmed === 'No readings logged') {
      // Fall through to entryId
    } else if (/today/i.test(trimmed)) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Check for ISO or standard YYYY-MM-DD (e.g. 2026-08-28 or 2026/08/28)
      const yyyyMm = trimmed.match(/^(\d{4})[-/](\d{1,2})/);
      if (yyyyMm) {
        const year = yyyyMm[1];
        const month = String(parseInt(yyyyMm[2], 10)).padStart(2, '0');
        return `${year}-${month}`;
      }

      // Check for MM/DD/YYYY or M/D/YYYY (e.g. 8/28/2026)
      const mdy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (mdy) {
        const month = String(parseInt(mdy[1], 10)).padStart(2, '0');
        const year = mdy[3];
        return `${year}-${month}`;
      }

      // Check for textual dates (e.g., 28 Aug 2026, August 28, 2026, or locale string)
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }
    }
  }

  // Fallback from timestamp in ID if present (e.g., e-1724838491000 or log-1724838491000)
  if (entryId) {
    const idMatch = String(entryId).match(/^[a-z]+-(\d{10,13})/i);
    if (idMatch) {
      let ms = parseInt(idMatch[1], 10);
      if (ms < 10000000000) ms *= 1000; // Convert sec to ms if 10-digit
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }
  }

  return null;
}

/**
 * Checks whether a given record date falls within the designated [startMonth, endMonth] inclusive range.
 * Both startMonth and endMonth should be in 'YYYY-MM' format. If either is omitted, it acts as an open boundary.
 */
export function isRecordInMonthRange(
  dateStr?: string | null,
  entryId?: string | null,
  startMonth?: string | null,
  endMonth?: string | null
): boolean {
  // If neither boundary is set, everything passes
  if (!startMonth && !endMonth) return true;

  let effectiveStart = startMonth ? startMonth.trim() : '';
  let effectiveEnd = endMonth ? endMonth.trim() : '';

  // If both boundaries are present and inverted, normalize them
  if (effectiveStart && effectiveEnd && effectiveStart > effectiveEnd) {
    const temp = effectiveStart;
    effectiveStart = effectiveEnd;
    effectiveEnd = temp;
  }

  const ym = getRecordYearMonth(dateStr, entryId);
  // If date cannot be parsed, include by default to avoid accidental data loss
  if (!ym) return true;

  if (effectiveStart && ym < effectiveStart) return false;
  if (effectiveEnd && ym > effectiveEnd) return false;
  return true;
}

/**
 * Calculates startMonth and endMonth ('YYYY-MM') for standard month presets.
 */
export function getMonthPresetRange(
  preset: ExportMonthPreset, 
  refDate: Date = new Date()
): { startMonth: string; endMonth: string } {
  const formatYM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const currentYM = formatYM(refDate);

  switch (preset) {
    case 'all':
      return { startMonth: '', endMonth: '' };
    case 'current':
      return { startMonth: currentYM, endMonth: currentYM };
    case 'last_month': {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
      const prevYM = formatYM(d);
      return { startMonth: prevYM, endMonth: prevYM };
    }
    case 'last_3_months': {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - 2, 1);
      return { startMonth: formatYM(d), endMonth: currentYM };
    }
    case 'last_6_months': {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - 5, 1);
      return { startMonth: formatYM(d), endMonth: currentYM };
    }
    case 'last_12_months': {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - 11, 1);
      return { startMonth: formatYM(d), endMonth: currentYM };
    }
    case 'custom':
    default:
      return { startMonth: '', endMonth: '' };
  }
}

/**
 * Formats a 'YYYY-MM' string into a friendly month label (e.g. "August 2026").
 */
export function formatMonthName(ym?: string | null): string {
  if (!ym) return '';
  const [yearStr, monthStr] = ym.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return ym;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Formats a short month label (e.g. "Aug 2026").
 */
export function formatMonthShort(ym?: string | null): string {
  if (!ym) return '';
  const [yearStr, monthStr] = ym.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return ym;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Generates a human-friendly range description (e.g. "June 2026 – August 2026").
 */
export function formatMonthRangeLabel(startMonth?: string | null, endMonth?: string | null): string {
  if (!startMonth && !endMonth) return 'All Recorded History (All Months)';
  if (startMonth && endMonth) {
    if (startMonth === endMonth) {
      return formatMonthName(startMonth);
    }
    return `${formatMonthName(startMonth)} – ${formatMonthName(endMonth)}`;
  }
  if (startMonth) return `From ${formatMonthName(startMonth)} onwards`;
  if (endMonth) return `Up to ${formatMonthName(endMonth)}`;
  return 'All Recorded History';
}

/**
 * Generates a filename-safe slug for the month range (e.g. "2026-06_to_2026-08").
 */
export function getMonthRangeSlug(startMonth?: string | null, endMonth?: string | null): string {
  if (!startMonth && !endMonth) return 'all_months';
  if (startMonth && endMonth) {
    if (startMonth === endMonth) return startMonth;
    return `${startMonth}_to_${endMonth}`;
  }
  if (startMonth) return `from_${startMonth}`;
  if (endMonth) return `up_to_${endMonth}`;
  return 'all_months';
}

/**
 * Scans a list of entries and extracts distinct sorted Year-Month strings present in the dataset.
 */
export function extractDistinctMonths(
  entries: Array<{ dateOfReading?: string | null; timestamp?: string | null; id?: string | null }>
): string[] {
  const set = new Set<string>();
  entries.forEach(e => {
    const ym = getRecordYearMonth(e.dateOfReading || e.timestamp, e.id);
    if (ym) set.add(ym);
  });
  return Array.from(set).sort().reverse();
}
