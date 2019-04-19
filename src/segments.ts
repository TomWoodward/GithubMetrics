import {intersection, uniq} from 'lodash/fp';
import moment, { Moment } from "moment";
import { DataBucket } from "./DataBucket";
import { reviewRequestForReview } from "./queries";

export const forRequestedReviewsReviewedBy = (data: DataBucket, targetReviewer: string): DataBucket => {
  const result = new DataBucket();
  result.reviewRequests = data.reviewRequests.filter(({requestedReviewer}) => requestedReviewer === targetReviewer);
  result.reviews = data.reviews.filter(({reviewer}) => reviewer === targetReviewer);
  result.pullRequests = data.pullRequests.filter(({id}) => !!result.reviews.find(({prId}) => prId === id));
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));

  return result;
};

export const forRequestedReviewsRequestedBetween = (data: DataBucket, start: Moment, end: Moment): DataBucket => {
  const result = new DataBucket();

  result.reviewRequests = data.reviewRequests.filter(({requestedAt}) => moment(requestedAt).isBetween(start, end));
  result.reviews = data.reviews.filter(review => {
    const request = reviewRequestForReview(data, review);
    return request && result.reviewRequests.indexOf(request) > -1
  });
  result.pullRequests = data.pullRequests.filter(({id}) => !!result.reviews.find(({prId}) => prId === id));
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));

  return result;
};

