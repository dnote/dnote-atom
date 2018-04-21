"use babel";

import { exec } from "child_process";
import fs from "fs";
import os from "os";
import http from "http";
import opn from "opn";
import path from "path";

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
export class EmptyInputError extends Error {
  constructor(message) {
    super();
    Error.captureStackTrace(this, this.constructor);

    this.name = "EmptyInputError";
    this.message = message;
  }
}

// initialContent is the initial content of the temporary file
export const initialContent = "<!-- book: INSERT_BOOK_NAME -->\n\n\n";

// tmpFilePath is the absolute path to the temporary file
export const tmpFilePath = path.resolve(__dirname, "../tmp/ATOM_TMPCONTENT.md");

// parseInput parses the content of the temporary dnote file and returns an
// object representing the book and the content
export function parseInput(input) {
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
export function isDnoteInstalled() {
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

// initDnote installs Dnote if not already installed
export async function initDnote() {
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
export function addNote(bookName, content) {
  const escaped = content.replace("'", "\\'");

  // TODO: need a way to silence the upgrade check suggestion
  const cmd = `dnote add ${bookName} -c '${escaped}'`;

  return sh(cmd);
}

// checkFileExists checks if a file or directory exists at the given path
export function checkFileExists(path) {
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
export function flash(message, { type, option, ttl }) {
  const method = notificationMethodMap[type];
  const notification = atom.notifications[method](message, option);

  window.setTimeout(() => {
    notification.dismiss();
  }, ttl);
}

// writeFile creates a file with the content at the given path, and recursively
// creates the parent directory if they do not exist
export function writeFile(path, content) {
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
