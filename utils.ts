
export const getUpcomingMonday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day); // Next Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Current Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const getNextSaturday = (monday: Date) => {
  const d = new Date(monday);
  d.setDate(d.getDate() + 5);
  return d;
};

export const getWeekLabel = (monday: Date) => {
  const saturday = getNextSaturday(monday);
  return `${monday.toLocaleDateString()} to ${saturday.toLocaleDateString()}`;
};

// Add these utility functions

// Check if a date is in the future (beyond the upcoming Monday)
export function isFutureWeek(date: Date): boolean {
  const upcomingMonday = getUpcomingMonday();
  return date > upcomingMonday;
}

// Check if teacher has submitted for a specific week
export function hasSubmittedForWeek(
  teacherEmail: string,
  weekStarting: string,
  lessonPlans: LessonPlan[]
): boolean {
  return lessonPlans.some(plan => 
    plan.teacherId === teacherEmail && 
    plan.weekStarting === weekStarting &&
    plan.resubmissionStatus !== 'approved'
  );
}

// Get week range label
export function getWeekRangeLabel(date: Date): string {
  const monday = new Date(date);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 6);
  return `${formatDate(monday)} - ${formatDate(saturday)}`;
}

// Format time ago
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
