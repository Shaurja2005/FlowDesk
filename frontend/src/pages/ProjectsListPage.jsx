import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, Calendar, Users } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { AvatarGroup } from '../components/Avatar';
import { SkeletonCard, EmptyState } from '../components/Spinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDate } from '../utils/formatDate';
import { PROJECT_COVER_COLORS } from '../utils/constants';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.string().optional(),
});

const ProjectCard = ({ project }) => (
  <Link
    to={`/projects/${project._id}`}
    className="glass-card group hover:border-primary-500/30 hover:shadow-glass transition-all duration-200 flex flex-col overflow-hidden"
  >
    {/* Color band */}
    <div className="h-1.5 w-full" style={{ background: project.coverColor || '#6C63FF' }} />

    <div className="p-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-primary-content group-hover:text-primary-500 transition-colors line-clamp-2">
          {project.title}
        </h3>
        <PriorityBadge priority={project.priority} />
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{project.taskCount || 0} tasks</span>
          <span>{project.progress || 0}%</span>
        </div>
        <div className="h-1.5 bg-dark-400 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress || 0}%`,
              background: `linear-gradient(90deg, #6C63FF, #00D4FF)`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <StatusBadge status={project.status} />
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {project.endDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(project.endDate)}
            </span>
          )}
          <AvatarGroup
            users={project.members?.map((m) => m.user).filter(Boolean) || []}
            max={3}
            size="xs"
          />
        </div>
      </div>
    </div>
  </Link>
);

const ProjectsListPage = () => {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { projects, pagination, isLoading, fetchProjects, createProject } = useProjects({
    search: debouncedSearch,
    status: statusFilter,
    page,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      await createProject({ ...data, tags, coverColor: PROJECT_COVER_COLORS[Math.floor(Math.random() * PROJECT_COVER_COLORS.length)] });
      setShowCreate(false);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const canCreate = ['admin', 'manager'].includes(user?.role);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination?.total || 0} projects
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} id="create-project-btn" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          message={canCreate ? "Create your first project to get started" : "You're not a member of any projects yet"}
          action={canCreate && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Create Project
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p) => <ProjectCard key={p._id} project={p} />)}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="New Project"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label">Title *</label>
            <input className={`input ${errors.title ? 'input-error' : ''}`} placeholder="My Awesome Project" {...register('title')} />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What's this project about?" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" {...register('status')}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" {...register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" {...register('startDate')} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" {...register('endDate')} />
            </div>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" placeholder="frontend, react, urgent" {...register('tags')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsListPage;
