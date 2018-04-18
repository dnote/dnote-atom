"use babel";

import { CompositeDisposable, Range, Point } from "atom";

import { isDnoteInstalled, parseInput, addNote } from "./utils";

const initialContent = "<!-- book: INSERT_BOOK_NAME -->\n\n\n";

export default {
  subscriptions: null,

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

  async start() {
    try {
      await atom.workspace.open("tmp/ATOM_TMPCONTENT.md");

      const editor = atom.workspace.getActiveTextEditor();

      editor.setText(initialContent);
      editor.setSelectedBufferRange(
        new Range(new Point(0, 11), new Point(0, 27))
      );

      let input = "";
      editor.onDidSave(() => {
        input = editor.getText();
      });
      editor.onDidDestroy(async () => {
        const { bookName, content } = parseInput(input);

        await addNote(bookName, content);

        atom.notifications.addSuccess(`Added to ${bookName}`, {
          dismissable: true
        });
      });
    } catch (e) {
      atom.notifications.addError("Could not save the note", {
        stack: e.stack,
        dismissable: true
      });
    }
  }
};
