"use babel";

import { exec } from "child_process";
import fs from "fs";

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

// parseInput parses the content of the temporary dnote file and returns an
// object representing the book and the content
export function parseInput(input) {
  const matched = input.match(inputRegex);

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
  return fs.existsSync("/usr/local/bin/dnote");
}

// addNote adds the given note to the specified book
export function addNote(bookName, content) {
  const escaped = content.replace("'", "\\'");
  const cmd = `dnote add ${bookName} -c '${escaped}'`;

  return sh(cmd);
}
