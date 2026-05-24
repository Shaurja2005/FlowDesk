import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X, Check, Bug, Book, Layers, ListTree, UploadCloud, File,
  Search, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp,
  AlertTriangle, Clock, Paperclip, XCircle, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tasksApi } from '../api/tasksApi';
import { usersApi } from '../api/usersApi';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  workType: z.enum(['task', 'bug', 'story', 'epic', 'subtask']),
  summary: z.string().min(3, 'Summary is required (min 3 characters)'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'in-review', 'done', 'blocked']).optional(),
  assignedTo: z.string().optional().nullable(),
  priority: z.enum(['lowest', 'low', 'medium', 'high', 'critical']).optional(),
  parent: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  labels: z.array(z.string()).optional(),
  team: z.string().optional(),
  startDate: z.string().optional().nullable(),
  linkedItems: z.array(z.object({
    type: z.string(),
    task: z.string()
  })).optional(),
  restrictTo: z.array(z.string()).optional(),
  flagged: z.boolean().optional(),
});

const PRIORITY_ICONS = {
  lowest: <ChevronsDown size={16} className="text-blue-500" />,
  low: <ChevronDown size={16} className="text-blue-400" />,
  medium: <Check size={16} className="text-amber-500" />,
  high: <ChevronUp size={16} className="text-red-400" />,
  critical: <ChevronsUp size={16} className="text-red-500" />
};

