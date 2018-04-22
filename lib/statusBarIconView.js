"use babel";

const svg = `<svg width="18" height="18" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><g fill="none"><circle cx="25" cy="25" r="22" style="stroke-width:6;stroke:#5E5E5E"/><path d="M18.6 32.3C18.6 32.3 22.1 22.9 23 21.5 23.8 20 26.1 20 26.1 20 26.1 20 27.3 17.3 27.4 17 27.5 16.7 27 16.5 27 16.5L27.8 14.4 29.1 14.7 30.2 12.4 32.4 13.4 31.5 15.7 32.6 16.5 31.8 18.6 31 18.3 29.9 21.4C29.9 21.4 31 22.9 31.2 23.8 31.4 24.7 31 25.7 31 25.7L28.2 32.6C28.2 32.6 29.8 31.9 30.7 31.7 31.5 31.6 32.5 31.4 33.3 31.7 34.1 32 34.7 32.4 34.8 32.6 35.2 33.2 35 34.2 34.3 34.3 33.8 34.3 33.7 34.1 33.3 33.9 32.8 33.7 32.5 33.6 32.2 33.6 31.4 33.8 31 33.9 30.2 34.3 29.5 34.7 28.3 35 28.3 35 28.3 35 27.4 35.1 26.6 34.6 25.8 34.2 25 33.1 23.9 33.1 23.2 33.1 22.8 33.6 22.3 33.9 21.8 34.2 20.3 35.1 19.2 35 17.6 34.9 17.4 33.4 16.1 33.1 14.8 32.9 13.9 34.2 13.1 33.9 12.4 33.6 12.7 32.4 12.7 32.4 12.7 32.4 13.6 31.7 14.1 31.5 14.6 31.2 15.7 31.2 15.7 31.2 15.7 31.2 16.9 31.3 17.4 31.5 17.9 31.6 18.6 32.3 18.6 32.3Z" fill="#424243"/></g></svg>`;

export default class statusBarIconView {
  constructor({ onClick }) {
    this.onClick = onClick;

    const wrapper = document.createElement("div");
    wrapper.classList.add("inline-block", "dnote-tile-wrapper");

    const tile = document.createElement("a");
    tile.classList.add("dnote-tile");
    tile.href = "#new";
    tile.innerHTML = svg;
    tile.addEventListener("click", this.onClick);

    wrapper.appendChild(tile);

    this.wrapperEl = wrapper;
    this.tileEl = tile;
    this.tooltip = atom.tooltips.add(this.tileEl, { title: "New note" });
  }

  destroy() {
    this.tileEl.removeEventListener("click", this.onClick);
    this.tooltip.dispose();
  }

  getEl() {
    return this.wrapperEl;
  }

  show() {
    this.wrapperEl.classList.remove("hidden");
  }

  hide() {
    this.wrapperEl.classList.add("hidden");
  }
}
