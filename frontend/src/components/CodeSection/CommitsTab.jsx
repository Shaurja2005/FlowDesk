import React, { useState, useEffect } from 'react';
import { GitCommit, ExternalLink } from 'lucide-react';
import { getCommits } from '../../api/codeApi';
import { Spinner, EmptyState } from '../Spinner';
import { formatRelative } from '../../utils/formatDate';
import { Link } from 'react-router-dom';

const CommitsTab = ({ linkedRepo }) => {
  const [commits, setCommits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const { data } = await getCommits(linkedRepo.owner, linkedRepo.name);
        setCommits(data.data || []);
      } catch (err) {
        setError('Failed to load commits');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [linkedRepo]);

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (commits.length === 0) return <EmptyState icon={GitCommit} title="No commits found" message="This repository has no commits yet." />;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {commits.map((commit) => (
        <div key={commit.sha} className="flex gap-4 p-4 rounded-xl bg-surface border border-theme hover:border-primary-500/30 transition-colors">
          <div className="flex flex-col items-center gap-2">
            {commit.author.avatarUrl ? (
              <img src={commit.author.avatarUrl} alt={commit.author.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-bold text-secondary-content">
                {commit.author.name.charAt(0)}
              </div>
            )}
            <div className="w-px h-full bg-theme"></div>
          </div>
          
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-primary-content text-base max-w-[500px] break-words">
                  {commit.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-content">
                  <span className="font-medium text-secondary-content">{commit.author.name}</span>
                  <span>committed {formatRelative(commit.author.date)}</span>
                </div>
              </div>
              <a 
                href={commit.htmlUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 px-2 py-1 rounded"
              >
                {commit.shortSha} <ExternalLink size={12} />
              </a>
            </div>

            {commit.taskKeys?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {commit.taskKeys.map(key => (
                  <Link 
                    key={key} 
                    to={`/tasks?search=${key}`}
                    className="badge bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-colors cursor-pointer"
                  >
                    {key}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommitsTab;
