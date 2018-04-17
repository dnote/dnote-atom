"use babel";

import { CompositeDisposable } from "atom";

import AtomDnoteView from "./atom-dnote-view";
import { isDnoteInstalled, addNote } from "./utils";

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
      await atom.workspace.open("~/.dnote/ATOM_TMPCONTENT.md");

      const editor = atom.workspace.getActiveTextEditor();

      let content = "";
      editor.onDidSave(() => {
        content = editor.getText();
      });

      editor.onDidDestroy(() => {
        addNote("test", content);
      });
    } catch (e) {
      console.log("error", e);
    }
  }
};
