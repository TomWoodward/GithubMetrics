import {intersection, get, uniq, mean} from 'lodash/fp';
import moment from 'moment';
import DataClient from "./DataClient";

export default class DataProcessor {
  private data: DataClient;

  constructor(data: DataClient) {
    this.data = data;
  }

  reviewers() {
    return uniq(intersection(
      this.data.reviewRequests.map(get('requestedReviewer')),
      this.data.reviews.map(get('reviewer'))
    ));
  }

  timeToReview(reviewer: string) {
    const dataPoints: number[] = [];

    for(const request of this.data.reviewRequests) {
      if (request.requestedReviewer !== reviewer) {
        continue;
      }
      const reviews = this.data.reviews.filter(review =>
        review.prId === request.prId && review.reviewer === reviewer
      );
      const firstReviewAfterRequest = reviews
        .sort((review: any) => moment(review.reviewedAt).unix())
        .filter((review: any) => moment(review.reviewedAt).isAfter(request.requestedAt))
        [0]
      ;

      if (firstReviewAfterRequest) {
        dataPoints.push(moment(firstReviewAfterRequest.reviewedAt).unix() - moment(request.requestedAt).unix());
      }
    }

    return moment.duration(mean(dataPoints), 'seconds');
  }
}
