import queryString from 'query-string';
import { DataBucket } from "./DataBucket";
import { PullRequest } from "./types";

const query = queryString.parse(location.search);

const repoFilter = typeof(query.repo) === 'string' ? query.repo : null;

const cached = <T extends Array<any>>(key: string, implementation: () => Promise<T>) => async () => {
  const cacheKey = `cache:${key}${repoFilter ? `?repo=${repoFilter}` : ''}`;
  const cached = localStorage.getItem(cacheKey);
  let result: T;

  if (cached) {
    result = JSON.parse(cached || '') || [];
    console.log(`loaded ${key}: ${result.length}`);
    return result;
  } else {
    result = await implementation();
    localStorage.setItem(cacheKey, JSON.stringify(result));
    console.log(`discovered ${key}: ${result.length}`);
  }

  return result;
};

export default class DataClient extends DataBucket {
  private token: string | undefined;

  setToken(token: string) {
    this.token = token;
  }

  async load() {
    this.repositories = await this.discoverRepositories();
    this.pullRequests = await this.discoverPullRequests();
    this.reviewRequests = await this.discoverReviewRequests();
    this.reviews = await this.discoverReviews();
  }

  discoverRepositories = cached('repositories', () => {
    const orgFilter = query.org;
    const repoFilter = query.repo;

    const formatRepo = (repo: any) => ({
      fullName: repo.full_name,
      id: repo.id,
    });

    if (repoFilter) {
      return  this.query(`/repos/${repoFilter}`).then(repo => ([formatRepo(repo)]));
    } else {
      throw new Error('please don\'t make me load everything....');
    }
  });

  discoverPullRequests = cached('pull-requests', async () => {
    const pullRequests: PullRequest[] = [];

    for(const repo of this.repositories) {
      try {
        const thisRepoPullRequests = await this.queryAllPages(`/repos/${repo.fullName}/pulls`, {state: 'all'});

        for (const pr of thisRepoPullRequests) {

          const commits = await this.queryAllPages(`/repos/${repo.fullName}/pulls/${pr.number}/commits`);

          pullRequests.push({
            opener: pr.user.login as string,
            commits: commits.map(commit => ({
              date: commit.commit.committer.date as string,
            })),
            mergedAt: pr.merged_at,
            createdAt: pr.created_at,
            title: pr.title,
            repoFullName: repo.fullName,
            repoId: repo.id,
            id: pr.number,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    return pullRequests;
  });

  discoverReviewRequests = cached('review-requests', async () => {
    const results = [];

    for (const pr of this.pullRequests) {
      results.push(
        ...await this.queryAllPages(`/repos/${pr.repoFullName}/issues/${pr.id}/events`).then(activities => activities
          .filter((activity: any) => activity.event === 'review_requested' && activity.requested_reviewer)
          .map((activity: any) => ({
            prTitle: pr.title,
            prId: pr.id,
            requestedReviewer: activity.requested_reviewer.login,
            requestedAt: activity.created_at,
          })))
      );
    }

    return results;
  });

  discoverReviews = cached('reviews', async () => {
    const results = [];

    for (const pr of this.pullRequests) {
      results.push(
        ...await this.queryAllPages(`/repos/${pr.repoFullName}/pulls/${pr.id}/reviews`).then(reviews => reviews
          .map((review: any) => ({
            prId: pr.id,
            reviewer: review.user.login,
            reviewedAt: review.submitted_at,
            state: review.state,
          })))
      );
    }

    return results;
  });

  private async queryAllPages(path: string, params: {[key: string]: string} = {}) {
    const results = [];
    const per_page = 100;
    let page = 1;
    let newPages = [];

    do  {
      newPages = await this.query(path, {...params, page: String(page++), per_page: String(per_page)});
      results.push(...newPages);
    } while (newPages.length === per_page);

    return results;
  }

  private query(path: string, params: {[key: string]: string} = {}) {
    const url = new URL(`https://api.github.com${path}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    return fetch(url.toString(), {
      headers: {
        "Authorization": `token ${this.token}`
      }
    })
      .then(response => response.json());
  }
}
