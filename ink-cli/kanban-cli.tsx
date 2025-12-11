#!/usr/bin/env node
import React, { useEffect, useState, useCallback } from "react";
import { render, Text, Box, useInput } from "ink";
import chalk from "chalk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// --- Custom TextInput with cursor control -----------------------------------

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  cursorOffset: number;
  onCursorChange: (offset: number) => void;
  placeholder?: string;
  focus?: boolean;
  history?: string[];
  historyIndex?: number;
  onHistoryChange?: (index: number) => void;
};

const TextInputWithCursor: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSubmit,
  cursorOffset,
  onCursorChange,
  placeholder = "",
  focus = true,
  history = [],
  historyIndex = -1,
  onHistoryChange,
}) => {
  useInput(
    (input, key) => {
      if ((key.ctrl && input === "c") || key.tab) {
        return;
      }

      // History navigation
      if (key.upArrow) {
        if (history.length > 0 && onHistoryChange) {
          const newIndex = historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
          onHistoryChange(newIndex);
          const historyValue = history[newIndex] || "";
          onChange(historyValue);
          onCursorChange(historyValue.length);
        }
        return;
      }

      if (key.downArrow) {
        if (history.length > 0 && onHistoryChange) {
          if (historyIndex === -1) return;
          const newIndex = historyIndex >= history.length - 1 ? -1 : historyIndex + 1;
          onHistoryChange(newIndex);
          const historyValue = newIndex === -1 ? "" : history[newIndex] || "";
          onChange(historyValue);
          onCursorChange(historyValue.length);
        }
        return;
      }

      if (key.return) {
        onSubmit?.(value);
        return;
      }

      let nextOffset = cursorOffset;
      let nextValue = value;

      if (key.leftArrow) {
        if (key.meta || key.ctrl) {
          // Cmd+Left or Ctrl+Left: jump to beginning
          nextOffset = 0;
        } else {
          nextOffset = Math.max(0, cursorOffset - 1);
        }
      } else if (key.rightArrow) {
        if (key.meta || key.ctrl) {
          // Cmd+Right or Ctrl+Right: jump to end
          nextOffset = value.length;
        } else {
          nextOffset = Math.min(value.length, cursorOffset + 1);
        }
      } else if (key.backspace || key.delete) {
        if (cursorOffset > 0) {
          nextValue = value.slice(0, cursorOffset - 1) + value.slice(cursorOffset);
          nextOffset = cursorOffset - 1;
        }
      } else if (input) {
        nextValue = value.slice(0, cursorOffset) + input + value.slice(cursorOffset);
        nextOffset = cursorOffset + input.length;
      }

      if (nextValue !== value) {
        onChange(nextValue);
      }
      if (nextOffset !== cursorOffset) {
        onCursorChange(nextOffset);
      }
    },
    { isActive: focus }
  );

  // Render with cursor
  let rendered: string;
  if (value.length === 0) {
    rendered = placeholder ? chalk.inverse(placeholder[0]) + chalk.gray(placeholder.slice(1)) : chalk.inverse(" ");
  } else {
    rendered = "";
    for (let i = 0; i < value.length; i++) {
      rendered += i === cursorOffset ? chalk.inverse(value[i]) : value[i];
    }
    if (cursorOffset >= value.length) {
      rendered += chalk.inverse(" ");
    }
  }

  return <Text>{rendered}</Text>;
};

// --- Config -----------------------------------------------------------------

function getConvexUrl(): string {
  if (process.env.CONVEX_URL) {
    return process.env.CONVEX_URL;
  }
  if (process.env.VITE_CONVEX_URL) {
    return process.env.VITE_CONVEX_URL;
  }
  if (process.env.CONVEX_DEPLOYMENT) {
    const deployment = process.env.CONVEX_DEPLOYMENT;
    // Handle "dev:slug-name-123" format -> "https://slug-name-123.convex.cloud"
    if (deployment.startsWith("dev:")) {
      const slug = deployment.slice(4);
      return `https://${slug}.convex.cloud`;
    }
    // Handle "prod:slug-name-123" format
    if (deployment.startsWith("prod:")) {
      const slug = deployment.slice(5);
      return `https://${slug}.convex.cloud`;
    }
    // Already a URL
    if (deployment.startsWith("http")) {
      return deployment;
    }
  }
  return "http://127.0.0.1:8187";
}

const CONVEX_URL = getConvexUrl();

const client = new ConvexHttpClient(CONVEX_URL);

