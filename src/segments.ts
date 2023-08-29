import {intersection, uniq} from 'lodash/fp';
import moment, { Moment } from "moment";
import { DataBucket } from "./DataBucket";
import { reviewRequestForReview, inProgressPrsOnDay } from "./queries";
import { PullRequest } from "./types";

export const forRequestedReviewsReviewedBy = (data: DataBucket, targetReviewer: string): DataBucket => {
  const result = new DataBucket(data);
  result.reviewRequests = data.reviewRequests.filter(({requestedReviewer}) => requestedReviewer === targetReviewer);
  result.reviews = data.reviews.filter(({reviewer}) => reviewer === targetReviewer);
  result.pullRequests = data.pullRequests.filter((pr) => !!result.reviews.find(
    ({repoFullName, prId}) => repoFullName === pr.repoFullName && prId === pr.id
  ));
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));

  return result;
};

export const forRequestedReviewsRequestedBetween = (data: DataBucket, start: Moment, end: Moment): DataBucket => {
  const result = new DataBucket(data);

  result.reviewRequests = data.reviewRequests.filter(({requestedAt}) => moment(requestedAt).isBetween(start, end));
  result.reviews = data.reviews.filter(review => {
    const request = reviewRequestForReview(data, review);
    return request && result.reviewRequests.indexOf(request) > -1
  });
  result.pullRequests = data.pullRequests.filter((pr) => !!result.reviews.find(
    ({repoFullName, prId}) => repoFullName === pr.repoFullName && prId === pr.id
  ));
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));

  return result;
};

export const forPullRequestsOpenedBy = (data: DataBucket, targetOpener: string): DataBucket => {
  const result = new DataBucket(data);

  result.pullRequests = data.pullRequests.filter(({opener}) => opener === targetOpener);
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));
  result.reviews = data.reviews.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );
  result.reviewRequests = data.reviewRequests.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );

  return result;
};

export const forMergedPullRequestsOpenedBy = (data: DataBucket, targetOpener: string): DataBucket => {
  const result = new DataBucket(data);

  result.pullRequests = data.pullRequests.filter(({opener, mergedAt}) => !!mergedAt && opener === targetOpener);
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));
  result.reviews = data.reviews.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );
  result.reviewRequests = data.reviewRequests.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );

  return result;
};

export const forPullRequestsOpenedBetween = (data: DataBucket, start: Moment, end: Moment): DataBucket => {
  const result = new DataBucket(data);

  result.pullRequests = data.pullRequests.filter(({createdAt}) => moment(createdAt).isBetween(start, end));
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));
  result.reviews = data.reviews.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );
  result.reviewRequests = data.reviewRequests.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );

  return result;
};

export const forPullRequestsWithWorkOn = (data: DataBucket, day: Moment): DataBucket => {
  const result = new DataBucket(data);

  result.pullRequests = inProgressPrsOnDay(data, day);
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));
  result.reviews = data.reviews.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );
  result.reviewRequests = data.reviewRequests.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );

  return result;
};

export const forPullRequest = (data: DataBucket, pr: PullRequest): DataBucket => {
  const result = new DataBucket(data);

  result.pullRequests = data.pullRequests.filter(f => f === pr);
  result.repositories = data.repositories.filter(({id}) => !!result.pullRequests.find(({repoId}) => repoId === id));
  result.reviews = data.reviews.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );
  result.reviewRequests = data.reviewRequests.filter(({prId, repoFullName}) => !!result.pullRequests.find(
    (pr) => repoFullName === pr.repoFullName && prId === pr.id)
  );

  return result;
};
