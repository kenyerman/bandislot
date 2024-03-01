"use strict";

(() => {
  const START_MONEY = 12_000;
  const REEL_COUNT = 4;
  const IMAGE_COUNT = 12;
  const TIME_PER_IMAGE = 120;
  const BET_EPSILON = 100;
  const BALANCE_KEY = "@bandislot/balance";

  const ambientSound = new Howl({
    src: "./assets/sounds/ambience.ogg",
    loop: true,
    volume: 0.2,
  });

  const lostSound = new Howl({
    src: "./assets/sounds/lost.ogg",
    volume: 1,
  });

  const reelDoneSound = new Howl({
    src: "./assets/sounds/reel_done.ogg",
    volume: 0.8,
  });

  const startSound = new Howl({
    src: "./assets/sounds/start.ogg",
    loop: true,
    volume: 1,
  });

  const win2Sound = new Howl({
    src: "./assets/sounds/win2.ogg",
    volume: 1,
  });

  const win2x2Sound = new Howl({
    src: "./assets/sounds/win2x2.ogg",
    volume: 1,
  });

  const win3Sound = new Howl({
    src: "./assets/sounds/win3.ogg",
    volume: 1,
  });

  const win4Sound = new Howl({
    src: "./assets/sounds/win4.ogg",
    volume: 1,
  });

  const moneySound = new Howl({
    src: "./assets/sounds/money.ogg",
    volume: 1,
  });

  const getAnimation = (name) =>
    new Promise((res) => {
      document
        .getAnimations()
        .find((a) => a.animationName === name)
        .addEventListener("finish", () => res());
    });

  const refreshBalance = () => {
    const balance = getBalance();
    const balanceSpan = document.querySelector("#balance");
    balanceSpan.textContent = `${balance.toLocaleString()}`;
    localStorage.setItem(BALANCE_KEY, balance);
  };

  const getBalance = () => {
    const balance = Number.parseInt(localStorage.getItem(BALANCE_KEY));

    if (isNaN(balance)) {
      setBalance(START_MONEY);
      return START_MONEY;
    }

    return balance;
  };

  const setBalance = (balance) => {
    localStorage.setItem(BALANCE_KEY, balance);
    refreshBalance();
  };

  const getBetAmount = () => {
    const bet = document.querySelector("#bet-value");
    return (
      Number.parseInt(bet.getAttribute("data-value")) ||
      Math.min(BET_EPSILON, getBalance())
    );
  };

  const setBetAmount = (amount) => {
    const bet = document.querySelector("#bet-value");
    bet.textContent = `${amount.toLocaleString()}`;
    bet.setAttribute("data-value", amount);
  };

  const addImagesToReel = (reel) => {
    for (let j = 0; j < IMAGE_COUNT; j++) {
      const el = document.createElement("img");
      el.setAttribute("src", `./assets/symbols/image${j}.png`);
      el.setAttribute("data-value", j);

      document.querySelector(`#reel-${reel + 1}`).appendChild(el);
    }
  };

  const getReelData = (reel) => {
    const el = document.querySelector(`#reel-${reel + 1}`);
    const reelHeight = el.parentNode.clientHeight;
    const imageHeight = el.querySelector("img").clientHeight;
    const reelOffset = (reelHeight - imageHeight) / 2;

    const top =
      el.getBoundingClientRect().top -
      el.parentNode.getBoundingClientRect().top;

    const currentPosition = -Math.round((top - reelOffset) / imageHeight);

    const value = Number.parseInt(
      el.childNodes.item(currentPosition).getAttribute("data-value")
    );

    return { el, currentPosition, reelOffset, imageHeight, reelHeight, value };
  };

  const spinReelDown = (reel, amount, instant) =>
    new Promise((resolve) => {
      const { el, currentPosition, reelOffset, imageHeight } =
        getReelData(reel);
      const nextPosition = currentPosition + amount;

      while (el.childNodes.length - 2 < nextPosition) {
        addImagesToReel(reel);
      }

      el.animate(
        [
          { top: `${-(currentPosition * imageHeight - reelOffset)}px` },
          { top: `${-(nextPosition * imageHeight - reelOffset)}px` },
        ],
        {
          duration: !instant ? amount * TIME_PER_IMAGE : 0,
          easing: "ease-out",
          fill: "forwards",
        }
      ).addEventListener("finish", () => {
        const top =
          el.getBoundingClientRect().top -
          el.parentNode.getBoundingClientRect().top;

        const currentPosition = -Math.round((top - reelOffset) / imageHeight);

        for (let i = 0; i < currentPosition - 1; i++) {
          el.removeChild(el.firstChild);
        }

        el.animate(
          [
            { top: `${-(nextPosition * imageHeight - reelOffset)}px` },
            { top: `${-(1 * imageHeight - reelOffset)}px` },
          ],
          {
            duration: 0,
            easing: "ease-out",
            fill: "forwards",
          }
        ).addEventListener("finish", () => {
          if (!instant) {
            reelDoneSound.play();
          }
          resolve();
        });
      });
    });

  const getControls = () => {
    const subBetBtn = document.querySelector("#sub-button");
    const betDiv = document.querySelector("#bet-value");
    const addBetBtn = document.querySelector("#add-button");
    const x2Btn = document.querySelector("#x2-button");
    const x3Btn = document.querySelector("#x3-button");
    const x5Btn = document.querySelector("#x5-button");
    const spinBtn = document.querySelector("#spin-button");

    return {
      subBetBtn,
      betDiv,
      addBetBtn,
      x2Btn,
      x3Btn,
      x5Btn,
      spinBtn,
    };
  };

  const enableAvailableControls = () => {
    const balance = getBalance();
    setBetAmount(Math.min(getBetAmount(), balance)); // side effect
    const bet = getBetAmount();

    const { subBetBtn, betDiv, addBetBtn, x2Btn, x3Btn, x5Btn, spinBtn } =
      getControls();

    betDiv.removeAttribute("disabled");

    subBetBtn.disabled = bet <= BET_EPSILON;
    addBetBtn.disabled = balance < bet + BET_EPSILON;

    x2Btn.disabled = balance === 0 || balance < bet * 2;
    x3Btn.disabled = balance === 0 || balance < bet * 3;
    x5Btn.disabled = balance === 0 || balance < bet * 5;

    spinBtn.disabled = bet <= 0;

    if (balance <= 0) {
      const dialog = document.querySelector("#game-over-dialog");
      dialog.classList.add("active");

      lostSound.play();
    }
  };

  const disableControls = () => {
    Object.values(getControls()).forEach((el) =>
      el.setAttribute("disabled", undefined)
    );
  };

  document.addEventListener("DOMContentLoaded", () => {
    refreshBalance();

    const { subBetBtn, addBetBtn, x2Btn, x3Btn, x5Btn, spinBtn } =
      getControls();

    const startSection = document.querySelector("#start");

    for (let i = 0; i < REEL_COUNT; i++) {
      addImagesToReel(i);
    }

    enableAvailableControls();

    subBetBtn.addEventListener("click", () => {
      setBetAmount(getBetAmount() - BET_EPSILON);
      enableAvailableControls();
    });

    addBetBtn.addEventListener("click", () => {
      setBetAmount(getBetAmount() + BET_EPSILON);
      enableAvailableControls();
    });

    x2Btn.addEventListener("click", () => {
      setBetAmount(getBetAmount() * 2);
      enableAvailableControls();
    });

    x3Btn.addEventListener("click", () => {
      setBetAmount(getBetAmount() * 3);
      enableAvailableControls();
    });

    x5Btn.addEventListener("click", () => {
      setBetAmount(getBetAmount() * 5);
      enableAvailableControls();
    });

    document.querySelector("#reset-button").addEventListener("click", () => {
      setBalance(START_MONEY);
      enableAvailableControls();

      const dialog = document.querySelector("#game-over-dialog");

      dialog
        .animate(
          [
            { transform: `scale(1)`, opacity: 1 },
            { transform: `scale(0)`, opacity: 0 },
          ],
          {
            duration: 500,
            easing: "ease-out",
          }
        )
        .addEventListener("finish", () => {
          dialog.classList.remove("active");
        });
    });

    document.querySelector("#start-button").addEventListener("click", () => {
      startSection.classList.add("destroy");

      ambientSound.play();

      getAnimation("startCardExit")
        .then(() => {
          startSection.classList.remove("active", "destroy");
          document.querySelector("#game").classList.add("active");

          return Promise.all([
            getAnimation("headerEnter"),
            getAnimation("machineEnter"),
            getAnimation("controlsEnter"),
          ]);
        })
        .then(() =>
          Promise.all(
            Array(REEL_COUNT)
              .fill(0)
              .map((_, i) => {
                const next = Math.round(Math.random() * 11) + 1;
                return spinReelDown(i, next, true);
              })
          )
        )
        .then(() => {
          enableAvailableControls();
        });
    });

    spinBtn.addEventListener("click", () => {
      disableControls();

      setBalance(getBalance() - getBetAmount());

      startSound.play();

      Promise.all(
        Array(REEL_COUNT)
          .fill(0)
          .map((_, i) => {
            const next = Math.round(Math.random() * 50) + 12;
            return spinReelDown(i, next);
          })
      ).then(() => {
        startSound.stop();

        const reelValues = [];
        const valueCount = {};

        for (let i = 0; i < REEL_COUNT; i++) {
          const { value } = getReelData(i);
          reelValues.push(value);
          valueCount[value] = (valueCount[value] ?? 0) + 1;
        }

        const exp = REEL_COUNT - Object.keys(valueCount).length;

        // no win
        if (!exp) {
          enableAvailableControls();
          return;
        }

        switch (exp) {
          case 0:
            return; // no win, already handled
          case 1:
            win2Sound.play();
            break;
          case 2:
            win3Sound.play();
            break; // TODO: decide 3 vs. 2x2
          case 3:
            win4Sound.play();
            break;
          default:
            win2x2Sound.play();
            break;
        }

        const animating = [];

        for (let i = 0; i < REEL_COUNT; i++) {
          const { value, el } = getReelData(i);

          if (1 < valueCount[value]) {
            const animation = new Promise((res) => {
              el.childNodes
                .item(1)
                .animate(
                  [
                    {
                      transform: `scale(1)`,
                      filter: `drop-shadow(0 0 0 rgba(176, 38, 255, 0))`,
                    },
                    {
                      transform: `scale(1.2)`,
                      filter: `drop-shadow(0 0 15px rgba(176, 38, 255, 1))`,
                    },
                    {
                      transform: `scale(1)`,
                      filter: `drop-shadow(0 0 0 rgba(176, 38, 255, 0))`,
                    },
                  ],
                  {
                    duration: 500,
                    easing: "ease-out",
                    iterations: 3,
                  }
                )
                .addEventListener("finish", () => res());
            });

            animating.push(animation);
          }
          valueCount[value] = (valueCount[value] ?? 0) + 1;
        }

        Promise.all(animating)
          .then(() => {
            const win = exp === 1 ? 1.05 : 15 ** (exp - 1);
            setBalance(getBalance() + getBetAmount() * win);

            moneySound.play();

            return Promise.all([
              new Promise((res) => {
                document
                  .querySelector("#balance")
                  .animate(
                    [
                      {
                        transform: `scale(1)`,
                      },
                      {
                        transform: `scale(1.2)`,
                        color: "#ffcc26",
                      },
                      {
                        transform: `scale(1)`,
                      },
                    ],
                    {
                      duration: 100,
                      easing: "ease-out",
                      iterations: 10,
                    }
                  )
                  .addEventListener("finish", () => {
                    res();
                  });
              }),
              new Promise((res) => {
                const winDialog = document.querySelector("#win-dialog");
                winDialog.textContent = `+${(
                  getBetAmount() * win
                ).toLocaleString()}`;

                winDialog.classList.add("active");

                winDialog
                  .animate(
                    [
                      {
                        color: "#ff5126",
                        transform: `scale(1)`,
                      },
                      {
                        transform: `scale(1.2)`,
                        color: "#ffcc26",
                      },
                      {
                        transform: `scale(1)`,
                        color: "#ff5126",
                      },
                    ],
                    {
                      duration: 300,
                      easing: "ease-out",
                      iterations: 3,
                    }
                  )
                  .addEventListener("finish", () => {
                    winDialog.classList.remove("active");
                    res();
                  });
              }),
            ]);
          })
          .then(() => {
            moneySound.stop();
            enableAvailableControls();
          });
      });
    });
  });
})();
