
export interface Repository {
  fullName: string;
  id: string;
}

export interface PullRequest {
  title: string;
  repoFullName: string;
  repoId: string;
  id: number;
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
