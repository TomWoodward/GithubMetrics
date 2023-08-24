import React from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { DataBucket } from "../DataBucket";
import { timeToMergePullRequest } from "../metrics";
import { formatHours } from "../timeUtils";

type Props = {
  data: DataBucket;
};

const PullRequestList = ({data}: Props) => {
  return <Table>
    <TableHead>
      <TableRow>
        <TableCell>title</TableCell>
        <TableCell>time to merge</TableCell>
        <TableCell>created</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.pullRequests.map(pr => <TableRow key={`${pr.repoId} ${pr.id}`}>
        <TableCell><Link href={`https://github.com/${pr.repoFullName}/pull/${pr.id}`}>{pr.title}</Link></TableCell>
        <TableCell>{formatHours(timeToMergePullRequest(pr))}</TableCell>
        <TableCell>{pr.createdAt}</TableCell>
      </TableRow>)}
    </TableBody>
  </Table>
};

export default PullRequestList;
