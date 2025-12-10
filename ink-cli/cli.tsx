#!/usr/bin/env node
import React, { useEffect, useState, useCallback } from "react";
import { render, Text, Box } from "ink";
import TextInput from "ink-text-input";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/components/asset-manager/_generated/api";

// --- Config -----------------------------------------------------------------

const CONVEX_URL =
  process.env.CONVEX_URL ||
  process.env.CONVEX_DEPLOYMENT ||
  "http://127.0.0.1:8187"; // local dev default; change if needed

const client = new ConvexHttpClient(CONVEX_URL);

// --- Types ------------------------------------------------------------------

type Folder = {
  _id: string;
  path: string;
  name: string;
  extra?: unknown;
  createdAt: number;
  updatedAt: number;
};

// --- Helpers ----------------------------------------------------------------

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "";
  return trimmed.replace(/^\/+|\/+$/g, "");
}

function parentOf(path: string): string {
  const norm = normalizePath(path);
  if (!norm) return "";
  const idx = norm.lastIndexOf("/");
  if (idx === -1) return "";
  return norm.slice(0, idx);
}

function basenameOf(path: string): string {
  const norm = normalizePath(path);
  if (!norm) return "";
  const idx = norm.lastIndexOf("/");
  if (idx === -1) return norm;
  return norm.slice(idx + 1);
}

// --- CLI Component ----------------------------------------------------------

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(""); // "" = root
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const prompt = currentPath ? `/${currentPath}` : `/`;

  const log = useCallback((line: string) => {
    setOutput((prev) => [...prev, line]);
  }, []);

  const loadFolders = useCallback(async (targetPath: string) => {
    setLoading(true);
    setError(null);
    try {
      const parentPath = normalizePath(targetPath) || undefined;
      const res = await client.query(api.assetManager.listFolders, {
        parentPath,
      });
      setFolders(res);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders(currentPath);
  }, [currentPath, loadFolders]);

  const handleCd = useCallback(
    async (arg: string | undefined) => {
      if (!arg || arg === ".") return;

      if (arg === "/") {
        setCurrentPath("");
        log("cd /");
        return;
      }

      if (arg === "..") {
        const parent = parentOf(currentPath);
        log(`cd ..  (${currentPath || "/"} -> ${parent || "/"})`);
        setCurrentPath(parent);
        return;
      }

      // relative or absolute
      let nextPath: string;
      if (arg.startsWith("/")) {
        nextPath = normalizePath(arg);
      } else {
        nextPath = currentPath
          ? `${currentPath}/${normalizePath(arg)}`
          : normalizePath(arg);
      }

      // verify folder exists
      try {
        const folder = await client.query(api.assetManager.getFolder, {
          path: nextPath,
        });
        if (!folder) {
          log(`cd: no such folder: ${arg}`);
          return;
        }
        setCurrentPath(nextPath);
        log(`cd ${arg}`);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    },
    [currentPath, log],
  );

  const handleLs = useCallback(() => {
    if (folders.length === 0) {
      log("(empty)");
      return;
    }
    for (const f of folders) {
      const base = basenameOf(f.path) || f.path;
      log(`${base}\t(${f.path})`);
    }
  }, [folders, log]);

  const handleMkdir = useCallback(
    async (name: string | undefined) => {
      if (!name) {
        log("mkdir: missing folder name");
        return;
      }
      try {
        const parentPath = normalizePath(currentPath);
        const res = await client.mutation(api.assetManager.createFolderByName, {
          parentPath,
          name,
        });
        log(`mkdir: created '${name}' at ${parentPath || "/"}`);
        // refresh listing
        void loadFolders(currentPath);
        return res;
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        log(`mkdir: ${msg}`);
      }
    },
    [currentPath, loadFolders, log],
  );

  const handleCommand = useCallback(
    async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const [cmd, ...rest] = trimmed.split(/\s+/);
      const arg = rest.join(" ") || undefined;

      switch (cmd) {
        case "ls":
          handleLs();
          break;

        case "cd":
          await handleCd(arg);
          break;

        case "mkdir":
          await handleMkdir(arg);
          break;

        case "pwd":
          log(currentPath ? `/${currentPath}` : "/");
          break;

        case "help":
          log("Commands:");
          log("  ls                 List child folders");
          log("  cd <name|..|/>     Change directory");
          log("  mkdir <name>       Create folder under current");
          log("  pwd                Print current path");
          log("  help               Show this help");
          log("  exit, quit         Exit");
          break;

        case "exit":
        case "quit":
          process.exit(0);

        default:
          log(`Unknown command: ${cmd} (try 'help')`);
      }
    },
    [handleCd, handleLs, handleMkdir, currentPath, log],
  );

  const onSubmit = useCallback(
    (line: string) => {
      void handleCommand(line);
      setInput("");
    },
    [handleCommand],
  );

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">asset-fs</Text>
        <Text> </Text>
        <Text color="gray">connected to</Text>
        <Text> </Text>
        <Text color="green">{CONVEX_URL}</Text>
      </Box>

      <Box>
        <Text color="magenta">path:</Text>
        <Text> {prompt}</Text>
        {loading && <Text color="yellow"> (loading…)</Text>}
      </Box>

      {error && (
        <Box>
          <Text color="red">error: {error}</Text>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        {output.slice(-15).map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>

      <Box>
        <Text color="green">{prompt} $ </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          placeholder="ls | cd <name> | mkdir <name> | help"
        />
      </Box>
    </Box>
  );
};

// --- Run --------------------------------------------------------------------

render(<App />);
