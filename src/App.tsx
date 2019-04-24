import React, { Component } from 'react';
import logo from './logo.svg';
import DataClient from "./DataClient";
import queryString from 'query-string';
import { timeToReviewRequests, timeToMergePullRequests } from "./metrics";
import { reviewersReviewed, mergedPullRequestOpeners } from "./queries";
import moment from 'moment';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/Typography";
import CssBaseline from '@material-ui/core/CssBaseline';
import { withStyles } from '@material-ui/core/styles';
import { forRequestedReviewsReviewedBy, forRequestedReviewsRequestedBetween, forMergedPullRequestsOpenedBy, forPullRequestsOpenedBetween } from "./segments";
import { Theme } from '@material-ui/core/styles/createMuiTheme';

const query = queryString.parse(location.search);

const {
  REACT_APP_CLIENT_ID: CLIENT_ID,
  REACT_APP_REDIRECT_URI: REDIRECT_URI,
  REACT_APP_ACCESS_TOKEN_HOST: ACCESS_TOKEN_HOST
} = process.env;

const styles = (theme: Theme) => ({
  container: {
    margin: theme.spacing.unit * 2,
  },
  main: {
    marginTop: theme.spacing.unit * 4,
    padding: theme.spacing.unit * 4,
  },
});

type State = {token?: string, loaded: boolean};
type Props = {classes: {[key: string]: string}};
class App extends Component<Props, State> {
  state: State = {loaded: false};
  private data: DataClient = new DataClient();

  componentDidMount() {
    this.assertAuthenticated();
  }

  assertAuthenticated() {
    const token = localStorage.getItem('token');

    if (token) {
      this.receiveToken(token);
    } else if (query.code && typeof(query.code) === 'string') {
      this.getAccessToken(query.code)
    } else {
      const redirect = REDIRECT_URI + window.location.search;
      window.location.replace(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user,repo&redirect_uri=${redirect}`);
    }
  }

  private getAccessToken(code: string) {
    fetch(`${ACCESS_TOKEN_HOST}/authenticate/${code}`)
      .then(response => response.json())
      .then(({ token }) => this.receiveToken(token));
  }

  private receiveToken = (token: string) => {
    localStorage.setItem('token', token);
    this.setState({token});

    this.data.setToken(token);
    this.data.load().then(() => this.setState({loaded: true}));
  };

  render() {
    if (this.state.loaded === false) {
      return null;
    }

    const formatHours = (hours: moment.Duration) => {
      const numHours = Math.round(hours.asHours());
      return isNaN(numHours) || numHours === 0
        ? null
        : `${numHours} hour${numHours > 1 ? 's' : ''}`;
    };

    return <div className={this.props.classes.container}>
      <CssBaseline />
      <Typography variant="h1">
        GitHub Metrics
      </Typography>
      {this.data.repositories.map(({fullName}) => <Chip
        key={fullName}
        label={fullName}
        variant="outlined"
      />)}

      <Paper className={this.props.classes.main}>
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
            {reviewersReviewed(this.data).map(reviewer => {
              const reviewerData = forRequestedReviewsReviewedBy(this.data, reviewer);
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
      <Paper className={this.props.classes.main}>
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
            {mergedPullRequestOpeners(this.data).map(opener => {
              const openerData = forMergedPullRequestsOpenedBy(this.data, opener);
              return <TableRow key={opener}>
                <TableCell>{opener}</TableCell>
                <TableCell>{formatHours(timeToMergePullRequests(
                  forPullRequestsOpenedBetween(openerData, moment().subtract(30, 'days'), moment())
                ))}</TableCell>
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
    </div>;
  }
}

export default withStyles(styles)(App);
