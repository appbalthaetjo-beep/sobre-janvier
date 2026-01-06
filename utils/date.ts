const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const WEEKDAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export type FrenchDateFormatOptions = {
  weekday?: 'long' | 'short';
  year?: 'numeric';
  month?: 'numeric' | 'long' | 'short';
  day?: 'numeric';
  hour?: '2-digit';
  minute?: '2-digit';
};

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function formatDateFrench(dateInput: string | number | Date, options?: FrenchDateFormatOptions): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = pad(date.getDate());
  const monthIndex = date.getMonth();
  const year = date.getFullYear().toString();

  if (!options) {
    return `${day}/${pad(monthIndex + 1)}/${year}`;
  }

  const parts: string[] = [];

  if (options.weekday) {
    const weekdays = options.weekday === 'short' ? WEEKDAYS_SHORT : WEEKDAYS_LONG;
    parts.push(weekdays[date.getDay()]);
  }

  if (options.day === 'numeric') {
    const dayPart = options.weekday ? Number(day).toString() : day;
    parts.push(dayPart);
  }

  if (options.month) {
    if (options.month === 'long') {
      parts.push(MONTHS_LONG[monthIndex]);
    } else if (options.month === 'short') {
      parts.push(MONTHS_SHORT[monthIndex]);
    } else {
      parts.push(pad(monthIndex + 1));
    }
  }

  if (options.year === 'numeric') {
    parts.push(year);
  }

  let datePart: string;
  if (options.month === 'numeric' && !options.weekday) {
    datePart = parts.join('/');
  } else {
    datePart = parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  if (options.hour === '2-digit' || options.minute === '2-digit') {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const time = `${hours}:${minutes}`;
    return `${datePart} ${time}`.trim();
  }

  return datePart;
}
