import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { DataBucket } from "../DataBucket";
import { timeToMergePullRequest } from "../metrics";
import { formatHours } from "../timeUtils";

type Props = {
  classes: {[key: string]: string};
  data: DataBucket;
};

const PullRequestList: React.FC<Props> = ({classes, data}) => <Paper className={classes.main}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>title</TableCell>
        <TableCell>time to merge</TableCell>
        <TableCell>created</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.pullRequests.map(pr => <TableRow key={pr.id}>
        <TableCell>{pr.title}</TableCell>
        <TableCell>{formatHours(timeToMergePullRequest(pr))}</TableCell>
        <TableCell>{pr.createdAt}</TableCell>
      </TableRow>)}
    </TableBody>
  </Table>
</Paper>;

const styles = (theme: Theme) => ({
  main: {
    marginTop: theme.spacing.unit * 4,
    padding: theme.spacing.unit * 4,
  },
});

export default withStyles(styles)(PullRequestList);
