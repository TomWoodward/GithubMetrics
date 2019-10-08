import {mean} from 'lodash/fp';
import { DataBucket } from "./DataBucket";
import workHours from './workhours';
import 'moment-range';
import { extendMoment } from 'moment-range';
import baseMoment from 'moment';
import { PullRequest } from "./types";

const moment = extendMoment(baseMoment as any);

export const timeToReviewRequests = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const request of data.reviewRequests) {
    const reviews = data.reviews.filter(review => review.prId === request.prId);
    const firstReviewAfterRequest = reviews
      .sort((review: any) => moment(review.reviewedAt).unix())
      .filter((review: any) => moment(review.reviewedAt).isAfter(request.requestedAt))
      [0]
    ;

    if (firstReviewAfterRequest) {
      const timeToReview = moment.range(moment(request.requestedAt), moment(firstReviewAfterRequest.reviewedAt));
      dataPoints.push(workHours(timeToReview).asMilliseconds());
    }
  }

  return moment.duration(mean(dataPoints));
};

export const timeToMergePullRequest = (pr: PullRequest) => {
  const timeToMerge = moment.range(moment(pr.commits[0].date), moment(pr.mergedAt));
  return moment.duration(workHours(timeToMerge).asMilliseconds());
};

export const timeToMergePullRequests = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const pullRequests of data.pullRequests) {
    if (!pullRequests.mergedAt) {
      continue;
    }
    const timeToMerge = moment.range(moment(pullRequests.commits[0].date), moment(pullRequests.mergedAt));
    dataPoints.push(workHours(timeToMerge).asMilliseconds());
  }

  return moment.duration(mean(dataPoints));
};
