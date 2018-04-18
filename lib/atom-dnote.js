"use babel";

import { CompositeDisposable, Range, Point } from "atom";

import AtomDnoteView from "./atom-dnote-view";
import { isDnoteInstalled, parseInput, addNote } from "./utils";

const initialContent = "<!-- book: INSERT_BOOK_NAME -->\n\n\n";

export default {
  atomDnoteView: null,
  modalPanel: null,
  subscriptions: null,

  initialize(state) {
    console.log("initing");
  },

  activate(state) {
    console.log("activating");
    this.atomDnoteView = new AtomDnoteView(state.atomDnoteViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomDnoteView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "atom-dnote:toggle": () => this.toggle()
      })
    );
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomDnoteView.destroy();
  },

  serialize() {
    return {
      atomDnoteViewState: this.atomDnoteView.serialize()
    };
  },

  async toggle() {
    try {
      await atom.workspace.open("tmp/ATOM_TMPCONTENT.md");

      // TODO: what if there is a file already?

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
        const { bookName, content } = parseInput(input);
        addNote(bookName, content);
      });
    } catch (e) {
      console.log("error", e);
    }
  }
};
