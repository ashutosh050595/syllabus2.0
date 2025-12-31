
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
