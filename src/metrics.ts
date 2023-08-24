import {mean} from 'lodash/fp';
import { DataBucket } from "./DataBucket";
import workHours from './workhours';
import 'moment-range';
import { extendMoment } from 'moment-range';
import baseMoment from 'moment';
import { PullRequest } from "./types";
import { reviewRequestForReview, reviewRequestAfterRework } from "./queries";

const moment = extendMoment(baseMoment as any);

export const timeToReviewRequests = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const review of data.reviews) {
    const request = reviewRequestForReview(data, review);
    
    if (request) {
      const timeToReview = moment.range(moment(request.requestedAt), moment(review.reviewedAt));
      dataPoints.push(workHours(timeToReview).asMilliseconds());
    }
  }

  return moment.duration(mean(dataPoints));
};

export const timeToReworkAfterReview = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const review of data.reviews) {
    const request = reviewRequestAfterRework(data, review);

    if (request) {
      const timeToReview = moment.range(moment(review.reviewedAt), moment(request.requestedAt));
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
