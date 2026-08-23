// Helper for parsing "HH:mm" to total minutes
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper for converting total minutes to "HH:mm"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Generate time slot list in 30-minute intervals
export function generateTimeSlots(
  openTime = '08:30',
  closeTime = '18:30',
  intervalMinutes = 30
): string[] {
  const startMin = timeToMinutes(openTime);
  const endMin = timeToMinutes(closeTime);
  const slots: string[] = [];

  for (let min = startMin; min <= endMin; min += intervalMinutes) {
    slots.push(minutesToTime(min));
  }
  return slots;
}

// Check if two time intervals overlap on the same date
// [start1, end1) and [start2, end2)
export function isTimeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // Overlap occurs if interval 1 starts before interval 2 ends AND interval 2 starts before interval 1 ends
  return s1 < e2 && s2 < e1;
}

// Format Date object to "YYYY-MM-DD"
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Format "YYYY-MM-DD" to Korean text "2026년 8월 25일 (화)"
export function formatKoreanDate(dateStr: string, includeDayOfWeek = true): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.getDay()];

  if (includeDayOfWeek) {
    return `${y}년 ${m}월 ${d}일 (${dayName})`;
  }
  return `${y}년 ${m}월 ${d}일`;
}

// Format time range "09:00 ~ 10:30"
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} ~ ${endTime}`;
}

// Get Korean day of week short label
export function getKoreanDayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return dayNames[date.getDay()];
}

// Check if a date string is Saturday or Sunday
export function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Get array of calendar days for a given year and month (0-indexed month)
export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export function getMonthCalendarDays(year: number, month: number, todayISO: string): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const days: CalendarDay[] = [];

  // Previous month filler days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = formatDateISO(prevDate);
    days.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayISO,
      isWeekend: isWeekend(dateStr),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const currDate = new Date(year, month, i);
    const dateStr = formatDateISO(currDate);
    days.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateStr === todayISO,
      isWeekend: isWeekend(dateStr),
    });
  }

  // Next month filler days to complete 35 or 42 grid slots
  const remainingSlots = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingSlots; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = formatDateISO(nextDate);
    days.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayISO,
      isWeekend: isWeekend(dateStr),
    });
  }

  return days;
}

// Get 7 days for the week containing a specific date
export function getWeekDays(dateStr: string, todayISO: string): CalendarDay[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun

  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - dayOfWeek);

  const weekDays: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const dStr = formatDateISO(day);
    weekDays.push({
      date: dStr,
      dayNumber: day.getDate(),
      isCurrentMonth: day.getMonth() === targetDate.getMonth(),
      isToday: dStr === todayISO,
      isWeekend: i === 0 || i === 6,
    });
  }
  return weekDays;
}
