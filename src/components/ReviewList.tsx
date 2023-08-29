import React from 'react';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { DataBucket } from "../DataBucket";
import { timeToReviewRequest, timeToReworkAfterReview } from "../metrics";
import { formatHours } from "../timeUtils";

type Props = {
  segment: DataBucket;
  onDone: () => void;
};

const ReviewList = ({segment, onDone}: Props) => {
  return <>
      <Table>
      <TableHead>
        <TableRow>
          <TableCell>created</TableCell>
          <TableCell>reviewer</TableCell>
          <TableCell>lead time</TableCell>
          <TableCell>rework time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {segment.reviews.map(review => {
          return <TableRow key={`${review.prId} ${review.reviewedAt}`}>
            <TableCell>{review.reviewedAt}</TableCell>
            <TableCell>{review.reviewer}</TableCell>
            <TableCell>{formatHours(timeToReviewRequest(segment, review))}</TableCell>
            <TableCell>{formatHours(timeToReworkAfterReview(segment, review))}</TableCell>
          </TableRow>
        })}
      </TableBody>
    </Table>
    {onDone ? <Button onClick={onDone}>back</Button> : null}
  </>
};

export default ReviewList;
