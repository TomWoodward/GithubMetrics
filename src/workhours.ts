import baseMoment from 'moment';
import { extendMoment, DateRange } from 'moment-range';

const moment = extendMoment(baseMoment as any);

const workHours = [
  /* sunday */    {start: {hour: 0, minute: 0, second: 0}, end: {hour: 0, minute: 0, second: 0}},
  /* monday */    {start: {hour: 9, minute: 0, second: 0}, end: {hour: 17, minute: 0, second: 0}},
  /* tuesday */   {start: {hour: 9, minute: 0, second: 0}, end: {hour: 17, minute: 0, second: 0}},
  /* wednesday */ {start: {hour: 9, minute: 0, second: 0}, end: {hour: 17, minute: 0, second: 0}},
  /* thursday */  {start: {hour: 9, minute: 0, second: 0}, end: {hour: 17, minute: 0, second: 0}},
  /* friday */    {start: {hour: 9, minute: 0, second: 0}, end: {hour: 17, minute: 0, second: 0}},
  /* saturday */  {start: {hour: 0, minute: 0, second: 0}, end: {hour: 0, minute: 0, second: 0}},
];

export default (range: DateRange): baseMoment.Duration => {
  let total: number = 0;

  for (const day of Array.from(range.clone().snapTo('day').by('day'))) {
    const {start, end} = workHours[day.day()];
    const startMoment = day.clone().set(start);
    const endMoment = day.clone().set(end);

    const rangeStart = moment.max(startMoment, range.start);
    const rangeEnd = moment.min(endMoment, range.end);

    // this will be false if there are no work hours on that day
    // or if the range start is after hours or the range end is before hours
    if (rangeStart < rangeEnd) {
      total += rangeEnd.diff(rangeStart);
    }
  }

  return moment.duration(total);
};
