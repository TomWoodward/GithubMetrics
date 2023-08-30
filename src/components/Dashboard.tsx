import Paper from '@material-ui/core/Paper';
import moment, {Moment} from 'moment';
import Typography from "@material-ui/core/Typography";
import React from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { forMergedPullRequestsOpenedBy, forPullRequestsOpenedBetween, forRequestedReviewsReviewedBy, forRequestedReviewsRequestedBetween, forPullRequestsOpenedBy, forPullRequestsMergedBetween } from "../segments";
import { formatHours } from "../timeUtils";
import { DataBucket } from "../DataBucket";
import { mergedPullRequestOpeners, reviewersReviewed } from "../queries";
import { timeToMergePullRequests, timeToReviewRequests, timeToReworkAfterReviews, weeklyCodingDays, dailyInProgressPrCount, weeklyPrsMerged } from "../metrics";
import PullRequestList from './PullRequestList';
import { useStyles } from "../App";
import { DayList } from "./DayList";

type Props = {
  data: DataBucket;
};

type View = undefined | {component: React.ComponentType<any>, props: any}
type SetView = (view: View) => void
export const SetDetailContext = React.createContext<SetView>(() => { throw new Error('not implemented') })
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
      setView({component: props.detail, props: {segment: props.segment, onDone: () => setView(undefined)}}); 
    }}>{props.text(props.segment) || '-'}</Link>
  </TableCell>
};

const DateBucketRow = (props: {
  rowHeader: string;
  segment: DataBucket;
  detail: React.ComponentType<any>;
  filter: (segment: DataBucket, start: Moment, end: Moment) => DataBucket;
  text: (segment: DataBucket, start?: Moment, end?: Moment) => string | null; 
}) => { 
  return <TableRow>
    <CellLink
      segment={props.segment}
      detail={props.detail}
      text={() => props.rowHeader}
    />
    <CellLink
      segment={props.filter(props.segment, moment().subtract(30, 'days'), moment())}
      detail={detailProps => <props.detail {...detailProps} start={moment().subtract(30, 'days')} end={moment()} />}
      text={(data) => props.text(data, moment().subtract(30, 'days'), moment())}
    />
    <CellLink
      segment={props.filter(props.segment, moment().subtract(60, 'days'), moment().subtract(30, 'days'))}
      detail={detailProps => <props.detail {...detailProps} start={moment().subtract(60, 'days')} end={moment().subtract(30, 'days')} />}
      text={(data) => props.text(data, moment().subtract(60, 'days'), moment().subtract(30, 'days'))}
    />
    <CellLink
      segment={props.filter(props.segment, moment().subtract(90, 'days'), moment().subtract(60, 'days'))}
      detail={detailProps => <props.detail {...detailProps} start={moment().subtract(90, 'days')} end={moment().subtract(60, 'days')} />}
      text={(data) => props.text(data, moment().subtract(90, 'days'), moment().subtract(60, 'days'))}
    />
  </TableRow>;
}
      
const DateBucketTable = (props: {
  rows: (segment: DataBucket) => string[];
  segment: DataBucket;
  detail: React.ComponentType<any>;
  dateFilter: (segment: DataBucket, start: Moment, end: Moment) => DataBucket;
  rowFilter: (segment: DataBucket, row: string) => DataBucket;
  text: (segment: DataBucket, start?: Moment, end?: Moment) => string | null; 
}) => {
  const [detail, setDetail] = React.useState<View>();

  return <SetDetailContext.Provider value={setDetail}>
    {detail
      ? <>
        <detail.component {...detail.props} />
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

const Dashboard = ({data}: Props) => {
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
        time to rework after review
      </Typography>
      <Typography variant="caption" gutterBottom>
        how long does it take the PR owner to re-work and re-request review after receiving feedback? 
        this metric only counts time during work hours monday through friday.
      </Typography>
      <DateBucketTable
        segment={data}
        detail={PullRequestList}
        rows={mergedPullRequestOpeners}
        rowFilter={forMergedPullRequestsOpenedBy}
        dateFilter={forRequestedReviewsRequestedBetween}
        text={segment => formatHours(timeToReworkAfterReviews(segment))}
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
    <Paper className={classes.main}>
      <Typography variant="h3" gutterBottom>
        weekly pull requests merged 
      </Typography>
      <Typography variant="caption" gutterBottom>
        the average number of pull requests merged each week
      </Typography>
      <DateBucketTable
        segment={data}
        detail={PullRequestList}
        rows={mergedPullRequestOpeners}
        rowFilter={forMergedPullRequestsOpenedBy}
        dateFilter={forPullRequestsMergedBetween}
        text={(segment, start, end) => weeklyPrsMerged(segment, start, end).toLocaleString()}
      />
    </Paper>
    <Paper className={classes.main}>
      <Typography variant="h3" gutterBottom>
        weekly coding days
      </Typography>
      <Typography variant="caption" gutterBottom>
        the average number of days per week that have at least one commit on a pull request
      </Typography>
      <DateBucketTable
        segment={data}
        detail={DayList}
        rows={mergedPullRequestOpeners}
        rowFilter={forPullRequestsOpenedBy}
        dateFilter={data => data}
        text={(segment, start, end) => weeklyCodingDays(segment, start, end).toLocaleString()}
      />
    </Paper>
    <Paper className={classes.main}>
      <Typography variant="h3" gutterBottom>
        work in progress
      </Typography>
      <Typography variant="caption" gutterBottom>
        the average number of in progress pull requests on any given day
      </Typography>
      <DateBucketTable
        segment={data}
        detail={DayList}
        rows={mergedPullRequestOpeners}
        rowFilter={forPullRequestsOpenedBy}
        dateFilter={data => data}
        text={(segment, start, end) => dailyInProgressPrCount(segment, start, end).toLocaleString()}
      />
    </Paper>
  </React.Fragment>
};

export default Dashboard;
