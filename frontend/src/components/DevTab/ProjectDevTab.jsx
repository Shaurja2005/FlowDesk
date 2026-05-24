import { useState, useEffect } from 'react';
import { GitCommit, GitPullRequest, GitBranch, ExternalLink, Unlink } from 'lucide-react';
import GithubIcon from '../icons/GithubIcon';
import { githubApi } from '../../api/githubApi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProjectDevTab = ({ project, onUnlink }) => {
  const [activeTab, setActiveTab] = useState('commits');
  const [data, setData] = useState({ commits: [], pulls: { open: [], closed: [] }, branches: [] });
  const [loading, setLoading] = useState(true);

  const { owner, name, fullName } = project.linkedRepo;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'commits') {
          const res = await githubApi.getCommits(owner, name);
          setData(d => ({ ...d, commits: res.data.data }));
        } else if (activeTab === 'pulls') {
          const res = await githubApi.getPulls(owner, name);
          setData(d => ({ ...d, pulls: res.data.data }));
        } else if (activeTab === 'branches') {
          const res = await githubApi.getBranches(owner, name);
          setData(d => ({ ...d, branches: res.data.data }));
        }
      } catch (err) {
        toast.error('Failed to load GitHub data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, owner, name]);

  const tabs = [
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'branches', label: 'Branches', icon: GitBranch },
  ];

  return (
    <div className="animate-fade-in mt-6 space-y-6">
      {/* Repo Header */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#24292e] rounded-full flex items-center justify-center text-primary-content">
            <GithubIcon size={20} />
          </div>
          <div>
            <p className="text-sm text-secondary-content">Linked Repository</p>
            <a href={`https://github.com/${fullName}`} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary-content hover:text-primary-400 flex items-center gap-2">
              {fullName}
              <ExternalLink size={14} className="text-muted-content" />
            </a>
          </div>
        </div>
        <button onClick={onUnlink} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <Unlink size={16} className="mr-2 inline" />
          Unlink
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-dark-600">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-content'
                : 'border-transparent text-secondary-content hover:text-primary-content hover:border-dark-400'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="divide-y divide-dark-600">
            {/* COMMITS */}
            {activeTab === 'commits' && (
              data.commits.length > 0 ? data.commits.map(commit => (
                <div key={commit.sha} className="p-4 hover:bg-elevated/30 transition-colors flex justify-between items-start">
                  <div>
                    <a href={commit.htmlUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-content hover:text-primary-400 mb-1 block">
                      {commit.message}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-secondary-content">
                      {commit.author.avatarUrl ? (
                        <img src={commit.author.avatarUrl} alt={commit.author.login} className="w-4 h-4 rounded-full" />
                      ) : (
                        <div className="w-4 h-4 bg-dark-600 rounded-full" />
                      )}
                      <span>{commit.author.name}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(commit.author.date), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <a href={commit.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono bg-dark-600 px-2 py-1 rounded text-muted-content hover:text-primary-content">
                    {commit.shortSha}
                  </a>
                </div>
              )) : <div className="p-8 text-center text-muted-content">No commits found.</div>
            )}

            {/* PULL REQUESTS */}
            {activeTab === 'pulls' && (
              <>
                {[...data.pulls.open, ...data.pulls.closed].length > 0 ? (
                  [...data.pulls.open, ...data.pulls.closed].map(pr => (
                    <div key={pr.number} className="p-4 hover:bg-elevated/30 transition-colors flex justify-between items-start">
                      <div>
                        <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-content hover:text-primary-400 mb-1 flex items-center gap-2">
                          #{pr.number} {pr.title}
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            pr.state === 'open' ? 'bg-green-500/20 text-green-400' :
                            pr.state === 'merged' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {pr.state}
                          </span>
                        </a>
                        <div className="flex items-center gap-2 text-xs text-secondary-content">
                          <img src={pr.author.avatarUrl} alt={pr.author.login} className="w-4 h-4 rounded-full" />
                          <span>{pr.author.login}</span>
                          <span>•</span>
                          <span className="font-mono bg-elevated px-1 rounded">{pr.headBranch}</span>
                          <span>→</span>
                          <span className="font-mono bg-elevated px-1 rounded">{pr.baseBranch}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-content">
                        {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                ) : <div className="p-8 text-center text-muted-content">No pull requests found.</div>}
              </>
            )}

            {/* BRANCHES */}
            {activeTab === 'branches' && (
              data.branches.length > 0 ? data.branches.map(branch => (
                <div key={branch.name} className="p-4 hover:bg-elevated/30 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <GitBranch size={16} className="text-muted-content" />
                    <span className="font-medium font-mono text-primary-content">{branch.name}</span>
                    {branch.isDefault && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Default</span>
                    )}
                    {branch.protected && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-dark-600 text-muted-content">Protected</span>
                    )}
                  </div>
                  <a href={branch.commitUrl.replace('api.github.com/repos', 'github.com').replace('commits', 'commit')} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-content hover:text-primary-content">
                    {branch.commitSha.slice(0, 7)}
                  </a>
                </div>
              )) : <div className="p-8 text-center text-muted-content">No branches found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDevTab;
