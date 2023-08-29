import moment from 'moment';

export const formatHours = (hours: moment.Duration | null) => {
  if (!hours) return '';
  const numMinutes = hours.asMinutes();
  const minutesInADay = 8 * 60
  return isNaN(numMinutes)
    ? null
    : numMinutes >= minutesInADay
      ? `${(numMinutes/minutesInADay).toLocaleString()} days`
      : numMinutes > 60
        ? `${(numMinutes/60).toLocaleString()} hours`
        : `${numMinutes.toLocaleString()} minutes`;
};
