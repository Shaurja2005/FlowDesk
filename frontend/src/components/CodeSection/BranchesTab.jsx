import React, { useState, useEffect } from 'react';
import { GitBranch, ExternalLink, ShieldCheck } from 'lucide-react';
import { getBranches } from '../../api/codeApi';
import { Spinner, EmptyState } from '../Spinner';

const BranchesTab = ({ linkedRepo }) => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const { data } = await getBranches(linkedRepo.owner, linkedRepo.name);
        
        // Sort default branch first
        const sorted = data.data.sort((a, b) => {
          if (a.isDefault) return -1;
          if (b.isDefault) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setBranches(sorted);
      } catch (err) {
        setError('Failed to load branches');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [linkedRepo]);

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (branches.length === 0) return <EmptyState icon={GitBranch} title="No branches found" message="This repository has no branches." />;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {branches.map((branch) => (
        <div key={branch.name} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-theme hover:border-primary-500/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${branch.isDefault ? 'bg-primary-500/20 text-primary-400' : 'bg-elevated text-secondary-content'}`}>
              <GitBranch size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary-content text-base">{branch.name}</span>
                {branch.isDefault && (
                  <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    Default
                  </span>
                )}
                {branch.protected && (
                  <span className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <ShieldCheck size={12} className="mr-1" /> Protected
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-content mt-1 flex items-center gap-1 font-mono">
                {branch.commitSha.slice(0, 7)}
              </p>
            </div>
          </div>
          
          <a 
            href={branch.commitUrl.replace('api.github.com/repos', 'github.com').replace('commits', 'commit')} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-secondary-content hover:text-primary-content bg-elevated hover:bg-dark-600 rounded-lg transition-colors"
            title="View latest commit on GitHub"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      ))}
    </div>
  );
};

export default BranchesTab;
