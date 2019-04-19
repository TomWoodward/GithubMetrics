import React, { Component } from 'react';
import logo from './logo.svg';
import DataClient from "./DataClient";
import queryString from 'query-string';
import { timeToReviewRequests, reviewersReviewed } from "./metrics";
import moment from 'moment';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from "@material-ui/core/Typography";
import { forRequestedReviewsReviewedBy, forRequestedReviewsRequestedBetween } from "./segments";

const query = queryString.parse(location.search);

const CLIENT_ID = "9b497668bd2232f0492e";
const REDIRECT_URI = "http://localhost:3000/";
const ACCESS_TOKEN_HOST = 'https://tcwoodward-github-metrics.herokuapp.com';

type State = {token?: string, loaded: boolean};
class App extends Component<{}, State> {
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

    const reviewers = reviewersReviewed(this.data);
    const formatHours = (hours: moment.Duration) => {
      const numHours = Math.round(hours.asHours());
      return isNaN(numHours) || numHours === 0
        ? null
        : `${numHours} hour${numHours > 1 ? 's' : ''}`;
    };

    return <div>
      <Typography variant="h3" gutterBottom>
        time to respond to review requests
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
          {reviewers.map(reviewer => {
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
    </div>;
  }
}

export default App;
