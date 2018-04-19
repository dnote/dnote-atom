"use babel";

import { CompositeDisposable, Range, Point } from "atom";
import fs from "fs";

import {
  initialContent,
  initDnote,
  parseInput,
  addNote,
  tmpFilePath
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

      const notification = atom.notifications.addSuccess(
        `Added to ${bookName}`,
        {
          dismissable: true
        }
      );

      window.setTimeout(() => {
        notification.dismiss();
      }, 1600);
    } catch (e) {
      atom.notifications.addError("Could not save the note", {
        description: e.message,
        stack: e.stack,
        dismissable: true
      });
    }
  },

  start() {
    atom.workspace
      .open(tmpFilePath)
      .then(() => {
        const editor = atom.workspace.getActiveTextEditor();

        editor.setText(initialContent);
        editor.setSelectedBufferRange(
          new Range(new Point(0, 11), new Point(0, 27))
        );

        let input = "";
        editor.onDidSave(() => {
          input = editor.getText();
        });
        editor.onDidDestroy(() => {
          this.handleDestroy(input);
        });
      })
      .catch(err => {
        atom.notifications.addError("Could not open the temporary file", {
          stack: e.stack,
          dismissable: true
        });
      });
  }
};
