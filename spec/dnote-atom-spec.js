"use babel";

import AtomDnote from "../lib/dnote-atom";

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe("AtomDnote", () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage("dnote-atom");
  });

  describe("when the dnote:new event is triggered", () => {
    it("opens a temporary file", () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector(".dnote-atom")).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, "dnote:new");

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        const editor = atom.workspace.getActiveTextEditor();
        expect(editor.getTitle()).toEqual("ATOM_TMPCONTENT.md");
      });
    });
  });
});