// --- Types ------------------------------------------------------------------

type Column = {
  slug: string;
  path: string;
};

type Card = {
  boardSlug: string;
  column: string;
  basename: string;
  title: string;
  description: string;
  version: number;
};

type HistoryEvent = {
  type: string;
  fromColumn?: string;
  toColumn?: string;
  createdAt: number;
};

// --- Constants --------------------------------------------------------------

const COLUMNS = ["backlog", "doing", "review", "done"];
const COMMANDS = [
  "boards", "new", "use", "columns", "ls", "add", "cat", "set",
  "move", "edit", "history", "help", "exit", "quit"
];

// --- CLI Component ----------------------------------------------------------

const App: React.FC = () => {
  const [currentBoard, setCurrentBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [cursorOffset, setCursorOffset] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [output, setOutput] = useState<{ text: string; color?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cache for tab completion
  const [boardsCache, setBoardsCache] = useState<string[]>([]);
  const [cardsCache, setCardsCache] = useState<Map<string, string[]>>(new Map());

  const prompt = currentBoard ? `kanban [${currentBoard}]` : "kanban";

  const log = useCallback((line: string, color?: string) => {
    setOutput((prev) => [...prev, { text: line, color }]);
  }, []);

  const logSuccess = useCallback(
    (line: string) => log(line, "green"),
    [log]
  );
  const logError = useCallback((line: string) => log(line, "red"), [log]);
  const logInfo = useCallback((line: string) => log(line, "cyan"), [log]);

  // --- Command Handlers -----------------------------------------------------

  // Refresh boards cache
  const refreshBoardsCache = useCallback(async () => {
    try {
      const folders = await client.query(api.cli.listFolders, {
        parentPath: "kanban",
      });
      const names = folders.map(f => f.path.split("/").pop() || f.path);
      setBoardsCache(names);
      return names;
    } catch {
      return [];
    }
  }, []);

  // Refresh cards cache for current board
  const refreshCardsCache = useCallback(async () => {
    if (!currentBoard) return;
    try {
      const newCache = new Map<string, string[]>();
      for (const col of COLUMNS) {
        const cards = await client.query(api.kanban.listColumnCards, {
          boardSlug: currentBoard,
          column: col,
        });
        newCache.set(col, cards.map(c => c.basename));
      }
      setCardsCache(newCache);
    } catch {
      // ignore
    }
  }, [currentBoard]);

  // Refresh cards cache when board changes
  useEffect(() => {
    if (currentBoard) {
      void refreshCardsCache();
    }
  }, [currentBoard, refreshCardsCache]);

  const handleBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const names = await refreshBoardsCache();
      if (names.length === 0) {
        log("No boards found. Use 'new <name>' to create one.");
        return;
      }
      logInfo("Available boards:");
      for (const name of names) {
        log(`  ${name}`);
      }
    } catch (err: any) {
      logError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [log, logInfo, logError, refreshBoardsCache]);

  const handleUse = useCallback(
    async (board: string | undefined) => {
      if (!board) {
        logError("Usage: use <board>");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const columns = await client.query(api.kanban.listColumns, {
          boardSlug: board,
        });
        if (columns.length === 0) {
          logError(`Board '${board}' not found or has no columns`);
          return;
        }
        setCurrentBoard(board);
        logSuccess(`Switched to board '${board}'`);
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [logSuccess, logError]
  );

  const handleNew = useCallback(
    async (boardSlug: string | undefined) => {
      if (!boardSlug) {
        logError("Usage: new <boardSlug>");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await client.mutation(api.kanban.createBoard, {
          boardSlug,
        });
        const cols = result.columns.map((c: Column) => c.slug).join(", ");
        logSuccess(`Created board '${boardSlug}' with columns: ${cols}`);
        setCurrentBoard(boardSlug);
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [logSuccess, logError]
  );

  const handleColumns = useCallback(async () => {
    if (!currentBoard) {
      logError("No board selected. Use 'use <board>' or 'new <board>' first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const columns = await client.query(api.kanban.listColumns, {
        boardSlug: currentBoard,
      });
      logInfo(`Columns in '${currentBoard}':`);
      for (const col of columns) {
        log(`  ${col.slug}`);
      }
    } catch (err: any) {
      logError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [currentBoard, log, logInfo, logError]);

  const handleLs = useCallback(
    async (column: string | undefined) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (column) {
          const cards = await client.query(api.kanban.listColumnCards, {
            boardSlug: currentBoard,
            column,
          });
          if (cards.length === 0) {
            log(`No cards in '${column}'`);
            return;
          }
          logInfo(`Cards in '${column}':`);
          for (const card of cards) {
            log(`  ${card.basename} (v${card.version}) - ${card.title}`);
          }
        } else {
          // Show all columns with card counts
          const allColumns = ["backlog", "doing", "review", "done"];
          logInfo(`Cards in '${currentBoard}':`);
          for (const col of allColumns) {
            const cards = await client.query(api.kanban.listColumnCards, {
              boardSlug: currentBoard,
              column: col,
            });
            log(`  ${col}: ${cards.length} card(s)`);
          }
        }
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, log, logInfo, logError]
  );

  const handleAdd = useCallback(
    async (args: string[]) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      if (args.length < 2) {
        logError("Usage: add <column> <title> [description]");
        return;
      }
      const [column, ...rest] = args;
      // Title is in quotes or first word, rest is description
      const titleAndDesc = rest.join(" ");
      let title: string;
      let description: string;

      // Check for quoted title
      const quoteMatch = titleAndDesc.match(/^"([^"]+)"(.*)$/);
      if (quoteMatch) {
        title = quoteMatch[1];
        description = quoteMatch[2].trim();
      } else {
        title = rest[0] || "";
        description = rest.slice(1).join(" ");
      }

      if (!title) {
        logError("Usage: add <column> <title> [description]");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await client.mutation(api.kanban.createCard, {
          boardSlug: currentBoard,
          column,
          title,
          description,
        });
        logSuccess(
          `Created card '${title}' (${result.basename}) v${result.version} in ${column}`
        );
        void refreshCardsCache();
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, logSuccess, logError, refreshCardsCache]
  );

  const handleMove = useCallback(
    async (args: string[]) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      if (args.length < 3) {
        logError("Usage: move <basename> <from> <to>");
        return;
      }
      const [basename, from, to] = args;
      setLoading(true);
      setError(null);
      try {
        await client.mutation(api.kanban.moveCard, {
          boardSlug: currentBoard,
          fromColumn: from,
          toColumn: to,
          basename,
        });
        logSuccess(`Moved '${basename}' from ${from} to ${to}`);
        void refreshCardsCache();
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, logSuccess, logError, refreshCardsCache]
  );

  const handleEdit = useCallback(
    async (args: string[]) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      if (args.length < 4) {
        logError("Usage: edit <basename> <column> <title> <description>");
        return;
      }
      const [basename, column, ...rest] = args;
      // Title is in quotes or first word, rest is description
      const titleAndDesc = rest.join(" ");
      let title: string;
      let description: string;

      const quoteMatch = titleAndDesc.match(/^"([^"]+)"(.*)$/);
      if (quoteMatch) {
        title = quoteMatch[1];
        description = quoteMatch[2].trim();
      } else {
        title = rest[0] || "";
        description = rest.slice(1).join(" ");
      }

      setLoading(true);
      setError(null);
      try {
        const result = await client.mutation(api.kanban.updateCard, {
          boardSlug: currentBoard,
          column,
          basename,
          title,
          description,
        });
        logSuccess(`Updated '${basename}' to v${result.version}`);
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, logSuccess, logError]
  );

  const handleHistory = useCallback(
    async (args: string[]) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      if (args.length < 2) {
        logError("Usage: history <basename> <column>");
        return;
      }
      const [basename, column] = args;
      setLoading(true);
      setError(null);
      try {
        const history = await client.query(api.kanban.getCardHistory, {
          boardSlug: currentBoard,
          column,
          basename,
        });
        if (history.length === 0) {
          log("No movement history for this card");
          return;
        }
        logInfo(`Movement history for '${basename}':`);
        for (const event of history) {
          const date = new Date(event.createdAt).toLocaleString();
          log(`  ${date}: ${event.fromColumn} -> ${event.toColumn}`);
        }
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, log, logInfo, logError]
  );

  const handleCat = useCallback(
    async (args: string[]) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      if (args.length < 2) {
        logError("Usage: cat <basename> <column>");
        return;
      }
      const [basename, column] = args;
      setLoading(true);
      setError(null);
      try {
        const card = await client.query(api.kanban.getCard, {
          boardSlug: currentBoard,
          column,
          basename,
        });
        if (!card) {
          logError(`Card '${basename}' not found in ${column}`);
          return;
        }
        logInfo(`Card: ${card.basename} (v${card.version})`);
        log(`  Title: ${card.title}`);
        log(`  Column: ${card.column}`);
        log(`  Description: ${card.description || "(empty)"}`);
        if (card.publishedAt) {
          log(`  Published: ${new Date(card.publishedAt).toLocaleString()}`);
        }
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, log, logInfo, logError]
  );

  const handleSet = useCallback(
    async (args: string[]) => {
      if (!currentBoard) {
        logError("No board selected. Use 'use <board>' or 'new <board>' first.");
        return;
      }
      if (args.length < 4) {
        logError("Usage: set <basename> <column> <field> <value>");
        logError("  Fields: title, description");
        return;
      }
      const [basename, column, field, ...valueParts] = args;
      const value = valueParts.join(" ");

      if (field !== "title" && field !== "description") {
        logError("Field must be 'title' or 'description'");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // First get the current card to preserve other fields
        const card = await client.query(api.kanban.getCard, {
          boardSlug: currentBoard,
          column,
          basename,
        });
        if (!card) {
          logError(`Card '${basename}' not found in ${column}`);
          return;
        }

        const result = await client.mutation(api.kanban.updateCard, {
          boardSlug: currentBoard,
          column,
          basename,
          title: field === "title" ? value : card.title,
          description: field === "description" ? value : card.description,
        });
        logSuccess(`Updated '${basename}' ${field} to v${result.version}`);
      } catch (err: any) {
        logError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    [currentBoard, logSuccess, logError]
  );

  const handleHelp = useCallback(() => {
    logInfo("Kanban CLI Commands:");
    log("  boards                              List available boards");
    log("  new <boardSlug>                     Create a new board");
    log("  use <board>                         Select a board to work with");
    log("  columns                             List columns in current board");
    log("  ls [column]                         List cards (all or in column)");
    log('  add <column> <title> [desc]         Create a card');
    log("  cat <basename> <column>             Show card details");
    log("  set <basename> <col> <field> <val>  Update card field (title/description)");
    log("  move <basename> <from> <to>         Move card between columns");
    log("  history <basename> <column>         Show card movement history");
    log("  help                                Show this help");
    log("  exit, quit                          Exit the CLI");
  }, [log, logInfo]);

  // --- Command Router -------------------------------------------------------

  const handleCommand = useCallback(
    async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Parse command and args, respecting quotes
      const parts: string[] = [];
      let current = "";
      let inQuote = false;
      for (const char of trimmed) {
        if (char === '"') {
          inQuote = !inQuote;
          current += char;
        } else if (char === " " && !inQuote) {
          if (current) {
            parts.push(current);
            current = "";
          }
        } else {
          current += char;
        }
      }
      if (current) parts.push(current);

      const [cmd, ...args] = parts;

      switch (cmd) {
        case "boards":
          await handleBoards();
          break;

        case "use":
          await handleUse(args[0]);
          break;

        case "new":
          await handleNew(args[0]);
          break;

        case "columns":
          await handleColumns();
          break;

        case "ls":
          await handleLs(args[0]);
          break;

        case "add":
          await handleAdd(args);
          break;

        case "cat":
          await handleCat(args);
          break;

        case "set":
          await handleSet(args);
          break;

        case "move":
          await handleMove(args);
          break;

        case "edit":
          await handleEdit(args);
          break;

        case "history":
          await handleHistory(args);
          break;

        case "help":
          handleHelp();
          break;

        case "exit":
        case "quit":
          process.exit(0);

        default:
          logError(`Unknown command: ${cmd} (try 'help')`);
      }
    },
    [
      handleBoards,
      handleUse,
      handleNew,
      handleColumns,
      handleLs,
      handleAdd,
      handleCat,
      handleSet,
      handleMove,
      handleEdit,
      handleHistory,
      handleHelp,
      logError,
    ]
  );

  const onSubmit = useCallback(
    (line: string) => {
      log(`> ${line}`, "gray");
      void handleCommand(line);
      // Add to history (avoid duplicates of last command)
      if (line.trim() && (history.length === 0 || history[history.length - 1] !== line.trim())) {
        setHistory(prev => [...prev, line.trim()]);
      }
      setInput("");
      setCursorOffset(0);
      setHistoryIndex(-1);
    },
    [handleCommand, log, history]
  );

  // Get all card basenames from cache
  const getAllCards = useCallback(() => {
    const all: string[] = [];
    cardsCache.forEach((cards) => all.push(...cards));
    return [...new Set(all)];
  }, [cardsCache]);

  // Get completions based on command and argument position
  const getCompletions = useCallback((inputText: string): string[] => {
    const parts = inputText.split(/\s+/);
    const cmd = parts[0]?.toLowerCase() || "";
    const argIndex = parts.length - 1; // 0 = command, 1 = first arg, etc.
    const currentArg = parts[argIndex] || "";

    // Completing command name
    if (argIndex === 0) {
      return COMMANDS.filter(c => c.startsWith(cmd));
    }

    // Command-specific completions
    switch (cmd) {
      case "use":
        // use <board>
        if (argIndex === 1) return boardsCache.filter(b => b.startsWith(currentArg));
        break;

      case "ls":
        // ls [column]
        if (argIndex === 1) return COLUMNS.filter(c => c.startsWith(currentArg));
        break;

      case "add":
        // add <column> <title> [desc]
        if (argIndex === 1) return COLUMNS.filter(c => c.startsWith(currentArg));
        break;

      case "cat":
      case "history":
        // cat/history <basename> <column>
        if (argIndex === 1) return getAllCards().filter(c => c.startsWith(currentArg));
        if (argIndex === 2) return COLUMNS.filter(c => c.startsWith(currentArg));
        break;

      case "set":
        // set <basename> <column> <field> <value>
        if (argIndex === 1) return getAllCards().filter(c => c.startsWith(currentArg));
        if (argIndex === 2) return COLUMNS.filter(c => c.startsWith(currentArg));
        if (argIndex === 3) return ["title", "description"].filter(f => f.startsWith(currentArg));
        break;

      case "move":
        // move <basename> <from> <to>
        if (argIndex === 1) return getAllCards().filter(c => c.startsWith(currentArg));
        if (argIndex === 2 || argIndex === 3) return COLUMNS.filter(c => c.startsWith(currentArg));
        break;

      case "edit":
        // edit <basename> <column> <title> <desc>
        if (argIndex === 1) return getAllCards().filter(c => c.startsWith(currentArg));
        if (argIndex === 2) return COLUMNS.filter(c => c.startsWith(currentArg));
        break;
    }

    return [];
  }, [boardsCache, getAllCards]);

  // Tab completion and delete key handling
  useInput((inputChar, key) => {
    if (key.tab) {
      const parts = input.split(/\s+/);
      const completions = getCompletions(input);

      if (completions.length === 1) {
        // Single match - complete it
        parts[parts.length - 1] = completions[0];
        const newInput = parts.join(" ") + " ";
        setInput(newInput);
        setCursorOffset(newInput.length);
      } else if (completions.length > 1) {
        // Multiple matches - show options
        log(`Completions: ${completions.join(", ")}`, "gray");
        // Find common prefix and complete to that
        const current = parts[parts.length - 1] || "";
        let prefix = completions[0];
        for (const c of completions) {
          while (!c.startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
          }
        }
        if (prefix.length > current.length) {
          parts[parts.length - 1] = prefix;
          const newInput = parts.join(" ");
          setInput(newInput);
          setCursorOffset(newInput.length);
        }
      }
    }
    if (key.delete || (key.ctrl && inputChar === "u")) {
      // Clear the entire line
      setInput("");
      setCursorOffset(0);
    }
  });

  // Load boards cache and show help on startup
  useEffect(() => {
    logInfo("Type 'help' for available commands. Use Tab for completion.");
    void refreshBoardsCache();
  }, [logInfo, refreshBoardsCache]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">kanban-cli</Text>
        <Text> </Text>
        <Text color="gray">connected to</Text>
        <Text> </Text>
        <Text color="green">{CONVEX_URL}</Text>
      </Box>

      <Box>
        <Text color="magenta">board:</Text>
        <Text> {currentBoard || "(none)"}</Text>
        {loading && <Text color="yellow"> (loading...)</Text>}
      </Box>

      {error && (
        <Box>
          <Text color="red">error: {error}</Text>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        {output.slice(-20).map((line, i) => (
          <Text key={i} color={line.color as any}>
            {line.text}
          </Text>
        ))}
      </Box>

      <Box>
        <Text color="green">{prompt}{">"} </Text>
        <TextInputWithCursor
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          cursorOffset={cursorOffset}
          onCursorChange={setCursorOffset}
          placeholder="new | use | ls | cat | set | add | move | help (Tab)"
          history={history}
          historyIndex={historyIndex}
          onHistoryChange={setHistoryIndex}
        />
      </Box>
    </Box>
  );
};

// --- Run --------------------------------------------------------------------

render(<App />);
