"use babel";

export default {
  init({ onClick }) {
    this.tile = document.createElement("a");

    this.tile.classList.add("dnote-tile");
    this.tile.href = "#foo";

    const icon = document.createElement("div");
    icon.innerHTML = "dnote";

    this.tile.appendChild(icon);
    this.tile.addEventListener("click", onClick);

    return this.tile;
  },

  destroy() {
    this.tile.removeEventListender("click");
  }
};
