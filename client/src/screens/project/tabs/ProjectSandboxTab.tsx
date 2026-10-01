import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Code2,
  Folder,
  FolderOpen,
  Terminal,
  Globe,
  ExternalLink,
  GitCommitHorizontal,
  RotateCcw,
  Play,
  Minimize2,
  Maximize2,
  FilePlus,
  Trash2,
  Copy,
  X,
  CheckCircle2,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Card } from "../../../components/common/UIPrimitives";
import { executeApi, projectsApi } from "../../../api";
import { useTheme } from "../../../context/ThemeContext";
import {
  getFullscreenElement,
  requestFullscreenSafe,
  exitFullscreenSafe,
  addFullscreenChangeListener,
} from "../../../utils/fullscreen";
import SandboxNewFileModal from "../modals/SandboxNewFileModal";
import SandboxCommitModal from "../modals/SandboxCommitModal";
import type { ProjectFile } from "../../../types";

interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
}

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: WorkspaceFile;
}

export function buildFileTree(files: WorkspaceFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", isFolder: true, children: [] };

  for (const file of files) {
    const cleanPath = (file.path || "").replace(/^\/+/, "").replace(/\\/g, "/");
    const parts = cleanPath.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (isLast) {
        current.children.push({
          name: part,
          path: cleanPath,
          isFolder: false,
          children: [],
          file,
        });
      } else {
        let folder = current.children.find((c) => c.isFolder && c.name === part);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            isFolder: true,
            children: [],
          };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }

  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.isFolder) sortNodes(n.children);
    }
  }

  sortNodes(root.children);
  return root.children;
}

const DEFAULT_WEB_WORKSPACE: WorkspaceFile[] = [
  {
    name: "index.html",
    path: "public/index.html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GiteaForge LMS Project</title>
    <link rel="stylesheet" href="src/styles/styles.css" />
  </head>
  <body>
    <main class="card">
      <header>
        <span class="badge">Live App</span>
        <h1 id="appTitle">Interactive Cloud IDE</h1>
      </header>
      <p id="appDesc">Multi-folder workspace with live preview, .env protection, and Gitea synchronization.</p>
      <div class="actions">
        <button id="counterBtn">Clicks: 0</button>
        <button id="themeBtn">Toggle Theme</button>
      </div>
      <div id="status" class="status-box">System online • Ready</div>
    </main>
    <script src="src/app.js"></script>
  </body>
</html>`,
  },
  {
    name: "styles.css",
    path: "src/styles/styles.css",
    content: `:root {
  --bg: #0f172a;
  --card-bg: #1e293b;
  --text: #f8fafc;
  --accent: #06b6d4;
  --border: #334155;
}

body.light {
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --text: #0f172a;
  --border: #e2e8f0;
}

body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.badge {
  background: rgba(6, 182, 212, 0.15);
  color: var(--accent);
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0 8px;
  font-size: 20px;
}

p {
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

button {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 9px 16px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
}

button#themeBtn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.status-box {
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed var(--border);
  padding: 10px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 11px;
}`,
  },
  {
    name: "theme.css",
    path: "src/styles/theme.css",
    content: `/* Additional Theme Utilities */
.shadow-glow {
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.35);
}
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}`,
  },
  {
    name: "app.js",
    path: "src/app.js",
    content: `// Main frontend controller
let clicks = 0;
const btn = document.getElementById("counterBtn");
const themeBtn = document.getElementById("themeBtn");
const status = document.getElementById("status");

if (btn) {
  btn.addEventListener("click", () => {
    clicks++;
    btn.textContent = "Clicks: " + clicks;
    if (status) {
      status.textContent = "Updated: " + new Date().toLocaleTimeString();
    }
  });
}

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });
}`,
  },
  {
    name: "helpers.js",
    path: "src/utils/helpers.js",
    content: `// Utility helper functions
export function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function truncate(text, max = 30) {
  return text.length > max ? text.slice(0, max) + "..." : text;
}`,
  },
  {
    name: "Card.js",
    path: "src/components/Card.js",
    content: `// Modular UI Component
export function renderCard(title, description) {
  return \`
    <div class="card-component">
      <h3>\${title}</h3>
      <p>\${description}</p>
    </div>
  \`;
}`,
  },
  {
    name: ".env",
    path: ".env",
    content: `# Environment Variables (Protected & Excluded by .gitignore)
PORT=3000
APP_ENV=development
API_SECRET_KEY=gitea_lms_demo_secret_2026
DATABASE_URL=mongodb://localhost:27017/lms_sandbox`,
  },
  {
    name: ".gitignore",
    path: ".gitignore",
    content: `# Dependencies & Build Output
node_modules/
dist/
build/
.cache/

# Environment Variables & Secrets
.env
.env.local
.env.*

# Python Cache
__pycache__/
*.pyc
*.pyo

# System Logs & Temp Files
*.log
*.tmp
.DS_Store
Thumbs.db`,
  },
  {
    name: "package.json",
    path: "package.json",
    content: `{
  "name": "giteaforge-sandbox-project",
  "version": "1.0.0",
  "private": true,
  "description": "Multi-file LMS sandbox project with multi-folder architecture",
  "scripts": {
    "start": "node src/app.js",
    "test": "python main.py"
  },
  "dependencies": {}
}`,
  },
  {
    name: "README.md",
    path: "README.md",
    content: `# Project Workspace

A production-grade multi-folder project structure supporting nested modules, assets, and Git workflows.

## Folder Structure
- \`public/\`: Static HTML entry points
- \`src/styles/\`: Modular CSS stylesheets and themes
- \`src/components/\`: Reusable UI modules
- \`src/utils/\`: Utility helpers and data transformers
- \`.env\`: Local environment configuration (safely excluded via \`.gitignore\`)
- \`.gitignore\`: Git exclusion rules for builds and secrets
`,
  },
  {
    name: "main.py",
    path: "main.py",
    content: `# Python Backend Engine
def fibonacci(n):
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

if __name__ == "__main__":
    result = fibonacci(10)
    print(f"Fibonacci(10): {result}")
    print(f"Sum: {sum(result)}")`,
  },
];

interface ProjectSandboxTabProps {
  projectId: string;
  showToast: (msg: string) => void;
  isActiveTab?: boolean;
  liveFiles?: ProjectFile[];
  loadingFiles?: boolean;
  onRefreshFiles?: () => Promise<void> | void;
  onRefreshDiff?: () => void;
}

