import Paper from '@material-ui/core/Paper';
import moment, {Moment} from 'moment';
import Typography from "@material-ui/core/Typography";
import React from 'react';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { forMergedPullRequestsOpenedBy, forPullRequestsOpenedBetween, forRequestedReviewsReviewedBy, forRequestedReviewsRequestedBetween } from "../segments";
import { formatHours } from "../timeUtils";
import { DataBucket } from "../DataBucket";
import { mergedPullRequestOpeners, reviewersReviewed } from "../queries";
import { timeToMergePullRequests, timeToReviewRequests } from "../metrics";
import PullRequestList from './PullRequestList';
import { useStyles } from "../App";

type Props = {
  setView: (view: React.ComponentElement<any, any>) => void;
  data: DataBucket;
};

export const SetDetailContext = React.createContext<(view: React.ComponentElement<any, any>) => void>(() => { throw new Error('not implemented') })
export const useSetView = () => React.useContext(SetDetailContext);

const CellLink = (props: {
  segment: DataBucket;
  detail: React.ComponentType<any>;
  text: (segment: DataBucket) => string | null; 
}) => {
  const setView = useSetView();

  return <TableCell>
    <Link component='button' onClick={(e: any) => { 
      e.preventDefault();
      setView(<props.detail data={props.segment} />); 
    }}>{props.text(props.segment) || ''}</Link>
  </TableCell>
};

const DateBucketRow = (props: {
  rowHeader: string;
  segment: DataBucket;
  detail: React.ComponentType<any>;
  filter: (segment: DataBucket, start: Moment, end: Moment) => DataBucket;
  text: (segment: DataBucket) => string | null; 
}) => { 
  return <TableRow>
    <CellLink
      segment={props.segment}
      detail={props.detail}
      text={() => props.rowHeader}
    />
    <CellLink
      segment={props.filter(props.segment, moment().subtract(30, 'days'), moment())}
      detail={props.detail}
      text={props.text}
    />
    <CellLink
      segment={props.filter(props.segment, moment().subtract(60, 'days'), moment().subtract(30, 'days'))}
      detail={props.detail}
      text={props.text}
    />
    <CellLink
      segment={props.filter(props.segment, moment().subtract(90, 'days'), moment().subtract(60, 'days'))}
      detail={props.detail}
      text={props.text}
    />
  </TableRow>;
}
      
const DateBucketTable = (props: {
  rows: (segment: DataBucket) => string[];
  segment: DataBucket;
  detail: React.ComponentType<any>;
  dateFilter: (segment: DataBucket, start: Moment, end: Moment) => DataBucket;
  rowFilter: (segment: DataBucket, row: string) => DataBucket;
  text: (segment: DataBucket) => string | null; 
}) => {
  const [detail, setDetail] = React.useState<React.ComponentElement<any, any> | undefined>();

  return <SetDetailContext.Provider value={setDetail}>
    {detail
      ? <>
        {detail}
        <Button onClick={() => setDetail(undefined)}>back</Button>
      </>
      : <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>past 30 days</TableCell>
            <TableCell>30 - 60 days</TableCell>
            <TableCell>60 - 90 days</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <DateBucketRow
            rowHeader={''}
            segment={props.segment}
            detail={props.detail}
            filter={props.dateFilter}
            text={props.text}
          />
          {props.rows(props.segment).map(row => 
            <DateBucketRow key={row}
              rowHeader={row}
              segment={props.rowFilter(props.segment, row)}
              detail={props.detail}
              filter={props.dateFilter}
              text={props.text}
            />
          )}
        </TableBody>
      </Table>}
  </SetDetailContext.Provider>;
}

const Dashboard = ({data, setView}: Props) => {
  const classes = useStyles();

  return <React.Fragment>
    <Paper className={classes.main}>
      <Typography variant="h3" gutterBottom>
        time to respond to review requests
      </Typography>
      <Typography variant="caption" gutterBottom>
        when a review is requested from somebody, how long does it take them to respond?
        this metric only counts time during work hours monday through friday.
      </Typography>
      <DateBucketTable
        segment={data}
        detail={PullRequestList}
        rows={reviewersReviewed}
        rowFilter={forRequestedReviewsReviewedBy}
        dateFilter={forRequestedReviewsRequestedBetween}
        text={segment => formatHours(timeToReviewRequests(segment))}
      />
    </Paper>
    <Paper className={classes.main}>
      <Typography variant="h3" gutterBottom>
        time to merge pull requests
      </Typography>
      <Typography variant="caption" gutterBottom>
        when somebody opens a pull request, how long is it between the first commit on the pull request and when it is merged?
        this metric only counts time during work hours monday through friday.
      </Typography>
      <DateBucketTable
        segment={data}
        detail={PullRequestList}
        rows={mergedPullRequestOpeners}
        rowFilter={forMergedPullRequestsOpenedBy}
        dateFilter={forPullRequestsOpenedBetween}
        text={segment => formatHours(timeToMergePullRequests(segment))}
      />
    </Paper>
  </React.Fragment>
};

export default Dashboard;
