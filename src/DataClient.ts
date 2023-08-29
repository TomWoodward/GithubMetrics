import queryString from 'query-string';
import moment, { Moment } from "moment";
import { DataBucket } from "./DataBucket";
import { PullRequest, Repository } from "./types";

const query = queryString.parse(location.search);

const repos = typeof query.repo === 'string'
  ? [query.repo]
  : query.repo instanceof Array
    ? query.repo
    : undefined
;

const repoFilter = repos instanceof Array
  ? repos.map(repo => `repo:${repo}`).join(' ')
  : undefined
;

const cached = <A extends any[], R>(key: string, implementation: (...args: A) => Promise<R[]>) => async (...args: A) => {
  const cacheKey = `cache:${key}${repoFilter ? `?repo=${repoFilter}` : ''}`;
  const cached = localStorage.getItem(cacheKey);
  let result: R[];

  if (cached) {
    result = JSON.parse(cached || '') || [];
    console.log(`loaded ${key}: ${result.length}`);
    return result;
  } else {
    result = await implementation(...args);
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

  constructor() {
    super();
  }

  async load(setProgress: (progress: string) => void) {
    this.repositories = await this.discoverRepositories(setProgress);
    this.pullRequests = await this.discoverPullRequests(setProgress);
    this.reviewRequests = await this.discoverReviewRequests(setProgress);
    this.reviews = await this.discoverReviews(setProgress);
  }
 
  needsReposSelected = () => !repos || repos.length < 1;

  userOrgs = async () => {
    const formatOrg = (org: any) => ({
      name: org.login,
      id: org.id,
    });

    return this.queryAllPages(`/user/orgs`).then(items => items.map(formatOrg));
  };
  possibleRepositories = async (org: string): Promise<Repository[]> => {
    const formatRepo = (repo: any) => ({
      fullName: repo.full_name,
      id: repo.id,
    });

    return this.queryAllPages(`/orgs/${org}/repos`).then(items => items.map(formatRepo));
  };
    
  discoverRepositories = cached('repositories', async (setProgress: (progress: string) => void): Promise<Repository[]> => {
    const formatRepo = (repo: any) => ({
      fullName: repo.full_name,
      id: repo.id,
    });

    if (repoFilter) {
      setProgress(`querying repositories...`)
      const repos = await this.query(`/search/repositories?q=${repoFilter}`).then(({items}) => items.map(formatRepo));
      setProgress(`found repositories: \n -${repos.map((r: any) => r.fullName).join('\n -')}`)

      return repos;
    } else {
      alert('please specify a `?repo=openstax/rex-web` query param. you can specify the param multiple times to load more than one repo');
      throw new Error('please don\'t make me load everything....');
    }
  });

  discoverPullRequests = cached('pull-requests', async (setProgress: (progress: string) => void) => {
    const pullRequests: PullRequest[] = [];

    // "updated" is not helpful because we have scripts that re-label very old issues, so select on merged and
    // then separately all open prs (because i don't think logical or is supported in github search
    const mergedPrs = `is:pr ${repoFilter} merged:>=${moment().subtract(90, 'days').format('YYYY-MM-DD')}`
    const openPrs = `is:pr is:open ${repoFilter}`
      
    setProgress(`querying prs with\n  merged prs: ${mergedPrs}\n  open prs: ${openPrs}\nloading...`)
    const pullRequestsData = [
      ...await this.queryAllPages(`/search/issues`, {q: mergedPrs}),
      ...await this.queryAllPages(`/search/issues`, {q: openPrs})
    ];

    for (const pr of pullRequestsData) {
      try {
        const repoFullName = pr.repository_url.replace(/.*\.com\/repos\//, '');

        if (pr.labels.find(({name}: any) => name === 'release')) {
          setProgress(`  skipping pr ${repoFullName}#${pr.number} because its labeled as a release`)
          continue;
        }
          
        setProgress(`  loading commits for pr ${repoFullName}#${pr.number}...`)

        const commits = await this.queryAllPages(`/repos/${repoFullName}/pulls/${pr.number}/commits`);

        pullRequests.push({
          opener: pr.user.login as string,
          commits: commits.map(commit => ({
            date: commit.commit.committer.date as string,
          })),
          mergedAt: pr.pull_request.merged_at,
          createdAt: pr.created_at,
          title: pr.title,
          repoFullName,
          repoId: this.repositories.find(r => r.fullName == repoFullName)!.id,
          id: pr.number,
        });
      } catch (e) {
        console.error(e);
        setProgress(`[ERROR]: ${e.message}`)
      }
    }

    setProgress(`found ${pullRequests.length} pull requests`)
    return pullRequests;
  });

  discoverReviewRequests = cached('review-requests', async (setProgress: (progress: string) => void) => {
    const results = [];

    for (const pr of this.pullRequests) {
      setProgress(`  loading review requests for pr ${pr.repoFullName}#${pr.id}...`)
      results.push(
        ...await this.queryAllPages(`/repos/${pr.repoFullName}/issues/${pr.id}/events`).then(activities => activities
          .filter((activity: any) => activity.event === 'review_requested' && activity.requested_reviewer)
          .map((activity: any) => ({
            repoFullName: pr.repoFullName,
            prTitle: pr.title,
            prId: pr.id,
            requestedReviewer: activity.requested_reviewer.login,
            requestedAt: activity.created_at,
          })))
      );
    }
    
    setProgress(`found ${results.length} review requests`)

    return results;
  });

  discoverReviews = cached('reviews', async (setProgress: (progress: string) => void) => {
    const results = [];

    for (const pr of this.pullRequests) {
      setProgress(`  loading reviews for pr ${pr.repoFullName}#${pr.id}...`)
      results.push(
        ...await this.queryAllPages(`/repos/${pr.repoFullName}/pulls/${pr.id}/reviews`).then(reviews => reviews
          .map((review: any) => ({
            repoFullName: pr.repoFullName,
            prId: pr.id,
            reviewer: review.user.login,
            reviewedAt: review.submitted_at,
            state: review.state,
          })))
      );
    }
    
    setProgress(`found ${results.length} reviews`)

    return results;
  });

  private async queryAllPages(path: string, params: {[key: string]: string} = {}) {
    const results = [];
    const per_page = 100;
    let page = 1;
    let newPages = [];

    do  {
      const response = await this.query(path, {...params, page: String(page++), per_page: String(per_page)});
      newPages = 'items' in response ? response.items : response;
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
