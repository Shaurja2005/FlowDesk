import { useState, useEffect } from 'react';
import { X, Search, AlertTriangle } from 'lucide-react';
import GithubIcon from '../icons/GithubIcon';
import { githubApi } from '../../api/githubApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LinkRepoModal = ({ isOpen, onClose, onLink }) => {
  const { user } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (isOpen && user?.github?.accessToken) {
      setLoading(true);
      githubApi.getRepos()
        .then(({ data }) => setRepos(data.data || []))
        .catch(() => toast.error('Failed to load repositories'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSelect = async (repo) => {
    setLinking(true);
    try {
      await onLink({
        fullName: repo.fullName,
        owner: repo.owner,
        name: repo.name,
      });
      toast.success('Repository linked successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to link repository');
    } finally {
      setLinking(false);
    }
  };

  const filteredRepos = repos.filter(r => r.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-primary-content flex items-center gap-2">
            <GithubIcon size={20} />
            Link Repository
          </h2>
          <button onClick={onClose} className="text-muted-content hover:text-primary-content transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {!user?.github?.accessToken ? (
            <div className="text-center py-8">
              <AlertTriangle size={40} className="mx-auto text-amber-500 mb-3" />
              <p className="text-primary-content font-medium mb-2">GitHub not connected</p>
              <p className="text-secondary-content text-sm mb-4">You need to connect your GitHub account before you can link a repository.</p>
              <a href="/settings?tab=integrations" className="btn-primary inline-flex items-center">
                Go to Settings
              </a>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-content" size={18} />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  className="input pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredRepos.length > 0 ? (
                <div className="space-y-2">
                  {filteredRepos.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelect(repo)}
                      disabled={linking}
                      className="w-full text-left p-3 rounded-lg border border-dark-600 bg-dark-700/50 hover:bg-dark-600 hover:border-primary-500/30 transition-colors flex items-center justify-between group disabled:opacity-50"
                    >
                      <div>
                        <p className="font-medium text-primary-content group-hover:text-primary-400 transition-colors">{repo.fullName}</p>
                        {repo.description && (
                          <p className="text-xs text-muted-content mt-1 line-clamp-1">{repo.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-dark-800 rounded text-secondary-content">
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-content py-8">No repositories found.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkRepoModal;
