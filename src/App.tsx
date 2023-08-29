import React from 'react';
import DataClient from "./DataClient";
import queryString from 'query-string';
import Chip from '@material-ui/core/Chip';
import Typography from "@material-ui/core/Typography";
import CssBaseline from '@material-ui/core/CssBaseline';
import { Theme, ThemeProvider, createTheme, makeStyles } from '@material-ui/core/styles';
import Dashboard from './components/Dashboard';
import { RepoSelector } from "./components/RepoSelector";

const query = queryString.parse(window.location.search);

const theme = createTheme();

const {
  REACT_APP_CLIENT_ID: CLIENT_ID,
  REACT_APP_REDIRECT_URI: REDIRECT_URI,
  REACT_APP_ACCESS_TOKEN_HOST: ACCESS_TOKEN_HOST
} = process.env;

export const useStyles = makeStyles((theme: Theme) => ({
  repoChip: {
    margin: theme.spacing(1/4),
  },
  container: {
    margin: theme.spacing(2),
  },
  main: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(4),
  },
}));

type State = {
  token?: string,
  phase: 'repo-select' | 'loading' | 'loaded' | null,
  view?: React.ComponentElement<any, any>
};
const App = () => {
  const [state, setState] = React.useState<State>({phase: null});
  const [progress, setProgress] = React.useState<string>('');
  const data = React.useRef(new DataClient());
  const classes = useStyles();

  const loadData = React.useCallback(() => {
    setProgress('');
    data.current.load(
      progress => setProgress(previous => previous + '\n' + progress)
    ).then(() => setState(previous => ({...previous, phase: 'loaded'})));
  }, [setState]);

  const receiveToken = React.useCallback((token: string) => {
    localStorage.setItem('token', token);
    setState(previous => ({...previous, token, phase: data.current.needsReposSelected() ? 'repo-select' : 'loading'}));

    data.current.setToken(token);

    if (!data.current.needsReposSelected()) {
      loadData();
    }
  }, [setState, loadData]);

  const getAccessToken = React.useCallback((code: string) => {
    fetch(`${ACCESS_TOKEN_HOST}/authenticate/${code}`)
      .then(response => response.json())
      .then(({ token }) => receiveToken(token));
  }, [receiveToken])

  const setView = React.useCallback((view: React.ComponentElement<any, any>) => {
    setState(previous => ({...previous, view})); 
  }, [setState]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      receiveToken(token);
    } else if (query.code && typeof(query.code) === 'string') {
      getAccessToken(query.code)
    } else {
      const redirect = encodeURIComponent(REDIRECT_URI + window.location.search);
      window.location.replace(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user,read,repo&redirect_uri=${redirect}`);
    }
  }, [receiveToken, getAccessToken]);

  React.useEffect(() => {
    if (state.phase === 'loading') {
      if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 30) {
        window.scrollTo(0, document.body.offsetHeight)
      }
    }
  }, [state, progress]);

  if (state.phase === 'loading') {
    return <pre>{progress}{'\n...'}</pre>;
  }

  return <div className={classes.container}>
    <CssBaseline />
    <Typography variant="h1">
      GitHub Metrics
    </Typography>
    {data.current.repositories.map(({fullName}) => <Chip
      className={classes.repoChip} 
      key={fullName}
      label={fullName}
      variant="outlined"
    />)}

    {state.phase === 'loaded'
      ? <Dashboard data={data.current} />
      : state.phase === 'repo-select'
        ? <RepoSelector data={data.current} />
        : null
    }
  </div>;
}

export default () => <ThemeProvider theme={theme}><App /></ThemeProvider>;
