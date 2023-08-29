import React from 'react';
import LaunchIcon from '@mui/icons-material/Launch';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { DataBucket } from "../DataBucket";
import { timeToMergePullRequest, totalTimeToReworkAfterReviews, totalTimeToReviewRequests } from "../metrics";
import { formatHours } from "../timeUtils";
import Button from '@material-ui/core/Button';
import ReviewList from './ReviewList';
import { forPullRequest } from "../segments";
import { useSetView } from "./Dashboard";

type Props = {
  segment: DataBucket;
  onDone: () => void;
};

export const PullRequestList = (props: Props) => {
  const {segment, onDone} = props;
  const setView = useSetView();

  return <>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>title</TableCell>
          <TableCell>time to merge</TableCell>
          <TableCell>total time waiting for review</TableCell>
          <TableCell>total rework time</TableCell>
          <TableCell>created</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {segment.pullRequests.map(pr => {
          const prSegment = forPullRequest(segment, pr);

          return <TableRow key={`${pr.repoId} ${pr.id}`}>
            <TableCell>
              <Link component='button' onClick={(e: any) => { 
                setView({component: ReviewList, props: {
                  segment: prSegment,
                  onDone: () => setView({component: PullRequestList, props})}
                }); 
              }}>{pr.title}</Link>
              <Link href={`https://github.com/${pr.repoFullName}/pull/${pr.id}`}><LaunchIcon fontSize='small' /></Link>
            </TableCell>
            <TableCell>{formatHours(timeToMergePullRequest(pr))}</TableCell>
            <TableCell>{formatHours(totalTimeToReviewRequests(prSegment))}</TableCell>
            <TableCell>{formatHours(totalTimeToReworkAfterReviews(prSegment))}</TableCell>
            <TableCell>{pr.createdAt}</TableCell>
          </TableRow>
        })}
      </TableBody>
    </Table>
    {onDone ? <Button onClick={onDone}>back</Button> : null}
  </>
};

export default PullRequestList;
