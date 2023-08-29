import { DataBucket } from "./DataBucket";
import {mean, intersection, uniq} from 'lodash/fp';
import moment, { Moment } from "moment";
import { Review, ReviewRequest } from "./types";

export const reviewRequestForReview = (data: DataBucket, targetReview: Review): ReviewRequest | undefined => {
  const previousReview = data.root.reviews
    .filter(review =>
      review.prId === targetReview.prId
      && review.reviewer === targetReview.reviewer
      && moment(review.reviewedAt).isBefore(targetReview.reviewedAt)
    )
    .sort((review: any) => moment(review.reviewedAt).unix())
    .reverse()
    [0]
  ;

  return data.root.reviewRequests
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

export const reviewRequestAfterRework = (data: DataBucket, subjectReview: Review): ReviewRequest | undefined => {
  const nextReview = reviewAfterRework(data, subjectReview); 

  return data.root.reviewRequests
    .filter(request =>
      request.prId === subjectReview.prId
      && request.requestedReviewer === subjectReview.reviewer
      && moment(request.requestedAt).isAfter(subjectReview.reviewedAt)
      && (!nextReview || moment(request.requestedAt).isBefore(nextReview.reviewedAt))
    )
    .sort((review: any) => moment(review.reviewedAt).unix())
    [0];
};

export const reviewAfterRework = (data: DataBucket, subjectReview: Review): Review | undefined => {
  return data.root.reviews
    .filter(review =>
      review.prId === subjectReview.prId
      && review.reviewer === subjectReview.reviewer
      && moment(review.reviewedAt).isAfter(subjectReview.reviewedAt)
    )
    .sort((review: any) => moment(review.reviewedAt).unix())
    [0]
  ;
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

export const commitsOnDay = (data: DataBucket, day: Moment) => {
  const commitDates = data.pullRequests
    .flatMap(({commits}) => commits.map(commit => moment(commit.date)))

  return commitDates.filter(date => {
    return day.isSame(date, 'day')
  }).length
}

export const inProgressPrsOnDay = (data: DataBucket, day: Moment) => {
  return data.pullRequests.filter(
    pr => pr.mergedAt
      ? day.isBetween(moment(pr.commits[0].date).startOf('day'), moment(pr.mergedAt).endOf('day'))
      : day.isAfter(moment(pr.commits[0].date).startOf('day'))
  )
}
