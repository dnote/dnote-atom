"use babel";

import { exec } from "child_process";
import fs from "fs";

function sh(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      console.log("stderr", stderr);
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
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
