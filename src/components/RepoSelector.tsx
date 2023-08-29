import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from "@material-ui/core/Typography";
import DataClient from "../DataClient";
import TextField from '@mui/material/TextField';
import { Repository } from "../types";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

export const RepoSelector = ({data}: {data: DataClient}) => {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [orgs, setOrgs] = React.useState<any[]>([]);
  const [org, setOrg] = React.useState<string>('');
  const [repos, setRepos] = React.useState<Repository[] | null>(null);
  const [search, setSearch] = React.useState<string>('');

  React.useEffect(() => {
    data.userOrgs().then(orgs => {
      setOrg(orgs[0].name);
      setOrgs(orgs);
    });
  }, []);

  React.useEffect(() => {
    if (org) {
      setSearch('');
      setRepos(null);
      data.possibleRepositories(org).then(setRepos);
    }
  }, [org]);

  return <Box
    component="form"
    noValidate
    autoComplete="off"
    onSubmit={e => {
      e.preventDefault();
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('repo');
      selected.forEach(repoName => searchParams.append('repo', repoName));
      window.location.search = searchParams.toString();
    }}
    sx={{
      maxWidth: '500px',
      '& > :not(style)': { m: 1, width: '100%' },
    }}
  >
    <FormControl fullWidth>
      <InputLabel>Organization</InputLabel>
      <Select
        label="Organization"
        value={orgs.find(s => s.name == org) ? org : ''}
        onChange={e => setOrg(e.target.value as string)}
      >
        {orgs.map(org => <MenuItem key={org.name} value={org.name}>{org.name}</MenuItem>)}
      </Select>
    </FormControl>

    <TextField label="Search" variant="outlined" value={search} onChange={e => setSearch(e.target.value)} />

    <FormGroup>
      {selected.map(repoName => 
        <FormControlLabel key={repoName} control={<Checkbox checked={true} onChange={() => setSelected(previous => previous.filter(s => s !== repoName))} />} label={repoName} />
      )}
      {selected.length < 1
        ? <Typography>Select some repos</Typography>
        : null 
      }

      <Button variant="outlined" type="submit">View Metrics</Button>
    </FormGroup>
    <FormGroup>
      {repos
        ? repos.filter(repo => repo.fullName.includes(search) && !selected.includes(repo.fullName)).map(repo => 
          <FormControlLabel key={repo.fullName} control={<Checkbox checked={false} onChange={() => setSelected(previous => [...previous, repo.fullName])} />} label={repo.fullName} />
        )
        : <Typography>loading repos...</Typography>
      }
    </FormGroup>

  </Box>
};
