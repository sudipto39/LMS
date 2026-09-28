import { useState } from 'react';
import { GitBranch, GitCommit, Award, Play, CheckCircle2, Terminal, Sparkles, RefreshCw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InteractiveHeroShowcase() {
  const [activeTab, setActiveTab] = useState<'git' | 'rubric' | 'sandbox'>('git');

  // --- Tab 1: Live Git Pipeline State ---
  const [commits, setCommits] = useState([
    { id: 'c3', hash: '8f2a1b', msg: 'feat(api): implement JWT token verification & refresh router', author: 'Alex Chen', time: '1m ago', passed: true },
    { id: 'c2', hash: '5e9c0d', msg: 'test(milestone-2): add 14 automated unit test cases for grading rubric', author: 'Priya Patel', time: '14m ago', passed: true },
    { id: 'c1', hash: '1a4e7f', msg: 'chore: initial project scaffolding with Docker sandbox configuration', author: 'Team Lead', time: '1h ago', passed: true },
  ]);
  const [isPushing, setIsPushing] = useState(false);

  const handleSimulateCommit = () => {
    if (isPushing) return;
    setIsPushing(true);
    setTimeout(() => {
      const newCommit = {
        id: 'c' + Date.now(),
        hash: Math.random().toString(16).substring(2, 8),
        msg: 'feat(milestone-3): connect Judge0 runtime to supervisor rubric engine',
        author: 'You (Live Demo)',
        time: 'Just now',
        passed: true,
      };
      setCommits((prev) => [newCommit, ...prev.slice(0, 3)]);
      setIsPushing(false);
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#0891b2', '#0284c7', '#10b981'],
        });
      } catch {
        // graceful fallback
      }
    }, 600);
  };

  // --- Tab 2: Interactive Rubric State ---
  const [rubricItems, setRubricItems] = useState([
    { id: 'r1', label: 'Clean Architecture & SOLID Principles', points: 30, checked: true },
    { id: 'r2', label: 'Automated Test Coverage (>80%)', points: 30, checked: true },
    { id: 'r3', label: 'Conventional Git Commit History', points: 20, checked: true },
    { id: 'r4', label: 'Milestone Deliverable Presentation', points: 20, checked: false },
  ]);

  const toggleRubric = (id: string) => {
    setRubricItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const totalScore = rubricItems.reduce((acc, curr) => acc + (curr.checked ? curr.points : 0), 0);
  const gradeLetter = totalScore >= 95 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B+' : 'B';

  // --- Tab 3: Sandbox State ---
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);

  const handleRunCode = () => {
    setIsRunningCode(true);
    setSandboxOutput(null);
    setTimeout(() => {
      setIsRunningCode(false);
      setSandboxOutput(
        `✓ Isolated Runner: Python 3.11 container (Alpine Linux)\n✓ All 4 capstone assertions validated successfully!\nExecution time: 94ms | Memory: 14.2 MB`
      );
    }, 550);
  };

  return (
    <div className="relative w-full rounded-2xl border border-[#c2dfea] bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(15,42,51,0.14)] overflow-hidden transition-all duration-300">
      {/* Top OS Window Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c2dfea] bg-[#eef7fa]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ef4444]/80 inline-block shadow-inner" />
            <span className="w-3 h-3 rounded-full bg-[#f59e0b]/80 inline-block shadow-inner" />
            <span className="w-3 h-3 rounded-full bg-[#10b981]/80 inline-block shadow-inner" />
          </div>
          <span className="text-[12px] font-semibold text-[#4a7280] ml-2 flex items-center gap-1.5">
            <GitBranch size={13} className="text-[#0891b2]" />
            giteaforge-demo / final-year-capstone
          </span>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-0.5 rounded-lg bg-white border border-[#c2dfea] shadow-xs text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('git')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'git'
                ? 'bg-[#0891b2] text-white shadow-xs'
                : 'text-[#4a7280] hover:text-[#0f2a33]'
            }`}
          >
            <GitCommit size={12} /> Live Git Pipeline
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'rubric'
                ? 'bg-[#0891b2] text-white shadow-xs'
                : 'text-[#4a7280] hover:text-[#0f2a33]'
            }`}
          >
            <Award size={12} /> Supervisor Rubric
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'sandbox'
                ? 'bg-[#0891b2] text-white shadow-xs'
                : 'text-[#4a7280] hover:text-[#0f2a33]'
            }`}
          >
            <Terminal size={12} /> Code Sandbox
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 min-h-[340px] flex flex-col justify-between">
        {/* --- TAB 1: LIVE GIT PIPELINE --- */}
        {activeTab === 'git' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]" />
                </span>
                <span className="text-[13px] font-bold text-[#0f2a33]">
                  Connected Gitea Repository: <code className="text-[#0891b2] font-mono text-[12px]">origin/main</code>
                </span>
              </div>
              <button
                onClick={handleSimulateCommit}
                disabled={isPushing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-[#0891b2] to-[#0284c7] rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
              >
                {isPushing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Pushing Git Webhook...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> Push Live Commit (Demo)
                  </>
                )}
              </button>
            </div>

            {/* Commit stream list */}
            <div className="space-y-2">
              {commits.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    i === 0
                      ? 'border-[#0891b2]/40 bg-[#f0f9fb] shadow-xs'
                      : 'border-[#c2dfea]/70 bg-white hover:border-[#c2dfea]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#e0eff5] text-[#0e7490] flex-shrink-0">
                      #{c.hash}
                    </span>
                    <span className="text-[13px] font-medium text-[#0f2a33] truncate">
                      {c.msg}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#5f8a99] flex-shrink-0 pl-2">
                    <span className="font-semibold text-[#0f2a33]">{c.author}</span>
                    <span>{c.time}</span>
                    <CheckCircle2 size={15} className="text-[#10b981]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Milestone Sync Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#eef7fa] border border-[#c2dfea] text-[12px]">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-[#0891b2]" />
                <span className="font-semibold text-[#0f2a33]">Milestone 2 Deliverables:</span>
                <span className="text-[#4a7280]">Git webhooks synchronized automatically</span>
              </div>
              <span className="font-bold text-[#0891b2] font-mono">100% Passed</span>
            </div>
          </div>
        )}

        {/* --- TAB 2: INTERACTIVE SUPERVISOR RUBRIC --- */}
        {activeTab === 'rubric' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[#0f2a33]">
                  Interactive Capstone Evaluation Matrix
                </h4>
                <p className="text-[11px] text-[#4a7280]">
                  Click criteria to simulate real-time faculty grading score calculation
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#eef7fa] border border-[#c2dfea]">
                <span className="text-[11px] font-semibold text-[#4a7280]">Calculated Grade:</span>
                <span className="font-mono text-[16px] font-black text-[#0891b2]">
                  {gradeLetter} ({totalScore}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rubricItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleRubric(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                    item.checked
                      ? 'border-[#0891b2] bg-[#f0f9fb] shadow-xs'
                      : 'border-[#c2dfea] bg-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        item.checked
                          ? 'bg-[#0891b2] border-[#0891b2] text-white'
                          : 'border-[#c2dfea] bg-white'
                      }`}
                    >
                      {item.checked && <CheckCircle2 size={12} />}
                    </div>
                    <span className="text-[12px] font-medium text-[#0f2a33]">{item.label}</span>
                  </div>
                  <span className="text-[12px] font-bold font-mono text-[#0891b2]">
                    +{item.points} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#f4fafe] border border-[#c2dfea] flex items-center justify-between text-[12px]">
              <span className="text-[#4a7280] flex items-center gap-1.5">
                <Award size={14} className="text-[#0891b2]" />
                Threaded supervisor review comments will auto-attach to the student's project dashboard.
              </span>
              <span className="font-bold text-[#10b981]">Matrix Approved</span>
            </div>
          </div>
        )}

        {/* --- TAB 3: LIVE CODE SANDBOX --- */}
        {activeTab === 'sandbox' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-[#4a7280]">
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#e0eff5] text-[#0e7490]">
                  Python 3.11
                </span>
                <span>Isolated Docker container • Judge0 Engine</span>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-[#10b981] to-[#0891b2] rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
              >
                {isRunningCode ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Compiling...
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" /> Run Code in Sandbox
                  </>
                )}
              </button>
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-xl bg-[#0f2a33] p-3 text-[12px] font-mono text-[#f0f8fc] border border-[#1a4454] shadow-inner space-y-1">
              <div><span className="text-[#38bdf8]">def</span> <span className="text-[#34d399]">evaluate_capstone</span>(commits_count, unit_tests_passed):</div>
              <div className="pl-4 text-[#94a3b8]"># Automated webhook grading calculation</div>
              <div className="pl-4"><span className="text-[#38bdf8]">if</span> commits_count &gt;= <span className="text-[#f59e0b]">3</span> <span className="text-[#38bdf8]">and</span> unit_tests_passed:</div>
              <div className="pl-8 text-[#38bdf8]">return <span className="text-[#fcd34d]">&quot;Capstone Milestone Approved (Grade A+)&quot;</span></div>
              <div>print(evaluate_capstone(<span className="text-[#f59e0b]">5</span>, <span className="text-[#38bdf8]">True</span>))</div>
            </div>

            {/* Sandbox stdout output */}
            <div className="p-2.5 rounded-xl bg-[#eef7fa] border border-[#c2dfea] font-mono text-[11px] text-[#0f2a33]">
              {sandboxOutput ? (
                <div className="whitespace-pre-line text-[#0e7490] font-medium leading-relaxed">
                  {sandboxOutput}
                </div>
              ) : (
                <div className="text-[#769ba8] italic flex items-center gap-1.5">
                  <Play size={12} /> Click "Run Code in Sandbox" above to test automated compilation output...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Interactive Prompt */}
        <div className="pt-3 border-t border-[#c2dfea]/80 flex items-center justify-between text-[11px] text-[#4a7280]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0891b2] inline-block" />
            Interactive Live Sandbox Sandbox • Ready for Student & Faculty Demonstration
          </span>
          <span className="font-semibold text-[#0891b2]">v2.0 Architecture</span>
        </div>
      </div>
    </div>
  );
}
