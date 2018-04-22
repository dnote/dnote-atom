"use babel";

import { CompositeDisposable } from "atom";

import statusBarIcon from "./statusBarIcon";

// Lazyload dependencies
let exec = null;
let fs = null;
let os = null;
let http = null;
let opn = null;
let path = null;
let Range = null;
let Point = null;

// initialContent is the initial content of the temporary file
const initialContent = "<!-- book: INSERT_BOOK_NAME -->\n\n\n";
const inputRegex = /^\s*<!--\s*book:\s*([\w-\s]*)?\s*-->\s*\n*(.+)?/;
const notificationMethodMap = {
  success: "addSuccess",
  error: "addError",
  warning: "addWarning",
  info: "addInfo"
};

function sh(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// EmptyInputError is an error thrown in cases in which an input is empty
class EmptyInputError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);

    this.name = "EmptyInputError";
    this.message = message;
  }
}

// parseInput parses the content of the temporary dnote file and returns an
// object representing the book and the content
function parseInput(input) {
  if (!input || input === "\n" || input === "\r\n") {
    throw new EmptyInputError("Empty input");
  }

  const matched = input.match(inputRegex);
  if (!matched) {
    throw new Error("Invalid input");
  }

  let bookName = matched[1];
  let content = matched[2];

  if (!bookName) {
    throw new Error("No book was specified");
  }
  if (!content) {
    throw new Error("Content was empty");
  }

  bookName = bookName.trim();
  content = content.trim();

  return {
    bookName,
    content
  };
}

// isDnoteInstalled returns a boolean indicating if dnote executable exists
function isDnoteInstalled() {
  if (os.type === "Windows_NT") {
    // TODO: support windows
    return true;
    // return fs.existsSync("");
  }

  return sh("command -v dnote")
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
}

async function initDnote() {
  const installed = await isDnoteInstalled();

  if (installed) {
    return;
  }

  const notification = atom.notifications.addInfo("Dnote Atom", {
    description:
      "Dnote Atom requires the Dnote CLI. Please install the CLI before using.",
    dismissable: true,
    buttons: [
      {
        text: "Download",
        onDidClick() {
          opn("https://github.com/dnote-io/cli");
          notification.dismiss();
        }
      }
    ]
  });
}

// addNote adds the given note to the specified book
function addNote(bookName, content) {
  const escaped = content.replace("'", "\\'");

  // TODO: need a way to silence the upgrade check suggestion
  const cmd = `dnote add ${bookName} -c '${escaped}'`;

  return sh(cmd);
}

// checkFileExists checks if a file or directory exists at the given path
function checkFileExists(path) {
  try {
    fs.lstatSync(path);
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    } else {
      throw e;
    }
  }

  return true;
}

// flash adds a notification that automatically dismisses itself after the
// specified ttl
function flash(message, { type, option, ttl }) {
  const method = notificationMethodMap[type];
  const notification = atom.notifications[method](message, option);

  window.setTimeout(() => {
    notification.dismiss();
  }, ttl);
}

// writeFile creates a file with the content at the given path, and recursively
// creates the parent directory if they do not exist
function writeFile(path, content) {
  const parts = path.split("/");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === "") {
      continue;
    }

    if (i === parts.length - 1) {
      fs.writeFileSync(path, content, "utf-8");
    } else {
      const p = parts.slice(0, i + 1).join("/");

      if (!checkFileExists(p)) {
        fs.mkdirSync(p);
      }
    }
  }
}

function loadDependencies() {
  exec = require("child_process").exec;
  fs = require("fs");
  os = require("os");
  http = require("http");
  opn = require("opn");
  path = require("path");

  const atom = require("atom");
  Range = atom.Range;
  Point = atom.Point;
}

export default {
  subscriptions: null,
  activated: false,
  // tmpFilePath is the absolute path to the temporary file
  tmpFilePath: "",
  delayedActivationCallbackId: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "dnote:new": () => this.start()
      })
    );

    this.delayedActivationCallbackId = window.requestIdleCallback(
      () => {
        this.delayedActivate();
      },
      { timeout: 10000 }
    );
  },

  deactivate() {
    this.subscriptions.dispose();
    this.statusBarIcon.destroy();
    this.statusBarTile.destroy();
  },

  serialize() {
    return {};
  },

  consumeStatusBar(statusBar) {
    this.statusBarIcon = statusBarIcon.init({
      onClick: () => {
        this.start();
      }
    });

    this.statusBarTile = statusBar.addRightTile({
      item: this.statusBarIcon,
      priority: 300
    });
  },

  delayedActivate() {
    console.log("dnote-atom: lazily activating...");
    loadDependencies();
    initDnote();

    this.tmpFilePath = path.resolve(__dirname, "../tmp/ATOM_TMPCONTENT.md");
    this.activated = true;
    console.log("dnote-atom: ready");
  },

  async handleDestroy(input) {
    try {
      const { bookName, content } = parseInput(input);

      await addNote(bookName, content);
      fs.unlinkSync(this.tmpFilePath);

      flash(`Added to ${bookName}`, {
        type: "success",
        option: {
          dismissable: true
        },
        ttl: 1600
      });
    } catch (e) {
      if (e instanceof EmptyInputError) {
        fs.unlinkSync(this.tmpFilePath);
        flash("Reset template", {
          type: "info",
          option: {
            description: "Successfully reset template",
            dismissable: true
          },
          ttl: 1600
        });
      } else {
        flash("Could not save the note", {
          type: "error",
          option: {
            description: e.message,
            stack: e.stack,
            dismissable: true
          },
          ttl: 5000
        });
      }
    }
  },

  start() {
    // If not yet activated, cancel the idle callback and activate now
    if (!this.activated) {
      window.cancelIdleCallback(this.delayedActivationCallbackId);
      this.delayedActivate();
    }

    const dirty = checkFileExists(this.tmpFilePath);

    if (!dirty) {
      writeFile(this.tmpFilePath, initialContent, "utf-8");
    }

    atom.workspace
      .open(this.tmpFilePath)
      .then(() => {
        const editor = atom.workspace.getActiveTextEditor();

        if (dirty) {
          flash("Unsaved note", {
            type: "info",
            option: {
              description: "Recovered a note. Save empty to reset template.",
              dismissable: true
            },
            ttl: 3000
          });
        }

        let input = editor.getText();
        editor.setSelectedBufferRange(
          new Range(new Point(0, 11), new Point(0, 27))
        );

        editor.onDidSave(() => {
          input = editor.getText();
        });
        editor.onDidDestroy(() => {
          this.handleDestroy(input);
        });
      })
      .catch(err => {
        atom.notifications.addError("Could not open the temporary file", {
          description: err.message,
          stack: err.stack,
          dismissable: true
        });
      });
  }
};
