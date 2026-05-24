import { useState, useEffect } from 'react';
import { GitBranch, GitPullRequest, Copy, Check } from 'lucide-react';
import GithubIcon from './icons/GithubIcon';
import { githubApi } from '../api/githubApi';
import toast from 'react-hot-toast';

const TaskDevSidebar = ({ project, task }) => {
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const linkedRepo = project?.linkedRepo;

  useEffect(() => {
    if (!linkedRepo?.fullName) {
      setLoading(false);
      return;
    }

    const loadPulls = async () => {
      try {
        const { data } = await githubApi.getPulls(linkedRepo.owner, linkedRepo.name);
        const openPulls = data.data.open.slice(0, 3);
        setPulls(openPulls);
      } catch (err) {
        console.error('Failed to load PRs');
      } finally {
        setLoading(false);
      }
    };

    loadPulls();
  }, [linkedRepo]);

  if (!linkedRepo?.fullName) {
    return (
      <div>
        <p className="text-xs text-muted-content mb-1.5 flex items-center gap-1">
          <GithubIcon size={11} /> Development
        </p>
        <p className="text-sm text-gray-600">No repo linked to this project</p>
      </div>
    );
  }

  // Generate suggested branch name: feature/task-id-title
  const shortId = task._id.slice(-4);
  const sanitizedTitle = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  const branchName = `feature/${shortId}-${sanitizedTitle}`;

  const copyBranch = () => {
    navigator.clipboard.writeText(branchName);
    setCopied(true);
    toast.success('Branch name copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs text-muted-content mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1"><GithubIcon size={11} /> Development</span>
        <a href={`https://github.com/${linkedRepo.fullName}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 truncate max-w-[120px]">
          {linkedRepo.name}
        </a>
      </p>

      {/* Suggested Branch */}
      <div className="mb-3">
        <button 
          onClick={copyBranch}
          className="w-full flex items-center justify-between p-2 rounded bg-dark-600 hover:bg-dark-500 border border-dark-500 transition-colors group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <GitBranch size={14} className="text-blue-400 flex-shrink-0" />
            <span className="text-xs font-mono text-secondary-content truncate">Create Branch</span>
          </div>
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-muted-content group-hover:text-primary-400" />}
        </button>
      </div>

      {/* Pull Requests */}
      <div>
        <p className="text-[10px] uppercase text-muted-content font-bold mb-1 tracking-wider">Open PRs</p>
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        ) : pulls.length > 0 ? (
          <div className="space-y-1.5">
            {pulls.map(pr => (
              <a 
                key={pr.number} 
                href={pr.htmlUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-1.5 rounded hover:bg-dark-600 transition-colors group"
              >
                <GitPullRequest size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-secondary-content group-hover:text-primary-content truncate">#{pr.number} {pr.title}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">No open pull requests.</p>
        )}
      </div>
    </div>
  );
};

export default TaskDevSidebar;
