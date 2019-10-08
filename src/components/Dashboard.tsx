import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import moment from 'moment';
import Typography from "@material-ui/core/Typography";
import React from 'react';
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

type Props = {
  classes: {[key: string]: string};
  setView: (view: React.ComponentElement<any, any>) => void;
  data: DataBucket;
};

const Dashboard: React.FC<Props> = ({classes, data, setView}) => <React.Fragment>
  <Paper className={classes.main}>
    <Typography variant="h3" gutterBottom>
      time to respond to review requests
    </Typography>
    <Typography variant="caption" gutterBottom>
      when a review is requested from somebody, how long does it take them to respond?
      this metric only counts time during work hours monday through friday.
    </Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell></TableCell>
          <TableCell>past 30 days</TableCell>
          <TableCell>30 - 60 days</TableCell>
          <TableCell>60 - 90 days</TableCell>
          <TableCell>all time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {reviewersReviewed(data).map(reviewer => {
          const reviewerData = forRequestedReviewsReviewedBy(data, reviewer);
          return <TableRow key={reviewer}>
            <TableCell>{reviewer}</TableCell>
            <TableCell>{formatHours(timeToReviewRequests(
              forRequestedReviewsRequestedBetween(reviewerData, moment().subtract(30, 'days'), moment())
            ))}</TableCell>
            <TableCell>{formatHours(timeToReviewRequests(
              forRequestedReviewsRequestedBetween(reviewerData, moment().subtract(60, 'days'), moment().subtract(30, 'days'))
            ))}</TableCell>
            <TableCell>{formatHours(timeToReviewRequests(
              forRequestedReviewsRequestedBetween(reviewerData, moment().subtract(90, 'days'), moment().subtract(60, 'days'))
            ))}</TableCell>
            <TableCell>{formatHours(timeToReviewRequests(reviewerData))}</TableCell>
          </TableRow>;
        })}
      </TableBody>
    </Table>
  </Paper>
  <Paper className={classes.main}>
    <Typography variant="h3" gutterBottom>
      time to merge pull requests
    </Typography>
    <Typography variant="caption" gutterBottom>
      when somebody opens a pull request, how long is it between the first commit on the pull request and when it is merged?
      this metric only counts time during work hours monday through friday.
    </Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell></TableCell>
          <TableCell>past 30 days</TableCell>
          <TableCell>30 - 60 days</TableCell>
          <TableCell>60 - 90 days</TableCell>
          <TableCell>all time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {mergedPullRequestOpeners(data).map(opener => {
          const openerData = forMergedPullRequestsOpenedBy(data, opener);
          return <TableRow key={opener}>
            <TableCell><a href="" onClick={e => {
              e.preventDefault();
              setView(<PullRequestList data={openerData} />); 
            }}>{opener}</a></TableCell>
            <TableCell>{(() => {
              const segment = forPullRequestsOpenedBetween(openerData, moment().subtract(30, 'days'), moment());
              return <a href="" onClick={(e) => { 
                e.preventDefault();
                setView(<PullRequestList data={segment} />); 
              }}>{formatHours(timeToMergePullRequests(segment))}</a>;
            })()}</TableCell>
            <TableCell>{formatHours(timeToMergePullRequests(
              forPullRequestsOpenedBetween(openerData, moment().subtract(60, 'days'), moment().subtract(30, 'days'))
            ))}</TableCell>
            <TableCell>{formatHours(timeToMergePullRequests(
              forPullRequestsOpenedBetween(openerData, moment().subtract(90, 'days'), moment().subtract(60, 'days'))
            ))}</TableCell>
            <TableCell>{formatHours(timeToMergePullRequests(openerData))}</TableCell>
          </TableRow>;
        })}
      </TableBody>
    </Table>
  </Paper>
</React.Fragment>;

const styles = (theme: Theme) => ({
  main: {
    marginTop: theme.spacing.unit * 4,
    padding: theme.spacing.unit * 4,
  },
});

export default withStyles(styles)(Dashboard);