interface SandboxDraft {
  projectId: string;
  timestamp: number;
  files: WorkspaceFile[];
  activeFilePath?: string;
  openFileTabs?: string[];
}

const getDraftStorageKey = (id: string): string => {
  const sanitized = (id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return `lms_sandbox_draft_${sanitized}`;
};

const loadSandboxDraft = (id: string): SandboxDraft | null => {
  if (!id || typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(getDraftStorageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.files) &&
      parsed.files.length > 0 &&
      parsed.files.every(
        (f: any) =>
          f &&
          typeof f.path === "string" &&
          typeof f.content === "string" &&
          !f.path.includes("..")
      )
    ) {
      return parsed as SandboxDraft;
    }
  } catch (e) {
    console.warn("Failed to read sandbox draft from localStorage:", e);
  }
  return null;
};

const saveSandboxDraft = (
  id: string,
  files: WorkspaceFile[],
  activeFilePath: string,
  openFileTabs: string[]
): void => {
  if (!id || typeof window === "undefined" || !window.localStorage) return;
  try {
    const draft: SandboxDraft = {
      projectId: id,
      timestamp: Date.now(),
      files,
      activeFilePath,
      openFileTabs,
    };
    localStorage.setItem(getDraftStorageKey(id), JSON.stringify(draft));
  } catch (e) {
    console.warn("Failed to persist sandbox draft to localStorage:", e);
  }
};

const clearSandboxDraft = (id: string): void => {
  if (!id || typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(getDraftStorageKey(id));
  } catch (e) {
    console.warn("Failed to clear sandbox draft from localStorage:", e);
  }
};

const getFileIcon = (name: string, _isIgnored?: boolean) => {
  const lower = name.toLowerCase();
  if (lower === ".env" || lower.startsWith(".env.")) {
    return <span title="Environment variables (Protected)" className="text-amber-400 font-bold text-[11px]">🔒</span>;
  }
  if (lower === ".gitignore") {
    return <span title="Git ignore rules" className="text-slate-400 font-bold text-[11px]">🛡️</span>;
  }
  if (lower.endsWith(".html")) return <span className="text-orange-400 text-[11px]">🌐</span>;
  if (lower.endsWith(".css")) return <span className="text-sky-400 text-[11px]">🎨</span>;
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return <span className="text-yellow-400 text-[11px]">⚡</span>;
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return <span className="text-blue-400 text-[11px]">📘</span>;
  if (lower.endsWith(".py")) return <span className="text-emerald-400 text-[11px]">🐍</span>;
  if (lower.endsWith(".json")) return <span className="text-amber-300 text-[11px]">⚙️</span>;
  if (lower.endsWith(".md")) return <span className="text-purple-400 text-[11px]">📝</span>;
  return <span className="text-slate-400 text-[11px]">📄</span>;
};

