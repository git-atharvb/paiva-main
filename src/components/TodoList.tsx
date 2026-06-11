import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Circle, ClipboardList, Clock3, Flag, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

type TodoPriority = 'low' | 'medium' | 'high';
type TodoFilter = 'all' | 'active' | 'completed';

interface TodoItem {
  id: string;
  title: string;
  notes: string;
  priority: TodoPriority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

interface TodoListProps {
  userEmail?: string;
}

const PRIORITY_STYLES: Record<TodoPriority, string> = {
  low: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  high: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
};

const FILTERS: Array<{ id: TodoFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Done' },
];

const createStorageKey = (userEmail?: string) => `paiva.todos.${userEmail || 'local'}`;

export default function TodoList({ userEmail }: TodoListProps) {
  const storageKey = createStorageKey(userEmail);
  const [tasks, setTasks] = useState<TodoItem[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        setTasks(raw ? JSON.parse(raw) : []);
      } catch {
        setTasks([]);
      }
    };
    
    // In case storageKey changes or we want to listen to external changes
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [storageKey, tasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.length - completed;
    const overdue = tasks.filter(task => task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString())).length;
    return { total: tasks.length, completed, active, overdue };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      });
  }, [filter, tasks]);

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setPriority('medium');
    setDueDate('');
    setEditingId(null);
  };

  const saveTask = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (editingId) {
      setTasks(current => current.map(task => (
        task.id === editingId
          ? { ...task, title: trimmedTitle, notes: notes.trim(), priority, dueDate }
          : task
      )));
      resetForm();
      return;
    }

    const nextTask: TodoItem = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      notes: notes.trim(),
      priority,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(current => [nextTask, ...current]);
    resetForm();
  };

  const startEdit = (task: TodoItem) => {
    setEditingId(task.id);
    setTitle(task.title);
    setNotes(task.notes);
    setPriority(task.priority);
    setDueDate(task.dueDate);
  };

  const toggleTask = (id: string) => {
    setTasks(current => current.map(task => (
      task.id === id ? { ...task, completed: !task.completed } : task
    )));
  };

  const deleteTask = (id: string) => {
    setTasks(current => current.filter(task => task.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <section className="h-full overflow-y-auto p-5 md:p-6 text-foreground">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-bold tracking-wide mb-2">
              <ClipboardList size={18} />
              PAIVA Planner
            </div>
            <h1 className="text-3xl font-black tracking-tight">ToDo List</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Capture tasks, prioritize the day, and keep your assistant workspace organized.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-full lg:min-w-[420px]">
            {[
              ['Total', stats.total],
              ['Active', stats.active],
              ['Done', stats.completed],
              ['Overdue', stats.overdue],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/40 bg-secondary/25 px-4 py-3">
                <div className="text-xs text-muted-foreground font-semibold">{label}</div>
                <div className="text-2xl font-black mt-1">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-[380px_1fr] gap-5">
          <div className="rounded-2xl border border-border/45 bg-card/70 p-5 shadow-1">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              {editingId ? <Pencil size={16} className="text-primary" /> : <Plus size={16} className="text-primary" />}
              {editingId ? 'Edit Task' : 'Add Task'}
            </h2>

            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTask(); }}
                placeholder="What needs to get done?"
                className="w-full frosted-input rounded-xl px-4 py-3 text-sm font-medium outline-none"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes, links, context..."
                className="w-full h-24 frosted-input rounded-xl px-4 py-3 text-sm outline-none resize-none"
              />

              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as TodoPriority[]).map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPriority(item)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-bold capitalize transition-all',
                      priority === item
                        ? PRIORITY_STYLES[item]
                        : 'border-border/40 bg-secondary/25 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 frosted-input rounded-xl px-4 py-3 text-sm">
                <CalendarDays size={16} className="text-muted-foreground" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-foreground"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="primary" onClick={saveTask} disabled={!title.trim()} className="flex-1 gap-2">
                  {editingId ? <Check size={16} /> : <Plus size={16} />}
                  {editingId ? 'Save Task' : 'Add Task'}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={resetForm} size="icon" aria-label="Cancel edit">
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/45 bg-card/55 p-5 shadow-1 min-h-[520px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Clock3 size={16} className="text-primary" />
                Task Queue
              </h2>
              <div className="flex rounded-xl border border-border/40 bg-secondary/25 p-1">
                {FILTERS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      filter === item.id ? 'bg-primary text-primary-foreground shadow-neon-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="h-[420px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border/50 bg-secondary/15">
                <ClipboardList size={44} className="text-muted-foreground/50 mb-4" />
                <div className="text-lg font-bold">No tasks here</div>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Add a task to turn PAIVA into your daily planning cockpit.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleTasks.map(task => (
                  <article
                    key={task.id}
                    className={cn(
                      'group rounded-xl border border-border/40 bg-secondary/20 p-4 transition-all hover:border-primary/25 hover:bg-secondary/30',
                      task.completed && 'opacity-65'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          'mt-0.5 size-7 rounded-full flex items-center justify-center border transition-all shrink-0',
                          task.completed ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-muted-foreground'
                        )}
                        aria-label={task.completed ? 'Mark task active' : 'Mark task complete'}
                      >
                        {task.completed ? <Check size={15} /> : <Circle size={15} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={cn('font-bold text-sm break-words', task.completed && 'line-through text-muted-foreground')}>
                            {task.title}
                          </h3>
                          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize', PRIORITY_STYLES[task.priority])}>
                            <Flag size={11} /> {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-card/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                              <CalendarDays size={11} /> {task.dueDate}
                            </span>
                          )}
                        </div>
                        {task.notes && (
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                            {task.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50"
                          aria-label="Edit task"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
