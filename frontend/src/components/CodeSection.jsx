import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronRight, Copy, ExternalLink, X, FileQuestion, Book, AlertTriangle, Code as CodeIcon } from 'lucide-react';
import { getFileTree, getFileContent, getReadme } from '../api/codeApi';
import { githubApi } from '../api/githubApi';
import ConnectRepoEmptyState from './DevTab/ConnectRepoEmptyState';
import { Spinner } from './Spinner';
import toast from 'react-hot-toast';

const CodeSection = ({ projectId, linkedRepo }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [currentBranch, setCurrentBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [fileTree, setFileTree] = useState([]);
  const [openFile, setOpenFile] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState(null);

  if (!linkedRepo?.fullName) {
    return <ConnectRepoEmptyState onConnectClick={() => {
      toast('Go to the Development tab to link a repository first.', { icon: 'ℹ️' });
    }} />;
  }

  const { owner, name: repo } = linkedRepo;

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingTree(true);
        // Load branches
        const { data: bData } = await githubApi.getBranches(owner, repo);
        setBranches(bData.data || []);
        const defaultBranch = bData.data?.find(b => b.isDefault)?.name || bData.data?.[0]?.name || 'main';
        setCurrentBranch(defaultBranch);

        // Load root tree
        const { data: tData } = await getFileTree(owner, repo, '', defaultBranch);
        setFileTree(tData.data || []);

        // Attempt to load README if at root
        try {
          const { data: rData } = await getReadme(owner, repo);
          if (rData.data && rData.data.content) {
            setOpenFile({
              name: rData.data.name,
              path: rData.data.path,
              content: rData.data.content,
              isBinary: false,
              isReadme: true,
              htmlUrl: rData.data.htmlUrl
            });
          }
        } catch (err) {
          // No readme, that's fine
        }
      } catch (err) {
        setError('Failed to load repository data');
      } finally {
        setLoadingTree(false);
      }
    };
    fetchInitialData();
  }, [owner, repo]);

  const navigateToPath = async (path) => {
    try {
      setLoadingTree(true);
      const { data } = await getFileTree(owner, repo, path, currentBranch);
      setFileTree(data.data || []);
      setCurrentPath(path);
      // If we navigate away from root, we might want to clear the open file if it's the root README
      if (openFile?.isReadme && path !== '') {
        setOpenFile(null);
      }
    } catch (err) {
      toast.error('Failed to load directory');
    } finally {
      setLoadingTree(false);
    }
  };

  const loadFile = async (item) => {
    try {
      setLoadingFile(true);
      const { data } = await getFileContent(owner, repo, item.path, currentBranch);
      setOpenFile({
        ...data.data,
        isReadme: false
      });
    } catch (err) {
      if (err.response?.status === 413) {
        setOpenFile({
          name: item.name,
          path: item.path,
          isTooLarge: true,
          downloadUrl: item.downloadUrl
        });
      } else {
        toast.error('Failed to load file');
      }
    } finally {
      setLoadingFile(false);
    }
  };

  const handleBranchChange = async (e) => {
    const newBranch = e.target.value;
    setCurrentBranch(newBranch);
    setOpenFile(null);
    setCurrentPath('');
    try {
      setLoadingTree(true);
      const { data } = await getFileTree(owner, repo, '', newBranch);
      setFileTree(data.data || []);
    } catch (err) {
      toast.error('Failed to load branch');
    } finally {
      setLoadingTree(false);
    }
  };

  const copyContent = () => {
    if (openFile?.content) {
      navigator.clipboard.writeText(openFile.content);
      toast.success('Copied to clipboard');
    }
  };

  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getLanguageFromExt = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = { js: 'JavaScript', jsx: 'React', ts: 'TypeScript', tsx: 'React TS', py: 'Python', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown' };
    return map[ext] || ext.toUpperCase();
  };

  if (error) return <div className="p-8 text-center text-red-400 glass-card">{error}</div>;

  return (
    <div className="flex h-[700px] gap-4 bg-dark-900 border border-theme rounded-xl overflow-hidden shadow-card">
      {/* LEFT COLUMN: File Tree */}
      <div className="w-[280px] sm:w-[320px] flex flex-col bg-dark-800 border-r border-theme flex-shrink-0">
        <div className="p-4 border-b border-theme bg-dark-900/50">
          <select 
            value={currentBranch} 
            onChange={handleBranchChange}
            className="w-full bg-dark-700 border border-theme rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary-500 cursor-pointer"
          >
            {branches.map(b => (
              <option key={b.name} value={b.name}>
                {b.name} {b.isDefault ? '(default)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Breadcrumbs */}
        <div className="px-4 py-3 border-b border-theme bg-dark-800/80 overflow-x-auto whitespace-nowrap scrollbar-hide text-sm flex items-center gap-1">
          <button 
            onClick={() => navigateToPath('')} 
            className="text-primary-400 hover:text-primary-300 font-semibold"
          >
            {repo}
          </button>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const pathSoFar = breadcrumbs.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={pathSoFar}>
                <ChevronRight size={14} className="text-muted-content mx-0.5 flex-shrink-0" />
                <button 
                  onClick={() => !isLast && navigateToPath(pathSoFar)}
                  className={`${isLast ? 'text-secondary-content font-medium' : 'text-primary-400 hover:text-primary-300'}`}
                >
                  {crumb}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Tree List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loadingTree ? (
            <div className="space-y-2 p-2">
              <div className="skeleton h-8 w-full rounded" />
              <div className="skeleton h-8 w-full rounded" />
              <div className="skeleton h-8 w-3/4 rounded" />
            </div>
          ) : (
            <div className="space-y-0.5">
              {currentPath && (
                <button
                  onClick={() => {
                    const parts = currentPath.split('/');
                    parts.pop();
                    navigateToPath(parts.join('/'));
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-sm text-secondary-content transition-colors"
                >
                  <Folder size={16} className="text-primary-400/50" />
                  <span>..</span>
                </button>
              )}
              {fileTree.map(item => (
                <button
                  key={item.path}
                  onClick={() => item.type === 'dir' ? navigateToPath(item.path) : loadFile(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg text-sm transition-colors ${openFile?.path === item.path ? 'bg-primary-500/10 text-primary-400' : 'text-secondary-content'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item.type === 'dir' ? (
                      <Folder size={16} className="text-primary-400 flex-shrink-0" />
                    ) : (
                      <FileText size={16} className="text-muted-content flex-shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.type === 'file' && item.size && (
                    <span className="text-xs text-muted-content flex-shrink-0 ml-2">{formatSize(item.size)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: File Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-dark-900">
        {loadingFile ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : !openFile ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-content">
            <CodeIcon size={48} className="mb-4 opacity-20" />
            <p className="text-secondary-content font-medium">Select a file to view its contents</p>
            <p className="text-sm mt-1">{owner}/{repo}</p>
          </div>
        ) : (
          <>
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-3 border-b border-theme bg-dark-800/50">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm text-secondary-content truncate">
                  {openFile.isReadme && <Book size={14} className="inline mr-2 text-primary-400" />}
                  {openFile.path}
                </span>
                {openFile.size && (
                  <span className="badge bg-dark-700 text-muted-content border border-theme">
                    {formatSize(openFile.size)}
                  </span>
                )}
                {openFile.content && (
                  <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    {getLanguageFromExt(openFile.name)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {openFile.content && (
                  <button onClick={copyContent} className="p-1.5 text-muted-content hover:text-primary-content hover:bg-white/5 rounded transition-colors" title="Copy raw content">
                    <Copy size={16} />
                  </button>
                )}
                {(openFile.htmlUrl || openFile.downloadUrl) && (
                  <a 
                    href={openFile.htmlUrl || openFile.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-content hover:text-primary-content hover:bg-white/5 rounded transition-colors"
                    title="Open on GitHub"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <div className="w-px h-4 bg-border-color mx-1" />
                <button onClick={() => setOpenFile(null)} className="p-1.5 text-muted-content hover:text-red-400 hover:bg-white/5 rounded transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto bg-dark-900 relative">
              {openFile.isTooLarge ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <AlertTriangle size={48} className="text-orange-400 mb-4 opacity-80" />
                  <p className="text-secondary-content font-medium mb-2">File is too large to preview</p>
                  <p className="text-muted-content text-sm mb-6 max-w-md">
                    This file exceeds the 500KB preview limit. You can view it directly on GitHub.
                  </p>
                  <a 
                    href={openFile.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ExternalLink size={16} /> Open on GitHub
                  </a>
                </div>
              ) : openFile.isBinary ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <FileQuestion size={48} className="text-muted-content mb-4 opacity-50" />
                  <p className="text-secondary-content font-medium mb-2">Binary file — preview not available</p>
                  <p className="text-muted-content text-sm mb-6 max-w-md">
                    This file type cannot be displayed in the browser.
                  </p>
                  <a 
                    href={openFile.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ExternalLink size={16} /> Open on GitHub
                  </a>
                </div>
              ) : (
                <pre className="p-4 text-[13px] leading-relaxed font-mono text-primary-content/90 overflow-auto w-full h-full tab-size-4">
                  <code className="block w-full">
                    {openFile.content}
                  </code>
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CodeSection;
