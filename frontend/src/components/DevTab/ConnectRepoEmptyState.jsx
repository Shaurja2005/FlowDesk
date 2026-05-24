import GithubIcon from '../icons/GithubIcon';

const ConnectRepoEmptyState = ({ onConnectClick }) => {
  return (
    <div className="glass-card p-12 text-center flex flex-col items-center justify-center animate-fade-in mt-6">
      <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center text-primary-content mb-4 shadow-lg border border-primary-500/20">
        <GithubIcon size={32} />
      </div>
      <h3 className="text-xl font-bold text-primary-content mb-2">Connect a Repository</h3>
      <p className="text-secondary-content max-w-md mb-6">
        Link a GitHub repository to this project to sync commits, pull requests, and branches directly in FlowDesk.
      </p>
      <button onClick={onConnectClick} className="btn-primary px-6 py-2.5">
        Link Repository
      </button>
    </div>
  );
};

export default ConnectRepoEmptyState;
