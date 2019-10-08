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
import Dashboard from './components/Dashboard';

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

type State = {
  token?: string,
  loaded: boolean,
  view?: React.ComponentElement<any, any>
};
type Props = {classes: {[key: string]: string}};
class App extends Component<Props, State> {
  state: State = {
    loaded: false,
  };
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

  setView = (view: React.ComponentElement<any, any>) => {
    this.setState({view});
  };

  render() {
    if (this.state.loaded === false) {
      return null;
    }

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

      {this.state.view ? this.state.view : <Dashboard data={this.data} setView={this.setView} />}
    </div>;
  }
}

export default withStyles(styles)(App);
