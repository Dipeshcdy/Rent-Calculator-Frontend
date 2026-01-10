// @ts-ignore - Type declarations not properly exported by @sbmdkl/nepali-date-converter
import { adToBs, bsToAd } from '@sbmdkl/nepali-date-converter';

// Nepali month names
export const NEPALI_MONTHS = [
    'Baisakh',
    'Jestha',
    'Ashadh',
    'Shrawan',
    'Bhadra',
    'Ashwin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra'
];

/**
 * Get current BS date
 */
export function getCurrentBSDate(): { year: number; month: number; day: number } {
    const now = new Date();
    const adDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const bsDate = adToBs(adDateStr);

    const [year, month, day] = bsDate.split('-').map(Number);
    return { year, month, day };
}

/**
 * Get Nepali month name
 */
export function getNepaliMonthName(month: number): string {
    return NEPALI_MONTHS[month - 1] || 'Invalid';
}

/**
 * Format BS date as "Month YYYY" (e.g., "Poush 2081")
 */
export function formatBSMonthYear(month: number, year: number): string {
    return `${getNepaliMonthName(month)} ${year}`;
}

/**
 * Format BS date as "DD Month YYYY" (e.g., "15 Poush 2081")
 */
export function formatBSDate(day: number, month: number, year: number): string {
    return `${day} ${getNepaliMonthName(month)} ${year}`;
}

/**
 * Convert AD date to BS
 */
export function convertADToBS(adDate: Date | string): { year: number; month: number; day: number } {
    let dateStr: string;
    if (adDate instanceof Date) {
        dateStr = `${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, '0')}-${String(adDate.getDate()).padStart(2, '0')}`;
    } else {
        dateStr = adDate;
    }

    const bsDate = adToBs(dateStr);
    const [year, month, day] = bsDate.split('-').map(Number);
    return { year, month, day };
}

/**
 * Convert BS date to AD Date object
 */
export function convertBSToAD(bsYear: number, bsMonth: number, bsDay: number): Date {
    const bsDateStr = `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
    const adDateStr = bsToAd(bsDateStr);
    return new Date(adDateStr);
}

/**
 * Generate array of BS years for dropdowns (current +/- 2 years)
 */
export function getBSYearOptions(): number[] {
    const currentBS = getCurrentBSDate();
    const years: number[] = [];
    for (let i = 2; i >= -2; i--) {
        years.push(currentBS.year - i);
    }
    return years;
}

/**
 * Convert BS month/year to AD month/year
 * Returns the AD month/year that corresponds to the middle of the BS month
 * For API calls to ensure backend uses consistent AD dates
 */
export function convertBSMonthYearToAD(bsMonth: number, bsYear: number): { month: number; year: number } {
    // Use the 15th day of the month as a representative date
    const adDate = convertBSToAD(bsYear, bsMonth, 15);
    return {
        month: adDate.getMonth() + 1, // JS months are 0-indexed
        year: adDate.getFullYear()
    };
}
