import { Repository, PullRequest, ReviewRequest, Review } from "./types";

export class DataBucket {
  public root: DataBucket;
  public repositories: Repository[] = [];
  public pullRequests: PullRequest[] = [];
  public reviewRequests: ReviewRequest[] = [];
  public reviews: Review[] = [];

  constructor(parent?: DataBucket) {
    this.root = (parent ? parent.root : undefined) || this;
  }
}
