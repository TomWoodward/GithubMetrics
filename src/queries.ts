import { DataBucket } from "./DataBucket";
import {mean, intersection, uniq} from 'lodash/fp';
import moment, { Moment } from "moment";
import { Review, ReviewRequest } from "./types";

export const reviewRequestForReview = (data: DataBucket, targetReview: Review): ReviewRequest | undefined => {
  const previousReview = data.reviews
    .filter(review =>
      review.prId === targetReview.prId
      && review.reviewer === targetReview.reviewer
      && moment(review.reviewedAt).isBefore(targetReview.reviewedAt)
    )
    .sort((review: any) => moment(review.reviewedAt).unix())
    .reverse()
    [0]
  ;

  return data.reviewRequests
    .filter(request =>
      request.prId === targetReview.prId
      && request.requestedReviewer === targetReview.reviewer
      && moment(request.requestedAt).isBefore(targetReview.reviewedAt)
      && (!previousReview || moment(request.requestedAt).isAfter(previousReview.reviewedAt))
    )
    .sort((review: any) => moment(review.reviewedAt).unix())
    .reverse()
    [0];
};

export const mergedPullRequestOpeners = (data: DataBucket) =>
  uniq(data.pullRequests
    .filter(({mergedAt}) => !!mergedAt)
    .map(({opener}) => opener)
  )
;

export const reviewersReviewed = (data: DataBucket) => {
  const requested = data.reviewRequests.map(({requestedReviewer}) => requestedReviewer);
  const reviewers = data.reviews.map(({reviewer}) => reviewer);

  return uniq(intersection(
    requested,
    reviewers
  ));
};
