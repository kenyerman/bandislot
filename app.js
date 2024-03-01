"use strict";

(() => {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#start-button").addEventListener("click", () => {
      const start = document.querySelector("#start");
      start.classList.add("destroy");

      const [a] = document
        .getAnimations()
        .filter((a) => a.animationName === "startCardExit");

      a.onfinish = () => {
        start.remove();
      };
    });
  });
})();
