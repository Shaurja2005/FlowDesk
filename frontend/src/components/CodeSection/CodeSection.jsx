import React, { useState } from 'react';
import { Code2, GitCommit, GitPullRequest, GitBranch } from 'lucide-react';
import ConnectRepoEmptyState from '../DevTab/ConnectRepoEmptyState';
import toast from 'react-hot-toast';

import FilesTab from './FilesTab';
import CommitsTab from './CommitsTab';
import PullRequestsTab from './PullRequestsTab';
import BranchesTab from './BranchesTab';

const CodeSection = ({ projectId, linkedRepo }) => {
  const [activeTab, setActiveTab] = useState('files');

  if (!linkedRepo?.fullName) {
    return (
      <ConnectRepoEmptyState 
        onConnectClick={() => {
          toast('Go to the Development tab to link a repository first.', { icon: 'ℹ️' });
        }} 
      />
    );
  }

  const tabs = [
    { id: 'files', label: 'Files', icon: Code2 },
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'branches', label: 'Branches', icon: GitBranch },
  ];

  return (
    <div className="flex flex-col h-[700px] bg-base border border-theme rounded-xl overflow-hidden shadow-card">
      {/* Code Header Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-theme bg-surface/50 shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                  : 'text-secondary-content hover:text-gray-200 hover:bg-elevated'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
        
        <div className="ml-auto text-sm text-muted-content px-4">
          <span className="font-mono text-secondary-content">{linkedRepo.owner}/{linkedRepo.name}</span>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'files' && <FilesTab projectId={projectId} linkedRepo={linkedRepo} />}
        {activeTab === 'commits' && <CommitsTab linkedRepo={linkedRepo} />}
        {activeTab === 'pulls' && <PullRequestsTab linkedRepo={linkedRepo} />}
        {activeTab === 'branches' && <BranchesTab linkedRepo={linkedRepo} />}
      </div>
    </div>
  );
};

export default CodeSection;
