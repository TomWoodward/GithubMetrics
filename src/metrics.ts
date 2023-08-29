import {mean, sum} from 'lodash/fp';
import { DataBucket } from "./DataBucket";
import workHours from './workhours';
import 'moment-range';
import { extendMoment } from 'moment-range';
import baseMoment, {Moment} from 'moment';
import { PullRequest, Review } from "./types";
import { reviewRequestForReview, reviewRequestAfterRework, reviewAfterRework, commitsOnDay, inProgressPrsOnDay } from "./queries";

const moment = extendMoment(baseMoment as any);

export const timeToReviewRequest = (data: DataBucket, review: Review) => {
  const request = reviewRequestForReview(data, review);
  
  if (request) {
    const timeToReview = moment.range(moment(request.requestedAt), moment(review.reviewedAt));
    return workHours(timeToReview);
  }

  return null;
};

export const timeToReviewRequests = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const review of data.reviews) {
    const dataPoint = timeToReviewRequest(data, review);

    if (dataPoint) {
      dataPoints.push(dataPoint.asMilliseconds());
    }
  }

  return moment.duration(mean(dataPoints));
};

export const totalTimeToReviewRequests = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const review of data.reviews) {
    const dataPoint = timeToReviewRequest(data, review);

    if (dataPoint) {
      dataPoints.push(dataPoint.asMilliseconds());
    }
  }

  return moment.duration(sum(dataPoints));
};

export const timeToReworkAfterReview = (data: DataBucket, review: Review) => {
  const pr = data.pullRequests.find(
    (pr) => review.repoFullName === pr.repoFullName && review.prId === pr.id
  );

  if (!pr || pr.opener === review.reviewer) {
    return null;
  }

  const request = reviewRequestAfterRework(data, review);
  const nextReview = reviewAfterRework(data, review);

  if (nextReview) {
    const timeToReview = moment.range(moment(review.reviewedAt), moment(nextReview.reviewedAt));
    return workHours(timeToReview);
  } else if (request) {
    const timeToReview = moment.range(moment(review.reviewedAt), moment(request.requestedAt));
    return workHours(timeToReview);
  }

  return null;
}

export const timeToReworkAfterReviews = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const review of data.reviews) {
    const dataPoint = timeToReworkAfterReview(data, review);

    if (dataPoint) {
      dataPoints.push(dataPoint.asMilliseconds());
    }
  }

  return moment.duration(mean(dataPoints));
};

export const totalTimeToReworkAfterReviews = (data: DataBucket) => {
  const dataPoints: number[] = [];

  for(const review of data.reviews) {
    const dataPoint = timeToReworkAfterReview(data, review);

    if (dataPoint) {
      dataPoints.push(dataPoint.asMilliseconds());
    }
  }

  return moment.duration(sum(dataPoints));
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

export const weeklyCodingDays = (data: DataBucket, start?: Moment, end?: Moment) => {

  const commitDates = data.pullRequests
    .flatMap(({commits}) => commits.map(commit => moment(commit.date)))

  const range = moment.range(start || moment.min(commitDates), end || moment.max(commitDates));

  const weeklyCodingDaysData = [];

  for (const week of Array.from(range.by('week'))) {
    const codingDaysList = [];
    let codingDaysCount = 0;

    for (const day of Array.from(moment.range(week.clone().startOf('week'), week.clone().endOf('week')).by('day'))) {
      const count = commitsOnDay(data, day) 

      if (count > 0) {
        codingDaysList.push({day, count})
        codingDaysCount++;
      }
    }

    weeklyCodingDaysData.push(codingDaysCount);
  }

  
  return mean(weeklyCodingDaysData);
}

export const dailyInProgressPrCount = (data: DataBucket, start?: Moment, end?: Moment) => {

  const commitDates = data.pullRequests
    .flatMap(({commits}) => commits.map(commit => moment(commit.date)))

  const range = moment.range(start || moment.min(commitDates), end || moment.max(commitDates));

  const dataPoints = [];

  for (const day of Array.from(range.by('day'))) {
    dataPoints.push(inProgressPrsOnDay(data, day).length)
  }
  
  return mean(dataPoints);
}