export const ProjectSandboxTab: React.FC<ProjectSandboxTabProps> = ({
  projectId,
  showToast,
  isActiveTab = true,
  liveFiles,
  loadingFiles = false,
  onRefreshFiles,
  onRefreshDiff,
}) => {
  const { themeStyles } = useTheme();
  const initialDraft = useMemo(() => loadSandboxDraft(projectId), [projectId]);

  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>(() => {
    if (initialDraft && initialDraft.files.length > 0) {
      return initialDraft.files;
    }
    if (liveFiles && liveFiles.length > 0) {
      return liveFiles.map((f) => ({
        name: f.name || f.path.split("/").pop() || "file",
        path: f.path,
        content: f.content ?? "",
      }));
    }
    return DEFAULT_WEB_WORKSPACE;
  });

  const [activeFilePath, setActiveFilePath] = useState<string>(() => {
    if (initialDraft && initialDraft.activeFilePath) {
      return initialDraft.activeFilePath;
    }
    if (liveFiles && liveFiles.length > 0) {
      const preferred =
        liveFiles.find((f) => f.path === "public/index.html" || f.path === "index.html") ||
        liveFiles.find((f) => f.path.endsWith(".html")) ||
        liveFiles[0];
      return preferred.path;
    }
    return "public/index.html";
  });

  const [openFileTabs, setOpenFileTabs] = useState<string[]>(() => {
    if (
      initialDraft &&
      Array.isArray(initialDraft.openFileTabs) &&
      initialDraft.openFileTabs.length > 0
    ) {
      return initialDraft.openFileTabs;
    }
    if (liveFiles && liveFiles.length > 0) {
      return liveFiles.slice(0, 5).map((f) => f.path);
    }
    return ["public/index.html", "src/styles/styles.css", "src/app.js", ".env"];
  });

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    return new Set(["src", "src/styles", "src/components", "src/utils", "public"]);
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const fileTree = useMemo(() => buildFileTree(workspaceFiles), [workspaceFiles]);

  const [isDirty, setIsDirty] = useState<boolean>(() => Boolean(initialDraft));
  const [draftRestored, setDraftRestored] = useState<boolean>(() =>
    Boolean(initialDraft)
  );
  const [isSyncingGit, setIsSyncingGit] = useState<boolean>(false);
  const [showFileExplorer, setShowFileExplorer] = useState<boolean>(true);
  const [outputMode, setOutputMode] = useState<"terminal" | "preview">("preview");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [sandboxFontSize, setSandboxFontSize] = useState<number>(13);
  const [sandboxStdin, setSandboxStdin] = useState("");
  const [codeOut, setCodeOut] = useState("");
  const [running, setRunning] = useState(false);
  const [sandboxExpanded, setSandboxExpanded] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("feat: update project workspace");
  const [commitBranch, setCommitBranch] = useState("main");
  const [isPushing, setIsPushing] = useState(false);
  const [newFilePrompt, setNewFilePrompt] = useState<{ show: boolean; name: string }>({
    show: false,
    name: "",
  });
  const [terminalWidth, setTerminalWidth] = useState<number>(340);
  const [isDraggingWidth, setIsDraggingWidth] = useState<boolean>(false);

  const activeFile = useMemo(
    () => workspaceFiles.find((f) => f.path === activeFilePath) || workspaceFiles[0],
    [workspaceFiles, activeFilePath]
  );

  const isPathIgnored = (path: string): boolean => {
    const gitignore = workspaceFiles.find((f) => f.path === ".gitignore");
    const defaultRules = [
      "node_modules",
      "dist",
      "build",
      ".env",
      ".env.local",
      ".env.*",
      "*.pyc",
      "__pycache__",
      ".DS_Store",
      "Thumbs.db",
      "*.log",
      "*.tmp",
      ".cache",
    ];
    const customRules = gitignore
      ? gitignore.content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#"))
      : [];
    const rules = [...defaultRules, ...customRules];
    const normalized = path.replace(/^\/+/, "");
    const filename = normalized.split("/").pop() || "";
    for (const r of rules) {
      const clean = r.replace(/^\/+/, "").replace(/\/+$/, "");
      if (normalized === clean || normalized.startsWith(clean + "/") || filename === clean)
        return true;
      if (clean.startsWith("*.") && filename.endsWith(clean.slice(1))) return true;
      if (clean.endsWith("*") && filename.startsWith(clean.slice(0, -1))) return true;
    }
    return false;
  };

  const previewSrcDoc = useMemo(() => {
    const htmlFile =
      workspaceFiles.find((f) => f.path === "public/index.html" || f.path === "index.html") ||
      workspaceFiles.find((f) => f.path.endsWith(".html")) ||
      workspaceFiles[0];
    const cssFiles = workspaceFiles.filter((f) => f.path.endsWith(".css"));
    const jsFiles = workspaceFiles.filter(
      (f) => f.path.endsWith(".js") && !f.path.includes("node_modules")
    );

    let fullHtml = htmlFile ? htmlFile.content : "<h1>No HTML file found</h1>";
    const combinedCss = cssFiles.map((c) => `/* ${c.path} */\n${c.content}`).join("\n\n");
    const combinedJs = jsFiles.map((j) => `// ${j.path}\n${j.content}`).join("\n\n");

    const scrollbarStyles = `
      *, *::before, *::after { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 9999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.7); }
      * { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.35) transparent; }
    `;

    const injectedStyle = `<` + `style id="lms-injected-styles">\n${scrollbarStyles}\n${combinedCss}\n<` + `/style>`;

    if (fullHtml.includes("</head>")) {
      fullHtml = fullHtml.replace("</head>", `${injectedStyle}</head>`);
    } else {
      fullHtml = injectedStyle + fullHtml;
    }

    if (combinedJs) {
      if (fullHtml.includes("</body>")) {
        fullHtml = fullHtml.replace("</body>", `<script>\n${combinedJs}\n</script></body>`);
      } else {
        fullHtml = fullHtml + `<script>\n${combinedJs}\n</script>`;
      }
    }
    return fullHtml;
  }, [workspaceFiles]);

  const handleOpenInNewTab = () => {
    try {
      // Open new tab (omit "noopener" from windowFeatures because it forces window.open to return null per HTML spec)
      const newWindow = window.open("", "_blank");
      if (!newWindow) {
        showToast("Popup blocked! Please allow popups for this site to view the preview 🚀");
        return;
      }

      // Write full-screen wrapper shell
      const doc = newWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Live Preview • GiteaForge Codespace</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
      iframe { width: 100%; height: 100%; border: none; display: block; }
    </style>
  </head>
  <body></body>
</html>`);
      doc.close();

      // Mount iframe safely via DOM property assignment to preserve content without fragile string escaping
      const iframe = doc.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts allow-modals allow-forms");
      iframe.setAttribute("title", "Live Application Preview");
      iframe.srcdoc = previewSrcDoc;
      doc.body.appendChild(iframe);

      // Sever opener reference to protect parent window from reverse tab-nabbing
      try {
        newWindow.opener = null;
      } catch {
        // Safe to ignore if browser restricts opener reassignment
      }

      showToast("Live preview opened in full-screen tab 🚀");
    } catch (err: any) {
      console.error("Failed to open preview in new tab:", err);
      showToast("Could not open preview in new tab");
    }
  };

  // Synchronize with parent's liveFiles when loaded from Gitea if user hasn't made dirty uncommitted edits
  useEffect(() => {
    if (isDirty || draftRestored) {
      return;
    }
    if (liveFiles && liveFiles.length > 0) {
      const converted: WorkspaceFile[] = liveFiles.map((f) => ({
        name: f.name || f.path.split("/").pop() || "file",
        path: f.path,
        content: f.content ?? "",
      }));

      setWorkspaceFiles(converted);

      setActiveFilePath((prev) => {
        if (converted.some((f) => f.path === prev)) return prev;
        const html = converted.find(
          (f) => f.path.endsWith(".html") || f.path === "index.html"
        );
        return html?.path || converted[0]?.path || "index.html";
      });

      setOpenFileTabs((prev) => {
        const valid = prev.filter((p) => converted.some((f) => f.path === p));
        if (valid.length > 0) return valid;
        return converted.slice(0, 5).map((f) => f.path);
      });
    }
  }, [liveFiles, isDirty, draftRestored]);

  const updateFileContent = (newContent: string) => {
    setIsDirty(true);
    setWorkspaceFiles((prev) => {
      const updated = prev.map((f) =>
        f.path === activeFilePath ? { ...f, content: newContent } : f
      );
      saveSandboxDraft(projectId, updated, activeFilePath, openFileTabs);
      return updated;
    });
  };

  const handleDiscardDraft = () => {
    clearSandboxDraft(projectId);
    setIsDirty(false);
    setDraftRestored(false);

    if (liveFiles && liveFiles.length > 0) {
      const converted: WorkspaceFile[] = liveFiles.map((f) => ({
        name: f.name || f.path.split("/").pop() || "file",
        path: f.path,
        content: f.content ?? "",
      }));
      setWorkspaceFiles(converted);
      setActiveFilePath(converted[0]?.path || "index.html");
      setOpenFileTabs(converted.slice(0, 5).map((f) => f.path));
    } else {
      setWorkspaceFiles(DEFAULT_WEB_WORKSPACE);
      setActiveFilePath("index.html");
      setOpenFileTabs(["index.html", "styles.css", "app.js", "main.py"]);
    }
    showToast("Discarded local draft and reloaded repository files from Gitea");
  };

  const handleManualSyncGit = async () => {
    if (isDirty || draftRestored) {
      const confirmDiscard = window.confirm(
        "You have uncommitted changes or an active local draft. Discarding will reload the latest files from Gitea. Are you sure you want to proceed?"
      );
      if (!confirmDiscard) return;
    }

    setIsSyncingGit(true);
    try {
      clearSandboxDraft(projectId);
      setIsDirty(false);
      setDraftRestored(false);

      if (onRefreshFiles) {
        await onRefreshFiles();
      }
      showToast("Repository files synchronized with Gitea 🔄");
    } catch {
      showToast("Failed to sync files from Gitea");
    } finally {
      setIsSyncingGit(false);
    }
  };

  const handleCreateNewFile = () => {
    const rawName = newFilePrompt.name.trim().replace(/\\/g, "/");
    if (!rawName) return;

    // Security & Path Traversal Validation
    if (rawName.includes("..") || rawName.startsWith("/") || rawName.endsWith("/")) {
      showToast("Invalid path: Directory traversal ('..') and leading/trailing slashes are not allowed");
      return;
    }

    const segments = rawName.split("/").map((s) => s.trim());
    if (segments.some((s) => !s)) {
      showToast("Invalid path: Empty directory segments are not allowed");
      return;
    }

    // Characters disallowed in cross-platform filenames: < > : " \ | ? *
    const illegalChars = /[<>:"\\|?*\x00-\x1F]/;
    for (const seg of segments) {
      if (illegalChars.test(seg)) {
        showToast('Invalid filename: File and folder names cannot contain < > : " \\ | ? *');
        return;
      }
    }

    if (rawName.length > 120) {
      showToast("Path is too long (maximum 120 characters)");
      return;
    }

    const cleanPath = segments.join("/");
    const fileName = segments[segments.length - 1];

    if (workspaceFiles.some((f) => f.path.toLowerCase() === cleanPath.toLowerCase())) {
      showToast("A file with this path already exists");
      return;
    }

    let defaultContent = `// ${cleanPath}\n`;
    if (cleanPath.endsWith(".py")) defaultContent = `# ${cleanPath}\nprint("Hello from ${fileName}")\n`;
    else if (cleanPath.endsWith(".html"))
      defaultContent = `<!DOCTYPE html>\n<html>\n<head><title>${fileName}</title></head>\n<body>\n  <h1>${fileName}</h1>\n</body>\n</html>`;
    else if (cleanPath.endsWith(".css"))
      defaultContent = `/* Styles for ${cleanPath} */\nbody {\n  font-family: sans-serif;\n}`;
    else if (cleanPath.endsWith(".json")) defaultContent = `{\n  "name": "${fileName}"\n}`;

    const newFileObj: WorkspaceFile = {
      name: fileName,
      path: cleanPath,
      content: defaultContent,
    };

    // Auto-expand all parent folders in the tree
    if (segments.length > 1) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        for (let i = 1; i < segments.length; i++) {
          next.add(segments.slice(0, i).join("/"));
        }
        return next;
      });
    }

    const nextFiles = [...workspaceFiles, newFileObj];
    const nextTabs = openFileTabs.includes(cleanPath)
      ? openFileTabs
      : [...openFileTabs, cleanPath];

    setIsDirty(true);
    setWorkspaceFiles(nextFiles);
    setOpenFileTabs(nextTabs);
    setActiveFilePath(cleanPath);
    saveSandboxDraft(projectId, nextFiles, cleanPath, nextTabs);
    setNewFilePrompt({ show: false, name: "" });
    showToast(`Created file: ${cleanPath}`);
  };

  const handleDeleteFile = (path: string) => {
    if (workspaceFiles.length <= 1) {
      showToast("Cannot delete the only file in the workspace");
      return;
    }
    const nextFiles = workspaceFiles.filter((f) => f.path !== path);
    const nextTabs = openFileTabs.filter((t) => t !== path);
    let nextActive = activeFilePath;
    if (activeFilePath === path) {
      nextActive = nextFiles[0]?.path || "public/index.html";
      setActiveFilePath(nextActive);
    }
    setIsDirty(true);
    setWorkspaceFiles(nextFiles);
    setOpenFileTabs(nextTabs);
    saveSandboxDraft(projectId, nextFiles, nextActive, nextTabs);
    showToast(`Deleted ${path}`);
  };

  const handleRunSandbox = async () => {
    if (running) return;
    setRunning(true);
    setCodeOut("");

    let lang = "python";
    if (activeFilePath.endsWith(".js") || activeFilePath.endsWith(".ts")) lang = "javascript";
    else if (activeFilePath.endsWith(".r")) lang = "r";
    else if (activeFilePath.endsWith(".cpp")) lang = "cpp";
    else if (activeFilePath.endsWith(".c")) lang = "c";
    else if (activeFilePath.endsWith(".java")) lang = "java";
    else if (activeFilePath.endsWith(".go")) lang = "go";
    else if (activeFilePath.endsWith(".rs")) lang = "rust";

    if (activeFilePath.endsWith(".html") || activeFilePath.endsWith(".css")) {
      setOutputMode("preview");
      setPreviewKey((k) => k + 1);
      setRunning(false);
      showToast("Live Preview updated 🌐");
      return;
    }

    setOutputMode("terminal");

    try {
      const res = await executeApi.runCode({
        language: lang,
        sourceCode: activeFile.content,
        stdin: sandboxStdin,
      });
      if (res.data?.output) {
        setCodeOut(res.data.output);
        setRunning(false);
        return;
      }
    } catch (err: any) {
      // Server returned an error (network issue, server down, etc.)
      const errMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Could not connect to execution service";
      setCodeOut(
        `> Execution Error\n> ${errMessage}\n\n` +
        `The server-side execution engine could not process your code.\n` +
        `• Check your network connection\n` +
        `• Ensure the LMS server is running\n` +
        `• Try again in a moment\n\n⏱ ${new Date().toLocaleTimeString()}`
      );
      setRunning(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) {
      showToast("Please provide a commit message");
      return;
    }
    setIsPushing(true);
    try {
      // Exclude files matching .gitignore or secrets (.env) before sending payload
      const pushableFiles = workspaceFiles.filter((f) => !isPathIgnored(f.path));
      const res = await projectsApi.commitAndPushSandbox(projectId, {
        files: pushableFiles.map((f) => ({ path: f.path, content: f.content })),
        message: commitMessage.trim(),
        branch: commitBranch || "main",
      });

      // Clear local storage draft and reset dirty flags
      clearSandboxDraft(projectId);
      setIsDirty(false);
      setDraftRestored(false);

      showToast(res.message || "Successfully pushed to Gitea repository! 🚀");
      setShowCommitModal(false);

      // Synchronize parent repository files and commit diff
      if (onRefreshFiles) {
        await onRefreshFiles();
      }
      if (onRefreshDiff) {
        onRefreshDiff();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to push to Gitea";
      showToast(`Push error: ${msg}`);
    } finally {
      setIsPushing(false);
    }
  };

  const isNativeFullscreenRef = useRef(false);

  // Fullscreen toggle with HTML5 Fullscreen API and portal fallback
  const handleToggleFullscreen = async () => {
    if (!sandboxExpanded) {
      setSandboxExpanded(true);
      const success = await requestFullscreenSafe(document.documentElement);
      isNativeFullscreenRef.current = Boolean(success);
    } else {
      setSandboxExpanded(false);
      isNativeFullscreenRef.current = false;
      await exitFullscreenSafe();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl = getFullscreenElement();
      if (!fsEl) {
        if (isNativeFullscreenRef.current || sandboxExpanded) {
          isNativeFullscreenRef.current = false;
          setSandboxExpanded(false);
        }
      } else {
        isNativeFullscreenRef.current = true;
        setSandboxExpanded(true);
      }
    };

    const cleanup = addFullscreenChangeListener(handleFullscreenChange);
    return cleanup;
  }, [sandboxExpanded]);

  // Clean up native fullscreen on unmount if active
  useEffect(() => {
    return () => {
      if (isNativeFullscreenRef.current) {
        exitFullscreenSafe();
      }
    };
  }, []);

  // Lock background body scroll when fullscreen workspace is active
  useEffect(() => {
    if (sandboxExpanded && typeof document !== "undefined") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [sandboxExpanded]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sandboxExpanded) {
        handleToggleFullscreen();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowFileExplorer((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isActiveTab) {
        e.preventDefault();
        handleRunSandbox();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sandboxExpanded, isActiveTab, activeFile, workspaceFiles]);

  // Mouse drag handler for horizontal splitter resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWidth) {
        const newWidth = Math.max(200, Math.min(850, window.innerWidth - e.clientX - 32));
        setTerminalWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingWidth) setIsDraggingWidth(false);
    };

    if (isDraggingWidth) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingWidth]);

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    if (node.isFolder) {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <div key={`dir-${node.path}`} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            className="group flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[var(--srf2)] cursor-pointer text-[12px] transition text-[var(--t2)] hover:text-[var(--t1)] font-mono"
            style={{ paddingLeft: `${depth * 10 + 6}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-[var(--t3)] group-hover:text-[var(--t1)] transition-transform flex-shrink-0">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <span className="text-amber-400 text-[12px] flex-shrink-0">
                {isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />}
              </span>
              <span className="truncate font-semibold text-[11.5px] tracking-tight">{node.name}</span>
            </div>
            <span className="text-[9px] px-1 rounded bg-[var(--srf)] text-[var(--t3)] font-sans flex-shrink-0">
              {node.children.length}
            </span>
          </div>
          {isExpanded && (
            <div className="border-l border-[var(--bdr)]/40 ml-2">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const file = node.file!;
    const isActive = activeFilePath === file.path;
    const isIgnored = isPathIgnored(file.path);
    const isEnv = file.name.toLowerCase() === ".env" || file.name.toLowerCase().startsWith(".env.");

    return (
      <div
        key={`file-${file.path}`}
        onClick={() => {
          setActiveFilePath(file.path);
          if (!openFileTabs.includes(file.path)) {
            setOpenFileTabs((prev) => [...prev, file.path]);
          }
        }}
        className={`group flex items-center justify-between py-1 px-1.5 rounded-lg cursor-pointer transition select-none font-mono text-[11.5px] ${
          isActive
            ? "bg-[#06b6d4]/15 text-[#06b6d4] font-bold border border-[#06b6d4]/30"
            : isIgnored
            ? "text-[var(--t3)] opacity-70 hover:opacity-100 hover:bg-[var(--srf2)]"
            : "text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--srf2)]"
        }`}
        style={{ paddingLeft: `${depth * 10 + 6}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="flex-shrink-0">{getFileIcon(file.name, isIgnored)}</span>
          <span
            className={`truncate ${
              isIgnored && !isEnv ? "line-through text-slate-500" : isEnv ? "text-amber-300 font-semibold" : ""
            }`}
            title={file.path}
          >
            {node.name}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          {isIgnored && (
            <span
              className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-sans"
              title="Ignored by .gitignore rules"
            >
              ignored
            </span>
          )}
          {workspaceFiles.length > 1 && file.name !== ".gitignore" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFile(file.path);
              }}
              className="hover:text-red-400 p-0.5 rounded transition"
              title={`Delete ${file.path}`}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const content = (
    <div
      className={
        sandboxExpanded
          ? "fixed inset-0 z-[99999] w-full h-full flex flex-col p-3 md:p-4 space-y-3 overflow-hidden text-[var(--t1,#f0f8fc)]"
          : "space-y-3"
      }
      style={{
        ...themeStyles,
        background: "var(--bg, #0b1117)",
      }}
    >
      {/* Top IDE Single-Row Toolbar & Actions */}
      <Card className="px-3 py-2 flex items-center justify-between gap-2 shadow-sm flex-shrink-0 overflow-x-auto select-none no-scrollbar flex-nowrap">
        {/* Left Branding & Active File Metadata */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <div className="h-7 w-7 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30 grid place-items-center text-[#06b6d4] shrink-0">
            <Code2 size={15} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-[13px] tracking-tight whitespace-nowrap">Codespace</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 hidden sm:inline-block">
              Git
            </span>
            {isDirty && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                ● Uncommitted
              </span>
            )}
            <span className="text-[11px] text-[var(--t3)] hidden md:inline-block font-mono ml-1">
              Active: <b className="text-[#06b6d4] font-semibold">{activeFile.name}</b>
            </span>
          </div>
        </div>

        {/* Right Actions - Single Row UX */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          {/* Explorer Toggle */}
          <button
            type="button"
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={`h-8 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition shrink-0 ${
              showFileExplorer
                ? "bg-[var(--srf2)] border-[var(--bdr)] text-[var(--t1)]"
                : "bg-transparent border-dashed border-[var(--bdr)] text-[var(--t3)] hover:text-[var(--t1)]"
            }`}
            title={showFileExplorer ? "Hide File Explorer" : "Show File Explorer"}
          >
            <Folder size={13} style={{ color: "var(--acc)" }} />
            <span>Files</span>
          </button>

          {/* Output Mode Switcher */}
          <div
            className="flex items-center p-0.5 rounded-lg border shrink-0"
            style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
          >
            <button
              type="button"
              onClick={() => setOutputMode("terminal")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                outputMode === "terminal"
                  ? "bg-[#06b6d4] text-white font-bold shadow-xs"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              <Terminal size={12} /> Console
            </button>
            <button
              type="button"
              onClick={() => setOutputMode("preview")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                outputMode === "preview"
                  ? "bg-[#06b6d4] text-white font-bold shadow-xs"
                  : "text-[var(--t2)] hover:text-[var(--t1)]"
              }`}
            >
              <Globe size={12} /> Live Screen
            </button>
          </div>

          {/* Open In New Tab Button */}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="h-8 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:border-[#06b6d4] transition shrink-0"
            style={{
              background: "var(--srf2)",
              borderColor: "var(--bdr)",
              color: "var(--t1)",
            }}
            title="Open Live Web Project in New Browser Tab"
          >
            <ExternalLink size={12} className="text-[#06b6d4]" />
            <span className="hidden sm:inline">Open in Tab</span>
          </button>

          {/* Sync Git from Gitea Button */}
          <button
            type="button"
            onClick={handleManualSyncGit}
            disabled={loadingFiles || isSyncingGit}
            className="h-8 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:border-[#06b6d4] transition disabled:opacity-50 shrink-0"
            style={{
              background: "var(--srf2)",
              borderColor: "var(--bdr)",
              color: "var(--t1)",
            }}
            title="Synchronize workspace files with Gitea repository"
          >
            <RotateCcw
              size={12}
              className={loadingFiles || isSyncingGit ? "animate-spin text-[#06b6d4]" : "text-[#06b6d4]"}
            />
            <span className="hidden sm:inline">{loadingFiles || isSyncingGit ? "Syncing..." : "Sync Git"}</span>
          </button>

          {/* Commit & Push to Gitea Button */}
          <button
            type="button"
            onClick={() => setShowCommitModal(true)}
            className="h-8 px-3 rounded-lg bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-90 shadow-sm transition shrink-0 whitespace-nowrap"
            title="Commit changes and push to Gitea"
          >
            <GitCommitHorizontal size={13} />
            <span>Commit & Push</span>
          </button>

          {/* Run Code Primary Button */}
          <button
            type="button"
            onClick={handleRunSandbox}
            className={`h-8 px-3.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer bg-[#06b6d4] hover:bg-[#0891b2] text-white text-[11px] shadow-sm transition shrink-0 whitespace-nowrap ${
              running ? "opacity-60 pointer-events-none" : ""
            }`}
            title="Run active file (Ctrl+Enter)"
          >
            {running ? (
              <>
                <RotateCcw size={12} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>Run</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          {sandboxExpanded ? (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="h-8 px-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 flex items-center gap-1 cursor-pointer transition font-medium text-[11px] shrink-0 whitespace-nowrap"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 size={13} />
              <span>Exit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="h-8 w-8 rounded-lg border grid place-items-center cursor-pointer transition hover:border-[var(--acc)] hover:text-[var(--acc)] shrink-0"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t2)",
              }}
              title="Fullscreen Workspace"
            >
              <Maximize2 size={13} />
            </button>
          )}
        </div>
      </Card>

      {/* Restored Draft Alert Banner */}
      {draftRestored && (
        <div className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[12px] flex items-center justify-between gap-3 flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span>
              <b>Uncommitted Local Draft:</b> You are editing unsaved changes preserved from your previous session.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-200 hover:bg-amber-500/20 text-[11px] font-semibold cursor-pointer transition"
              title="Discard this local draft and pull fresh files from Gitea"
            >
              Discard Draft & Sync Git
            </button>
            <button
              type="button"
              onClick={() => setDraftRestored(false)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold cursor-pointer transition"
              title="Keep this draft and dismiss alert"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}

      {/* IDE Main Workspace Layout with Interactive Splitters */}
      <div
        className={`flex gap-2 min-h-0 ${
          sandboxExpanded
            ? "flex-1 h-full items-stretch overflow-hidden"
            : "items-start"
        }`}
      >
        {/* 1. LEFT COLUMN: FILE EXPLORER */}
        {showFileExplorer ? (
          <div
            className={`flex flex-col flex-shrink-0 ${
              sandboxExpanded ? "h-full min-h-0" : "h-[580px]"
            }`}
            style={{ width: "215px" }}
          >
            <Card
              className="overflow-hidden shadow-sm flex flex-col h-full min-h-0"
            >
              <div
                className="h-9 px-2 border-b flex items-center justify-between flex-shrink-0"
                style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
              >
                <span
                  className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 truncate"
                  style={{ color: "var(--t2)" }}
                >
                  <Folder size={13} style={{ color: "var(--acc)" }} /> Files (
                  {workspaceFiles.length})
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setNewFilePrompt({ show: true, name: "" })}
                    className="h-6 w-6 rounded-md grid place-items-center hover:bg-[var(--srf)] text-[var(--t2)] hover:text-[var(--acc)] cursor-pointer transition"
                    title="Create New File or Folder (e.g. src/components/Button.js)"
                  >
                    <FilePlus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={handleManualSyncGit}
                    className="h-6 w-6 rounded-md grid place-items-center hover:bg-[var(--srf)] text-[var(--t3)] hover:text-[var(--acc)] cursor-pointer transition"
                    title="Synchronize files with Gitea repository"
                  >
                    <RotateCcw
                      size={11}
                      className={
                        loadingFiles || isSyncingGit
                          ? "animate-spin text-[#06b6d4]"
                          : ""
                      }
                    />
                  </button>
                  {/* Collapse Button */}
                  <button
                    type="button"
                    onClick={() => setShowFileExplorer(false)}
                    className="h-6 w-6 rounded-md grid place-items-center hover:bg-red-500/15 text-[var(--t3)] hover:text-red-400 cursor-pointer transition"
                    title="Collapse File Explorer (Ctrl+B)"
                  >
                    <PanelLeftClose size={13} />
                  </button>
                </div>
              </div>

              {/* Recursive File & Folder Tree */}
              <div className="p-1.5 space-y-0.5 overflow-y-auto flex-1 custom-scrollbar">
                {fileTree.map((node) => renderTreeNode(node, 0))}
              </div>
            </Card>
          </div>
        ) : (
          /* Collapsed File Explorer Expand Strip */
          <div
            className={`flex flex-col flex-shrink-0 ${
              sandboxExpanded ? "h-full min-h-0" : "h-[580px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setShowFileExplorer(true)}
              className="h-full w-8 rounded-xl border flex flex-col items-center justify-start pt-3 gap-2 text-[11px] font-semibold cursor-pointer hover:border-[#06b6d4] hover:text-[#06b6d4] transition select-none group"
              style={{
                background: "var(--srf2)",
                borderColor: "var(--bdr)",
                color: "var(--t2)",
              }}
              title="Expand File Explorer (Ctrl+B)"
            >
              <PanelLeftOpen size={14} className="text-[#06b6d4] group-hover:scale-110 transition-transform" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] tracking-wider uppercase font-mono mt-1 opacity-75 group-hover:opacity-100 font-bold">
                Files
              </span>
            </button>
          </div>
        )}

      {/* 2. MIDDLE COLUMN: MULTI-FILE CODE EDITOR */}
      <div
        className={`flex flex-col flex-1 min-w-0 ${
          sandboxExpanded ? "h-full min-h-0" : "h-[580px]"
        }`}
      >
        <Card
          className="overflow-hidden shadow-sm flex flex-col h-full min-h-0"
        >
          {/* File Tab Strip Header */}
          <div
            className="h-10 border-b flex items-center justify-between select-none flex-shrink-0"
            style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
          >
            {/* Scrollable File Tabs Container */}
            <div className="flex-1 min-w-0 h-full flex items-center gap-1 px-2 overflow-x-auto custom-scrollbar">
              {openFileTabs.map((tabPath) => {
                const fileObj = workspaceFiles.find((f) => f.path === tabPath);
                if (!fileObj) return null;
                const isActive = activeFilePath === tabPath;
                return (
                  <div
                    key={tabPath}
                    onClick={() => setActiveFilePath(tabPath)}
                    className={`h-8 px-3 rounded-t-lg flex items-center gap-2 text-[12px] font-mono cursor-pointer border-t border-x transition select-none flex-shrink-0 ${
                      isActive
                        ? "bg-[#080f18] text-[#38bdf8] border-[#1e3a52] font-bold"
                        : "bg-transparent text-[var(--t3)] border-transparent hover:text-[var(--t1)] hover:bg-[var(--srf)]"
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{fileObj.name}</span>
                    {openFileTabs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextTabs = openFileTabs.filter((t) => t !== tabPath);
                          setOpenFileTabs(nextTabs);
                          if (activeFilePath === tabPath && nextTabs.length > 0) {
                            setActiveFilePath(nextTabs[0]);
                          }
                        }}
                        className="hover:text-red-400 p-0.5 rounded transition"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Permanently Fixed Editor Quick Actions (Font Selector & Copy Button) */}
            <div
              className="flex items-center gap-1.5 px-2.5 h-full flex-shrink-0 border-l"
              style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
            >
              <span className="text-[10px] font-mono text-[var(--t3)]">Font:</span>
              <select
                value={sandboxFontSize}
                onChange={(e) => setSandboxFontSize(Number(e.target.value))}
                className="h-6 px-1.5 rounded border text-[10px] font-mono cursor-pointer"
                style={{
                  background: "var(--srf)",
                  borderColor: "var(--bdr)",
                  color: "var(--t1)",
                }}
              >
                <option value={12}>12px</option>
                <option value={13}>13px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeFile.content);
                  showToast(`Copied ${activeFile.name} to clipboard`);
                }}
                className="h-6 px-2 rounded border text-[11px] flex items-center gap-1 cursor-pointer hover:border-[var(--acc)] transition"
                style={{
                  background: "var(--srf)",
                  borderColor: "var(--bdr)",
                  color: "var(--t2)",
                }}
                title="Copy current file content"
              >
                <Copy size={11} />
              </button>
            </div>
          </div>

          {/* Code Editor Body */}
          <div className="flex-1 flex bg-[#080f18] overflow-hidden">
            {/* Line Numbers */}
            <div className="w-12 bg-[#050b12] text-right pr-3 py-3 select-none text-[#475569] mono text-[12px] leading-[22px] border-r border-[#16293d]">
              {(activeFile.content || "").split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea Code Input */}
            <textarea
              value={activeFile.content}
              onChange={(e) => {
                const newContent = e.target.value;
                updateFileContent(newContent);
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const val = target.value;
                  const newContent = val.substring(0, start) + "  " + val.substring(end);
                  updateFileContent(newContent);
                  setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              className="flex-1 p-3 mono leading-[22px] focus:outline-none resize-none bg-[#080f18] text-[#f1f5f9] font-medium"
              style={{ fontSize: `${sandboxFontSize}px` }}
              spellCheck={false}
            />
          </div>

          {/* Editor bottom status bar */}
          <div
            className="h-7 px-3 border-t flex items-center justify-between text-[11px] mono select-none"
            style={{
              borderColor: "var(--bdr)",
              background: "var(--srf2)",
              color: "var(--t3)",
            }}
          >
            <span>
              UTF-8 • {activeFile.name.split(".").pop()?.toUpperCase() || "TXT"}
            </span>
            <span>
              {(activeFile.content || "").length} chars •{" "}
              {(activeFile.content || "").split("\n").length} lines
            </span>
          </div>
        </Card>
      </div>

      {/* Interactive Horizontal Resizer Splitter */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingWidth(true);
        }}
        className={`hidden lg:flex items-center justify-center cursor-col-resize select-none group relative z-10 transition-all flex-shrink-0 ${
          sandboxExpanded ? "h-full" : "h-[580px]"
        }`}
        style={{ width: "6px" }}
        title="Drag horizontally to resize Codespace and Terminal width"
      >
        <div
          className={`w-1 rounded-full transition-all duration-150 ${
            isDraggingWidth
              ? "bg-[#06b6d4] h-24 shadow-[0_0_12px_#06b6d4]"
              : "bg-[var(--bdr)] group-hover:bg-[#06b6d4] h-10 group-hover:h-20"
          }`}
        />
      </div>

      {/* 3. RIGHT COLUMN: DUAL TERMINAL / LIVE SCREEN PREVIEW */}
      <div
        className={`flex flex-col flex-shrink-0 ${
          sandboxExpanded ? "h-full min-h-0" : "h-[580px]"
        }`}
        style={{
          width: `${sandboxExpanded ? Math.max(terminalWidth, 480) : terminalWidth}px`,
          maxWidth: sandboxExpanded ? "50vw" : undefined,
        }}
      >
        <div className="flex flex-col overflow-hidden h-full min-h-0 flex-1">
          {outputMode === "terminal" ? (
            /* TERMINAL CONSOLE MODE */
            <div
              className="rounded-2xl border overflow-hidden bg-[#060e15] shadow-sm flex flex-col h-full"
              style={{ borderColor: "#1a3a50" }}
            >
              <div className="h-10 flex items-center justify-between px-3 bg-[#0a1520] border-b border-[#1a3a50] flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#38bdf8]" />
                  <span className="text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider">
                    Judge0
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {codeOut && !running && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-[#4ade80]" />
                      <span className="text-[10px] text-[#4ade80] font-mono font-bold">
                        Exit 0
                      </span>
                    </div>
                  )}
                  {codeOut && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(codeOut);
                        showToast("Output copied");
                      }}
                      className="text-[#94a3b8] hover:text-[#f8fafc] text-[10px] cursor-pointer font-mono px-1"
                    >
                      Copy
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCodeOut("");
                      showToast("Console cleared");
                    }}
                    className="text-[#94a3b8] hover:text-[#f8fafc] text-[10px] cursor-pointer font-mono px-1"
                  >
                    Clear
                  </button>
                </div>
              </div>

                <pre className="flex-1 p-3 text-[11px] mono whitespace-pre-wrap overflow-auto text-[#f8fafc] leading-relaxed select-text font-medium">
                  {running ? (
                    <span className="text-[#fbbf24] animate-pulse">
                      {"> Sending to Judge0 CE VM...\n⏳ Executing in sandbox container..."}
                    </span>
                  ) : (
                    codeOut || (
                      <span className="text-[#94a3b8]">
                        {
                          '> Click "Run Code" (or press Ctrl+Enter) to execute the active file on Judge0 CE.'
                        }
                      </span>
                    )
                  )}
                </pre>

                {/* Standard Input Drawer */}
                <div className="p-2 border-t border-[#1a3a50] bg-[#08121c] flex-shrink-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Terminal size={10} className="text-[#38bdf8]" />
                    <span className="text-[9px] font-bold uppercase text-[#94a3b8]">
                      Standard Input (stdin)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={sandboxStdin}
                    onChange={(e) => setSandboxStdin(e.target.value)}
                    placeholder="Optional stdin arguments..."
                    className="w-full h-7 px-2 rounded-lg border text-[11px] mono focus:outline-none bg-[#050c14] border-[#1e3a52] text-[#f1f5f9]"
                  />
                </div>
              </div>
            ) : (
              /* LIVE INTERACTIVE SCREEN PREVIEW MODE */
              <Card className="overflow-hidden shadow-sm flex flex-col h-full">
                {/* Screen preview control header */}
                <div
                  className="h-10 px-3 border-b flex items-center justify-between flex-shrink-0"
                  style={{ borderColor: "var(--bdr)", background: "var(--srf2)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} style={{ color: "var(--acc)" }} />
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--t1)" }}
                    >
                      Live Screen
                    </span>
                  </div>

                  {/* Device Viewport Selector */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1.5 rounded-md cursor-pointer transition ${
                        previewDevice === "desktop"
                          ? "bg-[var(--acc)] text-white"
                          : "text-[var(--t3)] hover:text-[var(--t1)]"
                      }`}
                      title="Desktop View (100%)"
                    >
                      <Monitor size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("tablet")}
                      className={`p-1.5 rounded-md cursor-pointer transition ${
                        previewDevice === "tablet"
                          ? "bg-[var(--acc)] text-white"
                          : "text-[var(--t3)] hover:text-[var(--t1)]"
                      }`}
                      title="Tablet View (768px)"
                    >
                      <Tablet size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1.5 rounded-md cursor-pointer transition ${
                        previewDevice === "mobile"
                          ? "bg-[var(--acc)] text-white"
                          : "text-[var(--t3)] hover:text-[var(--t1)]"
                      }`}
                      title="Mobile View (375px)"
                    >
                      <Smartphone size={13} />
                    </button>
                    <div className="w-[1px] h-4 bg-[var(--bdr)] mx-1" />
                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="p-1.5 rounded-md text-[var(--t3)] hover:text-[var(--acc)] cursor-pointer"
                      title="Reload Screen"
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="p-1.5 rounded-md text-[var(--acc)] hover:opacity-80 cursor-pointer"
                      title="Open full-screen in new tab"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>

                {/* Sandboxed Interactive Iframe Container */}
                <div
                  className={`flex-1 flex items-center justify-center overflow-hidden ${
                    previewDevice === "desktop"
                      ? "p-0 bg-transparent"
                      : "p-2 bg-[var(--srf2)]"
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-300 overflow-hidden bg-white ${
                      previewDevice === "desktop"
                        ? "w-full border-0 shadow-none rounded-none"
                        : "rounded-xl border border-[var(--bdr)] shadow-md"
                    }`}
                    style={{
                      width:
                        previewDevice === "mobile"
                          ? "375px"
                          : previewDevice === "tablet"
                          ? "100%"
                          : "100%",
                      maxWidth:
                        previewDevice === "mobile"
                          ? "375px"
                          : previewDevice === "tablet"
                          ? "768px"
                          : "100%",
                    }}
                  >
                    <iframe
                      key={previewKey}
                      srcDoc={previewSrcDoc}
                      title="Live Application Viewport"
                      sandbox="allow-scripts allow-modals"
                      className="w-full h-full border-0 block"
                    />
                  </div>
                </div>

                {/* Live preview bottom status bar */}
                <div
                  className="h-7 px-3 border-t flex items-center justify-between text-[11px] flex-shrink-0"
                  style={{
                    borderColor: "var(--bdr)",
                    background: "var(--srf2)",
                    color: "var(--t3)",
                  }}
                >
                  <span>Viewport: {previewDevice.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="text-[#06b6d4] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open in New Tab <ExternalLink size={10} />
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* CREATE NEW FILE MODAL */}
      <SandboxNewFileModal
        show={newFilePrompt.show}
        fileName={newFilePrompt.name}
        onChangeFileName={(name) => setNewFilePrompt({ show: true, name })}
        onClose={() => setNewFilePrompt({ show: false, name: "" })}
        onCreate={handleCreateNewFile}
      />

      {/* COMMIT & PUSH TO GITEA MODAL */}
      <SandboxCommitModal
        show={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        workspaceFiles={workspaceFiles}
        isPathIgnored={isPathIgnored}
        commitMessage={commitMessage}
        onChangeCommitMessage={setCommitMessage}
        commitBranch={commitBranch}
        onChangeCommitBranch={setCommitBranch}
        isPushing={isPushing}
        onCommitAndPush={handleCommitAndPush}
      />
    </div>
  );

  return sandboxExpanded && typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
};

export default ProjectSandboxTab;
