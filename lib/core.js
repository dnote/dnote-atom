"use babel";

import { exec } from "child_process";
import fs from "fs";
import os from "os";
import http from "http";
import opn from "opn";
import path from "path";

const inputRegex = /<!--\s*book:\s*([\w-\s]*)\s*-->\s*\n*(.*)/;

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

// initialContent is the initial content of the temporary file
export const initialContent = "<!-- book: INSERT_BOOK_NAME -->\n\n\n";
export const tmpFilePath = path.resolve(__dirname, "../tmp/ATOM_TMPCONTENT.md");

// parseInput parses the content of the temporary dnote file and returns an
// object representing the book and the content
export function parseInput(input) {
  const matched = input.match(inputRegex);

  let bookName = matched[1];
  let content = matched[2];

  if (!input) {
    throw new Error("Empty input");
  }
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
