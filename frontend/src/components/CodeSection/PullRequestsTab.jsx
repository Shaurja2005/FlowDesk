import React, { useState, useEffect } from 'react';
import { GitPullRequest, ExternalLink, GitMerge, CheckCircle2, GitBranch, GitCommit } from 'lucide-react';
import { getPullRequests } from '../../api/codeApi';
import { Spinner, EmptyState } from '../Spinner';
import { formatRelative } from '../../utils/formatDate';

const PullRequestsTab = ({ linkedRepo }) => {
  const [pulls, setPulls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const { data } = await getPullRequests(linkedRepo.owner, linkedRepo.name);
        const allPulls = [...(data.data.open || []), ...(data.data.closed || [])];
        // Sort by created descending
        allPulls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPulls(allPulls);
      } catch (err) {
        setError('Failed to load pull requests');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [linkedRepo]);

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (pulls.length === 0) return <EmptyState icon={GitPullRequest} title="No PRs found" message="This repository has no pull requests yet." />;

  const getStateBadge = (state) => {
    switch (state) {
      case 'open':
        return <span className="badge bg-green-500/10 text-green-400 border-green-500/20"><GitPullRequest size={12} className="mr-1" /> Open</span>;
      case 'merged':
        return <span className="badge bg-purple-500/10 text-purple-400 border-purple-500/20"><GitMerge size={12} className="mr-1" /> Merged</span>;
      case 'closed':
      default:
        return <span className="badge bg-red-500/10 text-red-400 border-red-500/20"><CheckCircle2 size={12} className="mr-1" /> Closed</span>;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {pulls.map((pr) => (
        <div key={pr.number} className="flex gap-4 p-4 rounded-xl bg-surface border border-theme hover:border-primary-500/30 transition-colors">
          <div className="flex flex-col items-center gap-2">
            {pr.author.avatarUrl ? (
              <img src={pr.author.avatarUrl} alt={pr.author.login} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-bold text-secondary-content">
                {pr.author.login.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold text-primary-content text-base">
                  {pr.title} <span className="text-muted-content font-normal ml-1">#{pr.number}</span>
                </h3>
              </div>
              <a 
                href={pr.htmlUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1.5 text-secondary-content hover:text-primary-content bg-elevated hover:bg-dark-600 rounded-lg transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-content mb-3">
              {getStateBadge(pr.state)}
              <span>opened {formatRelative(pr.createdAt)} by <span className="text-secondary-content font-medium">{pr.author.login}</span></span>
              {pr.mergedAt && <span>• merged {formatRelative(pr.mergedAt)}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-content">
              <div className="flex items-center gap-1.5 bg-base px-2 py-1 rounded">
                <GitBranch size={12} /> {pr.baseBranch} ← {pr.headBranch}
              </div>
              <div className="flex items-center gap-1.5 bg-base px-2 py-1 rounded">
                <GitCommit size={12} /> {pr.commits} commits
              </div>
              <div className="flex items-center gap-1.5 bg-base px-2 py-1 rounded">
                <span className="text-blue-400">Changed {pr.changedFiles} files</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PullRequestsTab;
