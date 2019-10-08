import moment from 'moment';

export const formatHours = (hours: moment.Duration) => {
  const numHours = Math.round(hours.asHours());
  return isNaN(numHours) || numHours === 0
    ? null
    : `${numHours} hour${numHours > 1 ? 's' : ''}`;
};
