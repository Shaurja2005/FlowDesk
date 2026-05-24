import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, Clock, Calendar, Tag,
  MessageSquare, Send, User, Timer,
} from 'lucide-react';
import { tasksApi } from '../api/tasksApi';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import { Spinner, EmptyState } from '../components/Spinner';
import { ConfirmDialog } from '../components/Modal';
import TaskDevSidebar from '../components/TaskDevSidebar';
import { formatDate, formatRelative, isOverdue } from '../utils/formatDate';
import { TASK_STATUSES, PRIORITIES } from '../utils/constants';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await tasksApi.getById(id);
        setTask(data.data);
        setEditForm({
          title: data.data.title,
          description: data.data.description || '',
          status: data.data.status,
          priority: data.data.priority,
          dueDate: data.data.dueDate ? data.data.dueDate.slice(0, 10) : '',
          estimatedHours: data.data.estimatedHours,
        });
      } catch {
        toast.error('Task not found');
      } finally { setIsLoading(false); }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    try {
      const { data } = await tasksApi.update(id, editForm);
      setTask(data.data);
      setIsEditing(false);
      toast.success('Task updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await tasksApi.delete(id);
      toast.success('Task deleted');
      navigate(-1);
    } catch { toast.error('Failed to delete'); }
    finally { setIsDeleting(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsPosting(true);
    try {
      const { data } = await tasksApi.addComment(id, { text: commentText });
      setTask((prev) => ({ ...prev, comments: [...(prev.comments || []), data.data] }));
      setCommentText('');
    } catch { toast.error('Failed to post comment'); }
    finally { setIsPosting(false); }
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!logHours || parseFloat(logHours) <= 0) return;
    setIsLoggingTime(true);
    try {
      const { data } = await tasksApi.logTime(id, { hours: parseFloat(logHours) });
      setTask((prev) => ({ ...prev, loggedHours: data.data.loggedHours }));
      setLogHours('');
      toast.success('Time logged!');
    } catch { toast.error('Failed to log time'); }
    finally { setIsLoggingTime(false); }
  };

  const canEdit = user?.role !== 'developer' ||
    task?.assignedTo?._id === user._id ||
    task?.createdBy?._id === user._id;

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!task) return <EmptyState title="Task not found" />;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost text-xs flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title + actions */}
          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              {isEditing ? (
                <input
                  className="input text-lg font-bold flex-1"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              ) : (
                <h1 className="text-xl font-bold text-white flex-1">{task.title}</h1>
              )}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canEdit && (
                  <>
                    {isEditing ? (
                      <>
                        <button onClick={handleSave} className="btn-primary text-xs px-3 py-1.5">Save</button>
                        <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="btn-ghost p-2"><Edit2 size={15} /></button>
                    )}
                  </>
                )}
                {(user?.role !== 'developer') && (
                  <button onClick={() => setShowDelete(true)} className="btn-ghost p-2 text-red-400">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Status + Priority (inline edit) */}
            <div className="flex flex-wrap gap-2 mb-4">
              {isEditing ? (
                <>
                  <select className="input w-36 text-sm" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                    {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select className="input w-32 text-sm" value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Description</p>
              {isEditing ? (
                <textarea
                  className="input resize-none w-full"
                  rows={5}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {task.description || <span className="text-gray-600">No description</span>}
                </p>
              )}
            </div>

            {/* Labels */}
            {task.labels?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {task.labels.map((l) => (
                  <span key={l} className="px-2 py-0.5 rounded bg-primary-500/15 text-primary-400 border border-primary-500/20 text-xs">
                    <Tag size={10} className="inline mr-1" />{l}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <MessageSquare size={15} className="text-primary-400" /> Comments ({task.comments?.length || 0})
            </h2>

            <div className="space-y-4 mb-4">
              {task.comments?.length === 0 && (
                <p className="text-gray-600 text-sm">No comments yet. Start the conversation!</p>
              )}
              {task.comments?.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <Avatar user={c.user} size="sm" className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{c.user?.name}</span>
                      <span className="text-xs text-gray-600">{formatRelative(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment form */}
            <form onSubmit={handleComment} className="flex gap-3">
              <Avatar user={user} size="sm" className="flex-shrink-0 mt-1" />
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="input flex-1"
                />
                <button type="submit" disabled={isPosting || !commentText.trim()} className="btn-primary p-2">
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar: meta */}
        <div className="space-y-4">
          <div className="glass-card p-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><User size={11} /> Assignee</p>
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar user={task.assignedTo} size="sm" />
                  <span className="text-sm text-gray-300">{task.assignedTo.name}</span>
                </div>
              ) : <p className="text-sm text-gray-600">Unassigned</p>}
            </div>

            <div className="divider" />

            <div>
              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><User size={11} /> Reporter</p>
              {task.createdBy && (
                <div className="flex items-center gap-2">
                  <Avatar user={task.createdBy} size="sm" />
                  <span className="text-sm text-gray-300">{task.createdBy.name}</span>
                </div>
              )}
            </div>

            <div className="divider" />

            <div>
              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Calendar size={11} /> Due Date</p>
              {isEditing ? (
                <input type="date" className="input text-sm" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
              ) : (
                <p className={`text-sm ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-400' : 'text-gray-300'}`}>
                  {formatDate(task.dueDate)}
                </p>
              )}
            </div>

            <div className="divider" />

            {/* Time tracking */}
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Timer size={11} /> Time Tracking</p>
              <div className="text-sm text-gray-300 mb-2">
                <span className="font-medium text-white">{task.loggedHours || 0}h</span> logged
                {task.estimatedHours > 0 && <> / <span className="text-gray-500">{task.estimatedHours}h est.</span></>}
              </div>
              {task.estimatedHours > 0 && (
                <div className="h-1.5 bg-dark-400 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${Math.min(100, ((task.loggedHours || 0) / task.estimatedHours) * 100)}%` }}
                  />
                </div>
              )}
              <form onSubmit={handleLogTime} className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  placeholder="Hours"
                  className="input text-sm flex-1"
                />
                <button type="submit" disabled={isLoggingTime} className="btn-secondary text-xs px-3">
                  {isLoggingTime ? '...' : 'Log'}
                </button>
              </form>
            </div>

            <div className="divider" />

            <div>
              <p className="text-xs text-gray-500 mb-1">Project</p>
              {task.project && (
                <Link to={`/projects/${task.project._id}`} className="text-primary-400 hover:text-primary-300 text-sm">
                  {task.project.title}
                </Link>
              )}
            </div>

            <div className="divider" />

            {/* Development Sidebar Section */}
            <TaskDevSidebar project={task.project} task={task} />

            <div className="divider" />

            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm text-gray-400">{formatRelative(task.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="This action cannot be undone. All comments and subtasks will be deleted."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TaskDetailPage;
