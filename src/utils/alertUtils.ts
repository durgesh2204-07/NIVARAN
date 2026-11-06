import { AlertZoneLevel, ReliefCamp } from '../types';

export function getAlertLevelMeta(level: AlertZoneLevel): {
  bg: string;
  border: string;
  labelEn: string;
  labelHi: string;
  thresholdEn: string;
} {
  if (level === 'Red') {
    return {
      bg: '#DC2626',
      border: '#7F1D1D',
      labelEn: 'Red Alert · Danger / Evacuate Immediately',
      labelHi: 'रेड अलर्ट · गंभीर ख़तरा / तुरंत खाली करें',
      thresholdEn: '> 204.4 mm/24h · Take Action',
    };
  }
  if (level === 'Orange') {
    return {
      bg: '#EA580C',
      border: '#9A3412',
      labelEn: 'Orange Alert · Warning / Be Prepared',
      labelHi: 'ऑरेंज अलर्ट · चेतावनी / तैयार रहें',
      thresholdEn: '115.6–204.4 mm/24h · Be Prepared',
    };
  }
  if (level === 'Yellow') {
    return {
      bg: '#CA8A04',
      border: '#854D0E',
      labelEn: 'Yellow Alert · Watch / Be Updated',
      labelHi: 'येलो अलर्ट · निगरानी रखें / सतर्क रहें',
      thresholdEn: '64.5–115.5 mm/24h · Be Updated',
    };
  }
  return {
    bg: '#15803D',
    border: '#14532D',
    labelEn: 'Green Alert · Normal / No Warning',
    labelHi: 'ग्रीन अलर्ट · सामान्य / कोई चेतावनी नहीं',
    thresholdEn: '< 64.5 mm/24h · No Advisory',
  };
}

export function getShelterStatusMeta(camp: ReliefCamp): {
  statusText: 'Available' | 'Filling' | 'Full';
  colorHex: string;
  pct: number;
  freeBeds: number;
} {
  const pct = camp.capacityPersons > 0 ? (camp.currentOccupancy / camp.capacityPersons) * 100 : 100;
  const freeBeds = Math.max(0, camp.capacityPersons - camp.currentOccupancy);
  if (camp.currentOccupancy >= camp.capacityPersons || pct >= 100) {
    return { statusText: 'Full', colorHex: '#B91C1C', pct: 100, freeBeds: 0 };
  }
  if (pct >= 80) {
    return { statusText: 'Filling', colorHex: '#EA580C', pct: Math.round(pct), freeBeds };
  }
  return { statusText: 'Available', colorHex: '#15803D', pct: Math.round(pct), freeBeds };
}
