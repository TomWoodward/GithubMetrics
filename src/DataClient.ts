import queryString from 'query-string';

const query = queryString.parse(location.search);

const repoFilter = typeof(query.repo) === 'string' ? query.repo : null;

const cached = <T extends Array<any>>(key: string, implementation: () => Promise<T>) => async () => {
  const cacheKey = `cache:${key}${repoFilter ? `?repo=${repoFilter}` : ''}`;
  const cached = localStorage.getItem(cacheKey);
  let result: T[];

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

export default class DataClient {
  private token: string | undefined;
  public repositories: any[] = [];
  public pullRequests: any[] = [];
  public reviewRequests: any[] = [];
  public reviews: any[] = [];

  setToken(token: string) {
    this.token = token;
  }

  async init() {
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
    const pullRequests = [];

    for(const repo of this.repositories) {
      try {
        pullRequests.push(
          ...await this.queryAllPages(`/repos/${repo.fullName}/pulls`, {state: 'all'}).then(prs => prs
            .map(pr => ({
              repoFullName: repo.fullName,
              repoId: repo.id,
              id: pr.number,
            }))
          )
        );
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
          .filter((activity: any) => activity.event === 'review_requested')
          .map((activity: any) => ({
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
    let page = 1;
    let newPages = [];

    do  {
      newPages = await this.query(path, {...params, page: String(page++)});
      results.push(...newPages);
    } while (newPages.length > 0);

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
