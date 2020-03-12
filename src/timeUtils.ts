import moment from 'moment';

export const formatHours = (hours: moment.Duration) => {
  const numHours = Math.round(hours.asHours());
  return isNaN(numHours) || numHours === 0
    ? null
    : numHours >= 8
      ? `${numHours/8} day${numHours === 8 ? '' : 's'}`
      : `${numHours} hour${numHours > 1 ? 's' : ''}`;
};
