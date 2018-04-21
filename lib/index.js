"use babel";

import { CompositeDisposable, Range, Point } from "atom";
import fs from "fs";

import {
  initialContent,
  initDnote,
  parseInput,
  addNote,
  tmpFilePath,
  checkFileExists,
  EmptyInputError,
  flash
} from "./core";

function wrapAsync(fn) {
  const promise = fn();

  promise.catch(err => {});
}

export default {
  subscriptions: null,
  inited: false,

  initialize() {
    initDnote();
  },

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "dnote:new": () => this.start()
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  },

  async handleDestroy(input) {
    try {
      const { bookName, content } = parseInput(input);

      await addNote(bookName, content);
      fs.unlinkSync(tmpFilePath);

      flash(`Added to ${bookName}`, {
        type: "success",
        option: {
          dismissable: true
        },
        ttl: 1600
      });
    } catch (e) {
      if (e instanceof EmptyInputError) {
        fs.unlinkSync(tmpFilePath);
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
    const dirty = checkFileExists(tmpFilePath);

    if (!dirty) {
      fs.writeFileSync(tmpFilePath, initialContent, "utf-8");
    }

    atom.workspace
      .open(tmpFilePath)
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
