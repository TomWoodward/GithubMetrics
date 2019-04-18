import React, { Component } from 'react';
import logo from './logo.svg';
import DataClient from "./DataClient";
import './App.css';
import queryString from 'query-string';
import DataProcessor from "./DataProcessor";

const query = queryString.parse(location.search);

const CLIENT_ID = "9b497668bd2232f0492e";
const REDIRECT_URI = "http://localhost:3000/";
const ACCESS_TOKEN_HOST = 'https://tcwoodward-github-metrics.herokuapp.com';

type State = {token?: string, loaded: boolean};
class App extends Component<{}, State> {
  state: State = {loaded: false};
  private data: DataClient = new DataClient();
  private metrics: DataProcessor = new DataProcessor(this.data);

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
    this.data.init().then(() => this.setState({loaded: true}));
  };

  render() {
    const reviewers = this.metrics.reviewers();

    for(const reviewer of reviewers) {
      console.log(reviewer);
      console.log('time to review: ', this.metrics.timeToReview(reviewer).humanize());
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
