import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Circle, ClipboardList, Clock3, Flag, Pencil, Plus, Trash2, X, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { utilityService } from '../services/utilityService';
import toast from 'react-hot-toast';

type TodoPriority = 'low' | 'medium' | 'high';
type TodoFilter = 'all' | 'active' | 'completed';

interface TodoSubtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoItem {
  id: string;
  title: string;
  notes: string;
  priority: TodoPriority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  subtasks?: TodoSubtask[];
}

interface TodoListProps {
  userEmail?: string;
}

const PRIORITY_STYLES: Record<TodoPriority, string> = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
  high: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
};

const FILTERS: Array<{ id: TodoFilter; label: string }> = [
  { id: 'all', label: 'All Tasks' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
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
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        setTasks(raw ? JSON.parse(raw) : []);
      } catch {
        setTasks([]);
      }
    };
    
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleMagicBreakdown = async (task: TodoItem) => {
    if (breakingDownId) return;
    setBreakingDownId(task.id);
    try {
      const prompt = `Break down the following task into 3 to 5 very short, actionable sub-tasks. Task: "${task.title}". Notes context: "${task.notes}". Output ONLY a valid JSON array of strings, e.g., ["subtask 1", "subtask 2"]. Do NOT output any markdown, conversational text, or backticks. Just the JSON array.`;
      const responseText = await utilityService.generateJson(prompt);
      
      let parsed: string[] = [];
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        toast.error("Failed to parse subtasks from AI.");
        setBreakingDownId(null);
        return;
      }

      if (!Array.isArray(parsed)) {
        toast.error("Unexpected AI format.");
        setBreakingDownId(null);
        return;
      }

      const newSubtasks: TodoSubtask[] = parsed.map(title => ({
        id: crypto.randomUUID(),
        title,
        completed: false
      }));

      setTasks(current => current.map(t => 
        t.id === task.id ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] } : t
      ));
      toast.success("Magic breakdown complete!");
    } catch (e) {
      toast.error("Failed to generate breakdown.");
    } finally {
      setBreakingDownId(null);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(current => current.map(t => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      }
      return t;
    }));
  };

  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 text-foreground magical-scrollbar">
      <div className="w-full space-y-6">
        
        {/* ── Header Area ──────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 relative z-10">
          <div>
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <ClipboardList size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-3 mb-2">
              ToDo List
              <Sparkles size={24} className="text-primary animate-pulse" />
            </h1>
            <p className="text-lg text-muted-foreground/80 max-w-2xl leading-relaxed">
              Capture tasks, prioritize the day, and keep your PAIVA workspace fully organized.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
            {[
              ['Total', stats.total, 'text-foreground/80'],
              ['Active', stats.active, 'text-sky-500'],
              ['Done', stats.completed, 'text-emerald-500'],
              ['Overdue', stats.overdue, 'text-rose-500'],
            ].map(([label, value, colorClass]) => (
              <div key={label} className="glass-surface-subtle rounded-2xl border border-border/50 p-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">{label}</div>
                <div className={cn("text-3xl font-black tracking-tighter drop-shadow-sm", colorClass)}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Content Grid ─────────────────────────────────── */}
        <div className="grid xl:grid-cols-[340px_1fr] gap-6 xl:gap-8 min-w-0">
          
          {/* ── Add/Edit Task Form (Sticky on Desktop) ───────────── */}
          <div className="xl:sticky top-0 h-max space-y-4 relative z-20">
            <div className="glass-surface border border-border/50 rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-3xl">
              
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              
              <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
                <div className="bg-primary/20 text-primary p-2 rounded-xl">
                  {editingId ? <Pencil size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                </div>
                {editingId ? 'Edit Task' : 'New Task'}
              </h2>

              <div className="space-y-5 relative z-10">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTask(); }}
                  placeholder="What needs to get done?"
                  className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-[15px] font-bold tracking-wide outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] transition-all duration-300 placeholder:font-medium placeholder:text-muted-foreground/40"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes, links, context..."
                  className="w-full h-32 bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-medium outline-none resize-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] transition-all duration-300 placeholder:text-muted-foreground/40 magical-scrollbar"
                />

                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as TodoPriority[]).map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPriority(item)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-[13px] font-bold capitalize transition-all duration-300',
                        priority === item
                          ? PRIORITY_STYLES[item]
                          : 'border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:scale-105 active:scale-95'
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-3 bg-background border border-border/60 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] cursor-pointer">
                  <CalendarDays size={18} className="text-primary" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-foreground cursor-pointer"
                  />
                </label>

                <div className="flex gap-3 pt-4">
                  {editingId && (
                    <Button type="button" onClick={resetForm} className="bg-secondary text-foreground hover:bg-secondary/80 flex-1 py-4 rounded-2xl font-bold tracking-wide transition-all hover:-translate-y-1 active:scale-95 border border-border/40">
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    onClick={saveTask} 
                    disabled={!title.trim()} 
                    className={cn(
                      "flex-1 gap-2 py-4 rounded-2xl font-bold tracking-wide transition-all shadow-[0_8px_20px_rgba(var(--primary),0.2)]",
                      "hover:-translate-y-1 active:scale-95",
                      editingId ? "" : "col-span-2",
                      !title.trim() ? "opacity-50 hover:translate-y-0" : "bg-gradient-to-r from-primary to-primary/80"
                    )}
                  >
                    {editingId ? <Check size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
                    {editingId ? 'Update' : 'Add Task'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Task Queue ───────────────────────────────────────── */}
          <div className="glass-surface-subtle border border-border/40 rounded-[2.5rem] p-6 sm:p-8 min-h-[500px] flex flex-col relative z-10 shadow-[0_10px_40px_rgba(0,0,0,0.05)] min-w-0">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-border/40 pb-6">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Clock3 size={24} className="text-primary" strokeWidth={2.5} />
                Task Queue
              </h2>
              
              {/* Filters */}
              <div className="flex rounded-2xl border border-border/50 bg-secondary/30 p-1.5 backdrop-blur-sm shadow-inner">
                {FILTERS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-300',
                      filter === item.id 
                        ? 'bg-foreground text-background shadow-md scale-105' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700 opacity-50">
                <div className="size-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6 shadow-inner">
                  <ClipboardList size={36} className="text-muted-foreground" />
                </div>
                <div className="text-2xl font-black tracking-tight mb-2">Queue is empty</div>
                <p className="text-base text-muted-foreground max-w-sm font-medium leading-relaxed">
                  {filter === 'completed' ? "You haven't completed any tasks yet." : 
                   filter === 'active' ? "You're all caught up! Take a break." : 
                   "Add a task to turn PAIVA into your daily planning cockpit."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleTasks.map((task, idx) => (
                  <article
                    key={task.id}
                    className={cn(
                      'group rounded-3xl border p-5 transition-all duration-500 ease-out relative overflow-hidden',
                      task.completed 
                        ? 'border-border/30 bg-secondary/10 opacity-60 grayscale-[50%]' 
                        : 'border-border/60 bg-card/60 hover:bg-card/90 hover:border-primary/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1'
                    )}
                    style={{ animation: `slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 50}ms both` }}
                  >
                    {/* Completion glow flash behind card */}
                    <div className={cn(
                      "absolute inset-0 bg-primary/20 opacity-0 transition-opacity duration-1000 pointer-events-none rounded-3xl",
                      task.completed && "animate-[pulse-fade_1s_ease-out]"
                    )} />

                    <div className="flex items-start gap-4 relative z-10">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          'mt-1 size-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 shadow-sm active:scale-90 hover:scale-110',
                          task.completed 
                            ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]' 
                            : 'border-muted-foreground/30 hover:border-primary text-transparent hover:text-primary/30'
                        )}
                        aria-label={task.completed ? 'Mark task active' : 'Mark task complete'}
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className={cn(
                            'font-bold text-[16px] break-words tracking-wide transition-all duration-300', 
                            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          )}>
                            {task.title}
                          </h3>
                          <span className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize transition-all duration-300', 
                            task.completed ? 'grayscale opacity-50' : '',
                            PRIORITY_STYLES[task.priority]
                          )}>
                            <Flag size={12} strokeWidth={2.5} /> {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-[11px] font-bold tracking-wide",
                              task.completed ? 'opacity-50' : 'text-muted-foreground'
                            )}>
                              <CalendarDays size={12} strokeWidth={2.5} /> {task.dueDate}
                            </span>
                          )}
                        </div>
                        
                        {task.notes && (
                          <p className={cn(
                            "text-[14px] leading-relaxed mt-2 whitespace-pre-wrap break-words transition-all duration-300",
                            task.completed ? 'text-muted-foreground/50' : 'text-muted-foreground/90'
                          )}>
                            {task.notes}
                          </p>
                        )}
                        
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-4 space-y-2.5 pl-3 border-l-2 border-primary/20">
                            {task.subtasks.map(st => (
                              <div key={st.id} className="flex items-start gap-2.5 group/st cursor-pointer" onClick={() => toggleSubtask(task.id, st.id)}>
                                <div className={cn("mt-0.5 size-4 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0", st.completed ? "bg-primary border-primary text-primary-foreground shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "border-muted-foreground/40 text-transparent group-hover/st:border-primary/50 group-hover/st:text-primary/30")}>
                                  <Check size={10} strokeWidth={3} />
                                </div>
                                <span className={cn("text-[13px] font-medium transition-all duration-300 flex-1 select-none", st.completed ? "line-through text-muted-foreground/40" : "text-foreground/80 group-hover/st:text-foreground")}>{st.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 bg-background/50 backdrop-blur-md rounded-2xl p-1.5 border border-border/50 shadow-sm shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMagicBreakdown(task)}
                          disabled={breakingDownId === task.id || task.completed}
                          className="p-2 rounded-xl text-primary hover:bg-primary/20 transition-all duration-200 disabled:opacity-50"
                          title="Magic Breakdown"
                        >
                          {breakingDownId === task.id ? <Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> : <Wand2 size={16} strokeWidth={2.5} />}
                        </button>
                        <div className="w-px h-5 bg-border/60 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/20 transition-all duration-200"
                          aria-label="Edit task"
                        >
                          <Pencil size={16} strokeWidth={2.5} />
                        </button>
                        <div className="w-px h-5 bg-border/60 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/20 transition-all duration-200"
                          aria-label="Delete task"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
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
