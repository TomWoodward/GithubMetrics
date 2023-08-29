import React from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { DataBucket } from "../DataBucket";
import Button from '@material-ui/core/Button';
import { useSetView } from "./Dashboard";
import 'moment-range';
import { extendMoment } from 'moment-range';
import baseMoment, {Moment} from 'moment';
import { commitsOnDay, inProgressPrsOnDay } from "../queries";
import { forPullRequestsWithWorkOn } from "../segments";
import { PullRequestList } from "./PullRequestList";

const moment = extendMoment(baseMoment as any);

type Props = {
  segment: DataBucket;
  start: Moment;
  end: Moment;
  onDone: () => void;
};

export const DayList = (props: Props) => {
  const {segment, onDone} = props;
  const setView = useSetView();

  return <>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>date</TableCell>
          <TableCell>commits</TableCell>
          <TableCell>prs</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from(moment.range(props.start, props.end).by('day')).map(day => {
          const daySegment = forPullRequestsWithWorkOn(segment, day);
          return <TableRow key={`${day.format()}`}>
            <TableCell>
              <Link component='button' onClick={(e: any) => { 
                setView({component: PullRequestList, props: {
                  segment: daySegment,
                  onDone: () => setView({component: DayList, props})}
                }); 
              }}>{day.format('dddd, MMM, Do, YY')}</Link>
            </TableCell>
            <TableCell>{commitsOnDay(segment, day)}</TableCell>
            <TableCell>{inProgressPrsOnDay(segment, day).length}</TableCell>
          </TableRow>
        })}
      </TableBody>
    </Table>
    {onDone ? <Button onClick={onDone}>back</Button> : null}
  </>
};
