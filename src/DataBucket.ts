import { Repository, PullRequest, ReviewRequest, Review } from "./types";

export class DataBucket {
  public repositories: Repository[] = [];
  public pullRequests: PullRequest[] = [];
  public reviewRequests: ReviewRequest[] = [];
  public reviews: Review[] = [];
}
