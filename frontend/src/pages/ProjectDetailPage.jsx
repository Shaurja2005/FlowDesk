import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Kanban, List, Users, Activity, Plus, ArrowLeft, Settings, Code } from 'lucide-react';
import { projectsApi } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { AvatarGroup } from '../components/Avatar';
import { Spinner, EmptyState } from '../components/Spinner';
import KanbanBoard from '../components/KanbanBoard';
import TaskListView from '../components/TaskListView';
import ProjectMembersTab from '../components/ProjectMembersTab';
import ProjectActivityTab from '../components/ProjectActivityTab';
import CreateTaskDrawer from '../components/CreateTaskDrawer';
import ConnectRepoEmptyState from '../components/DevTab/ConnectRepoEmptyState';
import LinkRepoModal from '../components/DevTab/LinkRepoModal';
import ProjectDevTab from '../components/DevTab/ProjectDevTab';
import CodeSection from '../components/CodeSection';
import { formatDate } from '../utils/formatDate';
import toast from 'react-hot-toast';

const TABS = ['Board', 'List', 'Code', 'Members', 'Activity', 'Development'];

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Board');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await projectsApi.getById(id);
        setProject(data.data);
      } catch (err) {
        toast.error('Project not found');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const onTaskCreated = () => {
    setTaskRefreshKey((k) => k + 1);
    setShowCreateTask(false);
  };

  const handleLinkRepo = async (repoData) => {
    const res = await projectsApi.update(project._id, { linkedRepo: repoData });
    setProject(res.data.data);
  };

  const handleUnlinkRepo = async () => {
    try {
      const res = await projectsApi.update(project._id, { linkedRepo: { fullName: null, owner: null, name: null } });
      setProject(res.data.data);
      toast.success('Repository unlinked');
    } catch (err) {
      toast.error('Failed to unlink repository');
    }
  };

  const canManage = ['admin', 'manager'].includes(user?.role?.toLowerCase());
  const canCreateTask = true; // Anyone with project access can create tasks
  const members = project?.members?.map((m) => m.user).filter(Boolean) || [];

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!project) {
    return <EmptyState title="Project not found" message="This project doesn't exist or you don't have access." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects" className="btn-ghost text-xs flex items-center gap-1 mb-3 w-fit">
          <ArrowLeft size={14} /> Back to Projects
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0"
              style={{ background: project.coverColor || '#6C63FF' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              {project.description && (
                <p className="text-gray-500 text-sm mt-1 max-w-xl">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                {project.endDate && (
                  <span className="text-xs text-gray-600">Due {formatDate(project.endDate)}</span>
                )}
                <AvatarGroup users={members} max={5} size="xs" />
              </div>
            </div>
          </div>

          {/* Progress + actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Progress</p>
              <p className="text-lg font-bold text-white">{project.progress || 0}%</p>
            </div>
            {canCreateTask && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="btn-primary flex items-center gap-2"
                id="add-task-btn"
              >
                <Plus size={16} /> Add Task
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-dark-400 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${project.progress || 0}%`, background: 'linear-gradient(90deg, #6C63FF, #00D4FF)' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'Board' && <Kanban size={14} />}
            {tab === 'List' && <List size={14} />}
            {tab === 'Members' && <Users size={14} />}
            {tab === 'Activity' && <Activity size={14} />}
            {tab === 'Code' && <Code size={14} />}
            {tab === 'Development' && <Code size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Board' && <KanbanBoard projectId={id} refreshKey={taskRefreshKey} canManage={canManage} />}
        {activeTab === 'List' && <TaskListView projectId={id} refreshKey={taskRefreshKey} canManage={canManage} />}
        {activeTab === 'Code' && <CodeSection projectId={id} linkedRepo={project.linkedRepo} />}
        {activeTab === 'Members' && <ProjectMembersTab project={project} onUpdate={setProject} canManage={canManage} />}
        {activeTab === 'Activity' && <ProjectActivityTab projectId={id} />}
        {activeTab === 'Development' && (
          project.linkedRepo?.fullName ? (
            <ProjectDevTab project={project} onUnlink={handleUnlinkRepo} />
          ) : (
            <ConnectRepoEmptyState onConnectClick={() => setShowLinkModal(true)} />
          )
        )}
      </div>

      {/* Create Task Drawer */}
      {showCreateTask && (
        <CreateTaskDrawer
          isOpen={showCreateTask}
          project={project}
          onClose={() => setShowCreateTask(false)}
          onSuccess={onTaskCreated}
        />
      )}

      {/* Link Repo Modal */}
      <LinkRepoModal 
        isOpen={showLinkModal} 
        onClose={() => setShowLinkModal(false)} 
        onLink={handleLinkRepo} 
      />
    </div>
  );
};

export default ProjectDetailPage;
