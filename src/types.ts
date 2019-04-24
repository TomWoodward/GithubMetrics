
export interface Repository {
  fullName: string;
  id: string;
}

export interface Commit {
  date: string;
}

export interface PullRequest {
  opener: string;
  title: string;
  repoFullName: string;
  repoId: string;
  id: number;
  createdAt: string;
  mergedAt: string | null;
  commits: Commit[];
}

export interface ReviewRequest {
  prId: number;
  prTitle: string;
  requestedReviewer: string;
  requestedAt: string;
}

export interface Review {
  prId: number;
  reviewer: string; 
  reviewedAt: string; 
  state: string; // todo make this an emum
}