const WORK_TYPES = [
  { id: 'task', label: 'Task', icon: Check, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'bug', label: 'Bug', icon: Bug, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'story', label: 'Story', icon: Book, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'epic', label: 'Epic', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'subtask', label: 'Subtask', icon: ListTree, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

const CreateTaskDrawer = ({ isOpen, onClose, project, onSuccess }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
  const [parentResults, setParentResults] = useState([]);
  const [linkedSearch, setLinkedSearch] = useState('');
  const [linkedResults, setLinkedResults] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [linkedItemsList, setLinkedItemsList] = useState([]);
  const [linkedType, setLinkedType] = useState('relates-to');
  const [labelInput, setLabelInput] = useState('');

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      workType: 'task',
      summary: '',
      description: '',
      status: 'todo',
      assignedTo: null,
      priority: 'medium',
      parent: null,
      dueDate: '',
      labels: [],
      team: '',
      startDate: '',
      flagged: false,
      restrictTo: [],
    }
  });

  const summary = watch('summary');
  const currentLabels = watch('labels') || [];

  useEffect(() => {
    if (isOpen) {
      usersApi.getAll().then(res => setUsers(res.data.data)).catch(console.error);
    } else {
      reset();
      setAttachments([]);
      setLinkedItemsList([]);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle Parent search
  useEffect(() => {
    if (parentSearch.length > 1) {
      const delay = setTimeout(() => {
        tasksApi.search(parentSearch, project._id).then(res => setParentResults(res.data.data)).catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setParentResults([]);
    }
  }, [parentSearch, project]);

  // Handle Linked search
  useEffect(() => {
    if (linkedSearch.length > 1) {
      const delay = setTimeout(() => {
        tasksApi.search(linkedSearch, project._id).then(res => setLinkedResults(res.data.data)).catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setLinkedResults([]);
    }
  }, [linkedSearch, project]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      if (!currentLabels.includes(labelInput.trim())) {
        setValue('labels', [...currentLabels, labelInput.trim()]);
      }
      setLabelInput('');
    }
  };

  const removeLabel = (label) => {
    setValue('labels', currentLabels.filter(l => l !== label));
  };

  const addLinkedItem = (task) => {
    if (!linkedItemsList.find(i => i.task._id === task._id)) {
      setLinkedItemsList(prev => [...prev, { type: linkedType, task }]);
    }
    setLinkedSearch('');
  };

  const removeLinkedItem = (taskId) => {
    setLinkedItemsList(prev => prev.filter(i => i.task._id !== taskId));
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        project: project._id,
        title: data.summary,
        workType: data.workType,
      };

      // Only add optional fields if they have values
      if (data.description?.trim()) payload.description = data.description;
      if (data.status) payload.status = data.status;
      if (data.assignedTo) payload.assignedTo = data.assignedTo;
      if (data.priority) payload.priority = data.priority;
      if (data.parent) payload.parentTask = data.parent;
      if (data.dueDate) payload.dueDate = data.dueDate;
      if (data.labels?.length) payload.labels = data.labels;
      if (data.team?.trim()) payload.team = data.team;
      if (data.startDate) payload.startDate = data.startDate;
      if (data.flagged) payload.flagged = true;
      if (data.restrictTo?.length) payload.restrictTo = data.restrictTo;
      
      if (linkedItemsList.length) {
        payload.linkedItems = linkedItemsList.map(item => ({
          type: item.type,
          task: item.task._id
        }));
      }

      const res = await tasksApi.create(payload);
      const newTaskId = res.data.data._id;

      // Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fd = new FormData();
          fd.append('file', file);
          await tasksApi.uploadAttachment(newTaskId, fd);
        }
      }

      toast.success('Task created successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  if (!isOpen) return null;

  const projectKey = project?.name?.substring(0, 3).toUpperCase() || 'KAN';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-dark-800 border-l border-theme shadow-2xl z-50 flex flex-col animate-slide-left">
        
        <div className="flex items-center justify-between p-5 border-b border-theme bg-dark-900/50">
          <h2 className="text-xl font-bold text-primary-content">Create issue</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted-content hover:text-primary-content transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="create-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Space */}
            <div>
              <label className="label">Space <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2 p-2.5 bg-dark-700/50 border border-theme rounded-lg text-secondary-content text-sm select-none">
                <div className="w-5 h-5 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold">
                  {projectKey[0]}
                </div>
                <span>{project?.title || 'Unknown Project'}</span>
                <span className="text-muted-content text-xs ml-auto font-mono">Key: {projectKey}</span>
              </div>
            </div>

            {/* 2. Work type */}
            <div>
              <label className="label">Work type <span className="text-red-500">*</span></label>
              <Controller
                name="workType"
                control={control}
                render={({ field }) => (
                  <div className="flex bg-dark-700/50 p-1 rounded-lg border border-theme w-fit">
                    {WORK_TYPES.map(type => {
                      const isActive = field.value === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => field.onChange(type.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            isActive ? 'bg-dark-600 text-primary-content shadow-sm' : 'text-muted-content hover:text-secondary-content'
                          }`}
                        >
                          <type.icon size={14} className={isActive ? type.color : ''} />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* 3. Summary */}
            <div>
              <label className="label">Summary <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={`input text-lg font-medium ${errors.summary ? 'input-error border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                placeholder="What needs to be done?"
                {...register('summary')}
              />
              {errors.summary && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.summary.message}
                </p>
              )}
            </div>

            <hr className="border-theme border-dashed my-8" />

            {/* 4. Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[120px] resize-y font-mono text-sm leading-relaxed"
                placeholder="Add a detailed description... (Markdown supported)"
                {...register('description')}
              />
              <p className="text-xs text-muted-content mt-1.5 flex items-center gap-1">
                <Book size={12} /> Markdown formatting is supported
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 5. Status */}
              <div>
                <label className="label">Status</label>
                <select className="input cursor-pointer" {...register('status')}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
                <p className="text-xs text-muted-content mt-1">(This is the initial status)</p>
              </div>

              {/* 7. Priority */}
              <div>
                <label className="label">Priority</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <select className="input cursor-pointer appearance-none pl-10" {...field}>
                        <option value="lowest">Lowest</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {PRIORITY_ICONS[field.value]}
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* 6. Assignee */}
              <div>
                <label className="label">Assignee</label>
                <select className="input cursor-pointer" {...register('assignedTo')}>
                  <option value="">Automatic</option>
                  <option value={user?._id}>Assign to me ({user?.name})</option>
                  <optgroup label="Team Members">
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 8. Parent */}
              <div className="relative">
                <label className="label">Parent</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-content" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Search tasks..."
                    value={parentSearch}
                    onChange={(e) => {
                      setParentSearch(e.target.value);
                      if (!e.target.value) setValue('parent', null);
                    }}
                  />
                  {parentResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-700 border border-theme rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {parentResults.map(task => (
                        <button
                          key={task._id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-dark-600 text-sm flex items-center gap-2"
                          onClick={() => {
                            setValue('parent', task._id);
                            setParentSearch(task.title);
                            setParentResults([]);
                          }}
                        >
                          <span className="text-muted-content font-mono text-xs">{projectKey}-{task._id.slice(-4)}</span>
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-content mt-1">Your work type hierarchy determines selectable items</p>
              </div>

              {/* 12. Start date */}
              <div>
                <label className="label">Start date</label>
                <input type="date" className="input" {...register('startDate')} />
              </div>

              {/* 9. Due date */}
              <div>
                <label className="label">Due date</label>
                <input type="date" className="input" {...register('dueDate')} />
              </div>

              {/* 10. Labels */}
              <div className="md:col-span-2">
                <label className="label">Labels</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentLabels.map(label => (
                    <span key={label} className="badge badge-primary flex items-center gap-1">
                      {label}
                      <button type="button" onClick={() => removeLabel(label)} className="hover:text-red-300">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="Type a label and press Enter"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={addLabel}
                />
              </div>

              {/* 11. Team */}
              <div className="md:col-span-2">
                <label className="label">Team</label>
                <input type="text" className="input" placeholder="e.g. Frontend Guild" {...register('team')} />
                <p className="text-xs text-muted-content mt-1">Associates a team to an issue</p>
              </div>
            </div>

            {/* 14. Attachment */}
            <div>
              <label className="label flex items-center justify-between">
                <span>Attachment</span>
                <button type="button" className="text-xs text-primary-400 hover:underline" onClick={() => document.getElementById('file-upload').click()}>
                  Browse
                </button>
              </label>
              <div
                className="border-2 border-dashed border-theme rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <UploadCloud size={32} className="text-muted-content mb-3" />
                <p className="text-sm font-medium text-secondary-content">Drag and drop files here</p>
                <p className="text-xs text-muted-content mt-1">or click to browse from your computer</p>
                <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileDrop} />
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-dark-700/50 border border-theme rounded-lg">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File size={16} className="text-primary-400 flex-shrink-0" />
                        <span className="text-sm text-secondary-content truncate">{file.name}</span>
                        <span className="text-xs text-muted-content flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button type="button" onClick={() => removeAttachment(i)} className="text-muted-content hover:text-red-400 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 15. Linked work items */}
            <div className="p-4 rounded-xl border border-theme bg-dark-800/50 space-y-4">
              <label className="label">Linked work items</label>
              <div className="flex gap-3">
                <select 
                  className="input w-1/3 cursor-pointer" 
                  value={linkedType}
                  onChange={(e) => setLinkedType(e.target.value)}
                >
                  <option value="blocks">blocks</option>
                  <option value="is-blocked-by">is blocked by</option>
                  <option value="relates-to">relates to</option>
                  <option value="duplicates">duplicates</option>
                </select>
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-content" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Search issues to link..."
                    value={linkedSearch}
                    onChange={(e) => setLinkedSearch(e.target.value)}
                  />
                  {linkedResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-700 border border-theme rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {linkedResults.map(task => (
                        <button
                          key={task._id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-dark-600 text-sm flex items-center gap-2"
                          onClick={() => addLinkedItem(task)}
                        >
                          <span className="text-muted-content font-mono text-xs">{projectKey}-{task._id.slice(-4)}</span>
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {linkedItemsList.length > 0 && (
                <div className="space-y-2 mt-2">
                  {linkedItemsList.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-2 bg-dark-700/30 rounded border border-theme/50">
                      <span className="text-muted-content italic whitespace-nowrap">{item.type}</span>
                      <span className="font-medium text-primary-400">{projectKey}-{item.task._id.slice(-4)}</span>
                      <span className="text-secondary-content truncate">{item.task.title}</span>
                      <button type="button" onClick={() => removeLinkedItem(item.task._id)} className="ml-auto text-muted-content hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 16. Restrict to */}
            <div>
              <label className="label">Restrict to</label>
              <select multiple className="input min-h-[80px]" {...register('restrictTo')}>
                <option value="admin">Administrators</option>
                <option value="manager">Managers</option>
                <option value="developer">Developers</option>
              </select>
              <p className="text-xs text-muted-content mt-1">Hold Ctrl/Cmd to select multiple. Leave blank for no restrictions.</p>
            </div>

            {/* 17. Flagged */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <input type="checkbox" id="flagged" className="mt-1 accent-amber-500 w-4 h-4" {...register('flagged')} />
              <div>
                <label htmlFor="flagged" className="font-medium text-amber-500 cursor-pointer">Impediment</label>
                <p className="text-sm text-amber-500/70 mt-0.5">Allows flagging issues with impediments</p>
              </div>
            </div>

            {/* 13. Reporter */}
            <div>
              <label className="label">Reporter <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3 p-2.5 bg-dark-700/50 border border-theme rounded-lg">
                <Avatar user={user} size="sm" clickable={false} />
                <span className="text-sm font-medium text-secondary-content">{user?.name}</span>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-theme bg-dark-900/50 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={!summary || summary.length < 3 || isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Creating...' : 'Create issue'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateTaskDrawer;
