import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface AssignmentTask {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export const StudyCompanionTool: React.FC = () => {
  // Focus Timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'study' | 'short-break' | 'long-break'>('study');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const switchTimerMode = (mode: 'study' | 'short-break' | 'long-break') => {
    setTimerMode(mode);
    setIsRunning(false);
    if (mode === 'study') setSecondsLeft(25 * 60);
    else if (mode === 'short-break') setSecondsLeft(5 * 60);
    else setSecondsLeft(15 * 60);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Assignment Tracker state
  const [tasks, setTasks] = useState<AssignmentTask[]>([
    {
      id: '1',
      title: 'Submit CSC-301 Term Project Monograph (PDF Merged)',
      course: 'CSC-301',
      dueDate: 'Tomorrow, 11:59 PM',
      priority: 'High',
      completed: false,
    },
    {
      id: '2',
      title: 'Sign Scholarship Verification Document',
      course: 'ADMIN',
      dueDate: 'Friday',
      priority: 'High',
      completed: true,
    },
    {
      id: '3',
      title: 'Read Chapters 4-6 on Distributed Consensus',
      course: 'CSC-301',
      dueDate: 'Next Monday',
      priority: 'Medium',
      completed: false,
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('CSC-301');
  const [newDueDate, setNewDueDate] = useState('');

  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: AssignmentTask = {
      id: `${Date.now()}`,
      title: newTitle.trim(),
      course: newCourse.trim().toUpperCase() || 'GENERAL',
      dueDate: newDueDate.trim() || 'This Week',
      priority: 'Medium',
      completed: false,
    };
    setTasks([task, ...tasks]);
    setNewTitle('');
    setNewDueDate('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Study Companion</h2>
        <p className="text-sm text-slate-500 mt-1">
          Deep work focus timer and academic deadline tracker designed to keep your term submissions on schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Pomodoro Timer (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Focus Study Timer
              </span>
              <Timer className="w-4 h-4 text-rose-900" />
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => switchTimerMode('study')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timerMode === 'study' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => switchTimerMode('short-break')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timerMode === 'short-break' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Break (5m)
              </button>
            </div>

            {/* Clock display */}
            <div className="text-center py-6">
              <div className="text-6xl font-black text-slate-900 tracking-tight font-mono-code">
                {formatTimer(secondsLeft)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {timerMode === 'study'
                  ? 'Keep notifications muted · Pure focus session'
                  : 'Time to stretch and hydrate!'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start Focus'}
            </button>
            <button
              onClick={() => switchTimerMode(timerMode)}
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Academic Deadline Tracker (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Assignment & Submissions Tracker</h4>
              <p className="text-xs text-slate-500">
                {tasks.filter((t) => !t.completed).length} pending deadlines
              </p>
            </div>
          </div>

          {/* Add task bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New assignment, paper, or submission..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <input
              type="text"
              placeholder="Course"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              className="w-24 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center"
            />
            <button
              onClick={addTask}
              className="px-3 py-2 bg-rose-900 hover:bg-rose-950 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Task items list */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-slate-50/60 border-slate-150 opacity-60'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                      task.completed ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:border-rose-500'
                    }`}
                  >
                    {task.completed && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-bold text-rose-900 bg-rose-50 px-1.5 py-0.2 rounded">
                        {task.course}
                      </span>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-red-600 shrink-0 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
