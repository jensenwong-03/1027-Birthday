import { useEffect, useRef, useState } from "react";
import "../styles/WishBottle.css";
import StarBackground from "./StarBackground";

/* =========================================================
   GAME SETTINGS
========================================================= */

const GAME_WIDTH = 900;
const GAME_HEIGHT = 560;

const TOTAL_STARS = 27;
const MAX_SHIELD = 3;

const BOTTLE_WIDTH = 120;
const BOTTLE_HEIGHT = 90;

const SPECIAL_CHANCE = 0.15;
const DOUBLE_STAR_CHANCE = 0.15;

const REWARD_DURATION = 3200;


/* =========================================================
   CREATE STAR
========================================================= */

function createStar(id, forcedX = null) {

  const type =
    Math.random() < SPECIAL_CHANCE
      ? "special"
      : "normal";

  const isFast =
    Math.random() < 0.5;

  return {
    id,

    type,

    x:
      forcedX !== null
        ? forcedX
        : 45 +
          Math.random() *
            (GAME_WIDTH - 90),

    y:
      -50 -
      Math.random() * 100,

    size:
      type === "special"
        ? 34 +
          Math.random() * 8
        : 24 +
          Math.random() * 14,

    speed:
      isFast
        ? 8.0 +
          Math.random() * 3.0
        : 5.8 +
          Math.random() * 2.5,

    drift:
      (Math.random() - 0.5) *
      0.4,

    rotation:
      Math.random() * 360,

    rotationSpeed:
      (Math.random() - 0.5) *
      2.2
  };
}


/* =========================================================
   WISH BOTTLE
========================================================= */

function WishBottle({ onComplete }) {

  /* =======================================================
     DISPLAY STATE

     IMPORTANT:
     游戏进行过程中尽量不使用 React state 更新 HUD。
     避免接星星时整棵 React tree rerender。
  ======================================================= */

  const [stars, setStars] =
    useState([]);

  const [gameOver, setGameOver] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [dragging, setDragging] =
    useState(false);

  const [showBriefing, setShowBriefing] =
    useState(true);

  const [countdown, setCountdown] =
    useState(null);


  /* =======================================================
     REWARD STATE
  ======================================================= */

  const [showReward, setShowReward] =
    useState(false);

  const [rewardPhase, setRewardPhase] =
    useState("appear");


  /* =======================================================
     REFS
  ======================================================= */

  const countdownRunningRef =
    useRef(false);

  const gameRef =
    useRef(null);

  const animationRef =
    useRef(null);

  const nextStarId =
    useRef(0);

  const spawnedStarsRef =
    useRef(0);

  const collectedStarsRef =
    useRef(0);

  const shieldRef =
    useRef(MAX_SHIELD);

  const bottleXRef =
    useRef(
      GAME_WIDTH / 2 -
      BOTTLE_WIDTH / 2
    );

  const draggingRef =
    useRef(false);

  const messageTimerRef =
    useRef(null);

  const countdownTimersRef =
    useRef([]);

  const rewardTimersRef =
    useRef([]);


  /* =======================================================
     REAL GAME DATA
  ======================================================= */

  const starsRef =
    useRef([]);


  /* =======================================================
     STAR DOM
  ======================================================= */

  const starElementsRef =
    useRef(new Map());

  const starRefCallbacksRef =
    useRef(new Map());


  /* =======================================================
     BOTTLE DOM
  ======================================================= */

  const bottleElementRef =
    useRef(null);

  const bottleStarsRef =
    useRef([]);


  /* =======================================================
     HUD DOM
  ======================================================= */

  const collectedCountRef =
    useRef(null);

  const progressFillRef =
    useRef(null);

  const shieldElementsRef =
    useRef([]);


  /* =======================================================
     MESSAGE DOM
  ======================================================= */

  const messageElementRef =
    useRef(null);


  /* =======================================================
     GAME RECT
  ======================================================= */

  const gameRectRef =
    useRef(null);


  /* =======================================================
     TIME
  ======================================================= */

  const lastTimeRef =
    useRef(0);


  /* =======================================================
     BOTTLE RENDER RAF
  ======================================================= */

  const bottleRenderRef =
    useRef(null);


  /* =======================================================
     CACHE GAME RECT
  ======================================================= */

  useEffect(() => {

    function updateGameRect() {

      if (!gameRef.current) {
        return;
      }

      gameRectRef.current =
        gameRef.current.getBoundingClientRect();
    }


    updateGameRect();


    window.addEventListener(
      "resize",
      updateGameRect,
      { passive: true }
    );


    return () => {

      window.removeEventListener(
        "resize",
        updateGameRect
      );

    };

  }, []);


  /* =======================================================
     INITIAL BOTTLE POSITION
  ======================================================= */

  useEffect(() => {

    if (!bottleElementRef.current) {
      return;
    }

    bottleElementRef.current.style.transform =
      `translate3d(${bottleXRef.current}px, 0, 0)`;

  }, []);


  /* =======================================================
     STABLE STAR DOM REF
  ======================================================= */

  function getStarRef(id) {

    const cached =
      starRefCallbacksRef.current.get(id);

    if (cached) {
      return cached;
    }


    const callback =
      (element) => {

        if (element) {

          element.style.opacity =
            "1";

          starElementsRef.current.set(
            id,
            element
          );

        } else {

          starElementsRef.current.delete(
            id
          );

        }

      };


    starRefCallbacksRef.current.set(
      id,
      callback
    );


    return callback;
  }


  /* =======================================================
     CLEAN STAR REF
  ======================================================= */

  function cleanupStarRef(id) {

    starElementsRef.current.delete(
      id
    );

    starRefCallbacksRef.current.delete(
      id
    );

  }


  /* =======================================================
     UPDATE COLLECTION HUD DIRECTLY
  ======================================================= */

  function updateCollectedHUD(value) {

    if (collectedCountRef.current) {

      collectedCountRef.current.textContent =
        `${value} / ${TOTAL_STARS}`;

    }


    if (progressFillRef.current) {

      progressFillRef.current.style.width =
        `${(value / TOTAL_STARS) * 100}%`;

    }


    /*
      瓶子里面的星星也直接显示，
      不触发 React render。
    */

    for (
      let i = 0;
      i < bottleStarsRef.current.length;
      i++
    ) {

      const star =
        bottleStarsRef.current[i];

      if (!star) {
        continue;
      }

      star.style.opacity =
        i < Math.min(value, 12)
          ? "1"
          : "0";

      star.style.transform =
        i < Math.min(value, 12)
          ? "scale(1)"
          : "scale(0.7)";
    }

  }


  /* =======================================================
     UPDATE SHIELD DIRECTLY
  ======================================================= */

  function updateShieldHUD(value) {

    for (
      let i = 0;
      i < shieldElementsRef.current.length;
      i++
    ) {

      const element =
        shieldElementsRef.current[i];

      if (!element) {
        continue;
      }

      element.className =
        i < value
          ? "shield active"
          : "shield empty";

    }

  }


  /* =======================================================
     MESSAGE DIRECT DOM
  ======================================================= */

  function showMessage(
    text,
    duration = 700
  ) {

    const element =
      messageElementRef.current;


    if (!element) {
      return;
    }


    if (
      messageTimerRef.current
    ) {

      clearTimeout(
        messageTimerRef.current
      );

    }


    element.textContent =
      text;

    element.classList.add(
      "wish-message-visible"
    );


    messageTimerRef.current =
      setTimeout(() => {

        element.classList.remove(
          "wish-message-visible"
        );

      }, duration);

  }


  /* =======================================================
     SPAWN ONE STAR
  ======================================================= */

  function spawnNextStar(
    forcedX = null
  ) {

    if (
      spawnedStarsRef.current >=
      TOTAL_STARS
    ) {

      return null;

    }


    const star =
      createStar(
        nextStarId.current++,
        forcedX
      );


    spawnedStarsRef.current += 1;


    return star;
  }


  /* =======================================================
     SPAWN WAVE
  ======================================================= */

  function spawnWave() {

    if (
      spawnedStarsRef.current >=
      TOTAL_STARS
    ) {

      return [];

    }


    const shouldDouble =
      Math.random() <
      DOUBLE_STAR_CHANCE;


    const remaining =
      TOTAL_STARS -
      spawnedStarsRef.current;


    /* =========================================
       DOUBLE STAR
    ========================================= */

    if (
      shouldDouble &&
      remaining >= 2
    ) {

      let x1 =
        100 +
        Math.random() *
          (GAME_WIDTH - 300);


      let x2 =
        x1 +
        180 +
        Math.random() *
          120;


      if (
        x2 >
        GAME_WIDTH - 80
      ) {

        x2 =
          GAME_WIDTH - 80;

        x1 =
          x2 - 220;

      }


      const star1 =
        spawnNextStar(x1);


      const star2 =
        spawnNextStar(x2);


      return [
        star1,
        star2
      ].filter(Boolean);

    }


    /* =========================================
       SINGLE STAR
    ========================================= */

    const star =
      spawnNextStar();


    return star
      ? [star]
      : [];

  }


  /* =======================================================
     RENDER BOTTLE
  ======================================================= */

  function renderBottlePosition() {

    bottleRenderRef.current =
      null;


    if (
      !bottleElementRef.current
    ) {

      return;

    }


    bottleElementRef.current.style.transform =
      `translate3d(${bottleXRef.current}px, 0, 0)`;

  }


  /* =======================================================
     MOVE BOTTLE
  ======================================================= */

  function moveBottle(
    clientX
  ) {

    if (!gameRef.current) {
      return;
    }


    if (
      !gameRectRef.current
    ) {

      gameRectRef.current =
        gameRef.current.getBoundingClientRect();

    }


    const rect =
      gameRectRef.current;


    const scale =
      GAME_WIDTH /
      rect.width;


    let newX =
      (clientX -
        rect.left) *
        scale -
      BOTTLE_WIDTH / 2;


    newX =
      Math.max(
        0,
        Math.min(
          GAME_WIDTH -
            BOTTLE_WIDTH,
          newX
        )
      );


    bottleXRef.current =
      newX;


    if (
      !bottleRenderRef.current
    ) {

      bottleRenderRef.current =
        requestAnimationFrame(
          renderBottlePosition
        );

    }

  }


  /* =======================================================
     POINTER DOWN
  ======================================================= */

  function handlePointerDown(e) {

    if (
      !showBriefing &&
      countdown === null &&
      !gameOver &&
      !completed
    ) {

      e.preventDefault();


      draggingRef.current =
        true;


      setDragging(true);


      if (gameRef.current) {

        gameRectRef.current =
          gameRef.current.getBoundingClientRect();

      }


      try {

        e.currentTarget
          .setPointerCapture(
            e.pointerId
          );

      } catch {}


      moveBottle(
        e.clientX
      );

    }

  }


  /* =======================================================
     POINTER MOVE
  ======================================================= */

  function handlePointerMove(e) {

    if (
      !draggingRef.current
    ) {

      return;

    }


    e.preventDefault();


    moveBottle(
      e.clientX
    );

  }


  /* =======================================================
     POINTER UP
  ======================================================= */

  function handlePointerUp(e) {

    draggingRef.current =
      false;


    setDragging(false);


    try {

      e.currentTarget
        .releasePointerCapture(
          e.pointerId
        );

    } catch {}

  }


  /* =======================================================
     BEGIN GAME
  ======================================================= */

  function beginGame() {

    if (
      countdownRunningRef.current
    ) {

      return;

    }


    countdownRunningRef.current =
      true;


    setShowBriefing(false);

    setCountdown(3);


    countdownTimersRef.current
      .forEach(clearTimeout);


    countdownTimersRef.current =
      [];


    const timer1 =
      setTimeout(() => {

        setCountdown(2);

      }, 900);


    const timer2 =
      setTimeout(() => {

        setCountdown(1);

      }, 1800);


    const timer3 =
      setTimeout(() => {

        setCountdown("start");

      }, 2700);


    const timer4 =
      setTimeout(() => {

        setCountdown(null);

        countdownRunningRef.current =
          false;


        const firstWave =
          spawnWave();


        starsRef.current =
          firstWave;


        setStars(
          firstWave
        );


        lastTimeRef.current =
          performance.now();

      }, 3500);


    countdownTimersRef.current = [
      timer1,
      timer2,
      timer3,
      timer4
    ];

  }


  /* =======================================================
     RESTART
  ======================================================= */

  function restartGame() {

    if (
      animationRef.current
    ) {

      cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current =
        null;

    }


    if (
      bottleRenderRef.current
    ) {

      cancelAnimationFrame(
        bottleRenderRef.current
      );

      bottleRenderRef.current =
        null;

    }


    countdownTimersRef.current
      .forEach(clearTimeout);


    countdownTimersRef.current =
      [];


    countdownRunningRef.current =
      false;


    nextStarId.current =
      0;


    spawnedStarsRef.current =
      0;


    collectedStarsRef.current =
      0;


    shieldRef.current =
      MAX_SHIELD;


    starsRef.current =
      [];


    starElementsRef.current.clear();

    starRefCallbacksRef.current.clear();


    lastTimeRef.current =
      0;


    setStars([]);


    const centerX =
      GAME_WIDTH / 2 -
      BOTTLE_WIDTH / 2;


    bottleXRef.current =
      centerX;


    if (
      bottleElementRef.current
    ) {

      bottleElementRef.current.style.transform =
        `translate3d(${centerX}px, 0, 0)`;

    }


    /* RESET HUD DIRECTLY */

    updateCollectedHUD(0);

    updateShieldHUD(
      MAX_SHIELD
    );


    /* RESET MESSAGE */

    if (
      messageElementRef.current
    ) {

      messageElementRef.current
        .classList
        .remove(
          "wish-message-visible"
        );

    }


    setGameOver(false);

    setCompleted(false);

    setShowReward(false);

    setRewardPhase("appear");

    setDragging(false);

    draggingRef.current =
      false;

    setCountdown(null);

    setShowBriefing(true);

  }


  /* =======================================================
     GAME LOOP
  ======================================================= */

  useEffect(() => {

    if (
      showBriefing ||
      countdown !== null ||
      gameOver ||
      completed
    ) {

      return;

    }


    lastTimeRef.current =
      performance.now();


    function gameLoop(timestamp) {

      const delta =
        Math.min(
          timestamp -
            lastTimeRef.current,
          32
        );


      lastTimeRef.current =
        timestamp;


      const timeScale =
        delta / 16.67;


      const currentStars =
        starsRef.current;


      /* =================================================
         NO ACTIVE STAR
      ================================================= */

      if (
        currentStars.length === 0
      ) {

        if (
          spawnedStarsRef.current <
          TOTAL_STARS
        ) {

          const nextWave =
            spawnWave();


          starsRef.current =
            nextWave;


          /*
            只有生成新星星时
            才触发 React render。
          */

          setStars(
            nextWave
          );

        }


        animationRef.current =
          requestAnimationFrame(
            gameLoop
          );


        return;

      }


      const updatedStars = [];


      /* =================================================
         BOTTLE COLLISION AREA
      ================================================= */

      const bottleLeft =
        bottleXRef.current;


      const bottleRight =
        bottleXRef.current +
        BOTTLE_WIDTH;


      const bottleTop =
        GAME_HEIGHT -
        BOTTLE_HEIGHT -
        10;


      const bottleBottom =
        GAME_HEIGHT -
        10;


      /* =================================================
         PROCESS EACH STAR
      ================================================= */

      for (
        let i = 0;
        i < currentStars.length;
        i++
      ) {

        const star =
          currentStars[i];


        /* =========================================
           MOVEMENT
        ========================================= */

        const nextY =
          star.y +
          star.speed *
          timeScale;


        const nextX =
          star.x +
          star.drift *
          timeScale;


        const nextRotation =
          star.rotation +
          star.rotationSpeed *
          timeScale;


        /* =========================================
           HITBOX
        ========================================= */

        const halfSize =
          star.size / 2;


        const starLeft =
          nextX -
          halfSize;


        const starRight =
          nextX +
          halfSize;


        const starTop =
          nextY -
          halfSize;


        const starBottom =
          nextY +
          halfSize;


        const hitBottle =
          starRight >
            bottleLeft &&
          starLeft <
            bottleRight &&
          starBottom >
            bottleTop &&
          starTop <
            bottleBottom;


        /* =================================================
           COLLECTED
        ================================================= */

        if (hitBottle) {

          const element =
            starElementsRef.current.get(
              star.id
            );


          if (element) {

            element.style.opacity =
              "0";

          }


          const collectedGain =
            star.type === "special"
              ? 2
              : 1;


          const newCollected =
            collectedStarsRef.current +
            collectedGain;


          collectedStarsRef.current =
            newCollected;


          /*
            =========================================
            IMPORTANT

            不再：

              setCollectedStars()

            所以这里不会触发 React render。
            =========================================
          */

          updateCollectedHUD(
            newCollected
          );


          if (
            star.type === "special"
          ) {

            showMessage(
              "🌟 特别星愿 +2",
              900
            );

          } else {

            showMessage(
              "✦ 星愿 +1",
              750
            );

          }


          cleanupStarRef(
            star.id
          );


          /* =========================================
             COMPLETE
          ========================================= */

          if (
            newCollected >=
            TOTAL_STARS
          ) {

            starsRef.current =
              [];


            setStars([]);


            setCompleted(true);


            return;

          }


          continue;

        }


        /* =================================================
           STILL FALLING
        ================================================= */

        if (
          nextY <
          GAME_HEIGHT + 60
        ) {

          const updatedStar = {

            ...star,

            x:
              nextX,

            y:
              nextY,

            rotation:
              nextRotation

          };


          updatedStars.push(
            updatedStar
          );


          const element =
            starElementsRef.current.get(
              star.id
            );


          if (element) {

            element.style.transform =
              `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%) rotate(${nextRotation}deg)`;

          }


          continue;

        }


        /* =================================================
           MISSED
        ================================================= */

        const element =
          starElementsRef.current.get(
            star.id
          );


        if (element) {

          element.style.opacity =
            "0";

        }


        cleanupStarRef(
          star.id
        );


        const newShield =
          Math.max(
            0,
            shieldRef.current - 1
          );


        shieldRef.current =
          newShield;


        /*
          不再 setShield()
          直接更新 HUD。
        */

        updateShieldHUD(
          newShield
        );


        showMessage(
          "🌌 星辰护盾 -1",
          850
        );


        if (
          newShield <= 0
        ) {

          starsRef.current =
            [];


          setStars([]);


          setGameOver(true);


          return;

        }

      }


      /* =================================================
         SAVE PHYSICS
      ================================================= */

      starsRef.current =
        updatedStars;


      animationRef.current =
        requestAnimationFrame(
          gameLoop
        );

    }


    animationRef.current =
      requestAnimationFrame(
        gameLoop
      );


    return () => {

      if (
        animationRef.current
      ) {

        cancelAnimationFrame(
          animationRef.current
        );


        animationRef.current =
          null;

      }

    };

  }, [
    showBriefing,
    countdown,
    gameOver,
    completed
  ]);


  /* =======================================================
     SECOND STAR REWARD
  ======================================================= */

  function startReward() {

    if (showReward) {
      return;
    }


    rewardTimersRef.current
      .forEach(clearTimeout);


    rewardTimersRef.current =
      [];


    setShowReward(true);

    setRewardPhase("appear");


    const glowTimer =
      setTimeout(() => {

        setRewardPhase(
          "glow"
        );

      }, 700);


    const burstTimer =
      setTimeout(() => {

        setRewardPhase(
          "burst"
        );

      }, 1700);


    const completeTimer =
      setTimeout(() => {

        if (onComplete) {
          onComplete();
        }

      }, REWARD_DURATION);


    rewardTimersRef.current = [
      glowTimer,
      burstTimer,
      completeTimer
    ];

  }


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {

    return () => {

      if (
        animationRef.current
      ) {

        cancelAnimationFrame(
          animationRef.current
        );

      }


      if (
        bottleRenderRef.current
      ) {

        cancelAnimationFrame(
          bottleRenderRef.current
        );

      }


      if (
        messageTimerRef.current
      ) {

        clearTimeout(
          messageTimerRef.current
        );

      }


      countdownTimersRef.current
        .forEach(clearTimeout);


      rewardTimersRef.current
        .forEach(clearTimeout);

    };

  }, []);


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="wish-bottle-page">

      <StarBackground />


      <div className="wish-bottle-game">


        {/* =================================================
            HUD
        ================================================= */}

        <div className="wish-hud">

          <div className="shield-display">

            <span>
              🌌 星辰护盾
            </span>


            <div className="shield-icons">

              {Array.from({
                length:
                  MAX_SHIELD
              }).map(
                (_, index) => (

                  <span
                    key={index}
                    ref={(element) => {

                      shieldElementsRef.current[index] =
                        element;

                    }}
                    className="shield active"
                  >
                    ✦
                  </span>

                )
              )}

            </div>

          </div>


          <div className="energy-display">

            <span>
              ⭐ 星愿收集
            </span>


            <strong
              ref={collectedCountRef}
            >
              0 / {TOTAL_STARS}
            </strong>


            <div className="wish-progress">

              <div
                ref={progressFillRef}
                className="wish-progress-fill"
                style={{
                  width: "0%"
                }}
              />

            </div>

          </div>

        </div>


        {/* =================================================
            GAME AREA
        ================================================= */}

        <div
          className="wish-game-area"
          ref={gameRef}
        >

          {/* FALLING STARS */}

          {stars.map(
            (star) => (

              <div
                key={star.id}

                ref={
                  getStarRef(
                    star.id
                  )
                }

                className={
                  `falling-star ${
                    star.type ===
                    "special"
                      ? "special-star"
                      : ""
                  }`
                }

                style={{
                  left: 0,
                  top: 0,

                  fontSize:
                    star.size,

                  opacity: 1,

                  transform:
                    `translate3d(${star.x}px, ${star.y}px, 0) translate(-50%, -50%) rotate(${star.rotation}deg)`,

                  willChange:
                    "transform"
                }}
              >
                ✦
              </div>

            )
          )}


          {/* =================================================
              BOTTLE
          ================================================= */}

          <div
            ref={bottleElementRef}
            className={
              `wish-bottle ${
                dragging
                  ? "bottle-dragging"
                  : ""
              }`
            }
            style={{
              left: 0,

              transform:
                `translate3d(${GAME_WIDTH / 2 - BOTTLE_WIDTH / 2}px, 0, 0)`,

              willChange:
                "transform"
            }}

            onPointerDown={
              handlePointerDown
            }

            onPointerMove={
              handlePointerMove
            }

            onPointerUp={
              handlePointerUp
            }

            onPointerCancel={
              handlePointerUp
            }
          >

            <div className="bottle-neck"></div>


            <div className="bottle-body">

              <div className="bottle-glow"></div>


              <div className="bottle-stars">

                {Array.from({
                  length: 12
                }).map(
                  (_, index) => (

                    <span
                      key={index}
                      ref={(element) => {

                        bottleStarsRef.current[index] =
                          element;

                      }}
                      style={{
                        opacity:
                          0,

                        transform:
                          "scale(0.7)"
                      }}
                    >
                      ✦
                    </span>

                  )
                )}

              </div>

            </div>

          </div>


          {/* =================================================
              MESSAGE

              永远存在，不再通过 React
              conditional render 创建 / 删除。
          ================================================= */}

          <div
            ref={messageElementRef}
            className="wish-message"
          ></div>


          {/* =================================================
              BRIEFING
          ================================================= */}

          {showBriefing && (

            <div className="wish-start-overlay">

              <div className="wish-briefing-card">

                <div className="briefing-topline">
                  MISSION BRIEFING
                </div>


                <div className="briefing-symbol">
                  ✦
                </div>


                <h2>
                  星愿收集
                </h2>


                <div className="briefing-line">

                  <span></span>

                  <i>✦</i>

                  <span></span>

                </div>


                <p className="briefing-main">

                  拖动许愿瓶
                  <br />
                  接住从星海坠落的星愿

                </p>


                <div className="intro-rules">

                  <div className="intro-rule">

                    <span className="rule-icon">
                      ◇
                    </span>

                    <span>
                      每一颗星星都很重要
                    </span>

                  </div>


                  <div className="intro-rule">

                    <span className="rule-icon">
                      ◇
                    </span>

                    <span>
                      特别星愿将带来额外能量
                    </span>

                  </div>


                  <div className="intro-rule">

                    <span className="rule-icon">
                      ♢
                    </span>

                    <span>
                      你拥有 3 次星辰护盾
                    </span>

                  </div>

                </div>


                <button
                  className="briefing-start-btn"
                  onClick={
                    beginGame
                  }
                >

                  <span>
                    准备好了
                  </span>

                  <span className="button-arrow">
                    →
                  </span>

                </button>


                <div className="briefing-footer">
                  MISSION WILL BEGIN AFTER CONFIRMATION
                </div>

              </div>

            </div>

          )}


          {/* =================================================
              COUNTDOWN
          ================================================= */}

          {!showBriefing &&
            countdown !== null && (

              <div className="wish-countdown-overlay">

                <div className="countdown-orbit orbit-one"></div>

                <div className="countdown-orbit orbit-two"></div>

                <div className="countdown-glow"></div>


                {countdown === "start" ? (

                  <div
                    key="start"
                    className="countdown-start"
                  >

                    <div className="countdown-start-symbol">
                      ✦
                    </div>

                    <div className="countdown-start-text">
                      开始
                    </div>

                    <div className="countdown-start-sub">
                      WISH COLLECTION
                    </div>

                  </div>

                ) : (

                  <div
                    key={countdown}
                    className="countdown-number"
                  >
                    {countdown}
                  </div>

                )}


                {countdown !== "start" && (

                  <div className="countdown-caption">
                    准备进入星愿收集
                  </div>

                )}

              </div>

            )}


          {/* =================================================
              GAME OVER
          ================================================= */}

          {gameOver && (

            <div className="wish-overlay">

              <div className="wish-result">

                <p className="result-tag">
                  STAR SHIELD BROKEN
                </p>


                <div className="result-symbol">
                  ✦
                </div>


                <h2>
                  星辰护盾破裂
                </h2>


                <p>
                  最后一颗星辰，
                  <br />
                  从你的手中坠落了……
                </p>


                <div className="result-divider">
                  ✦
                </div>


                <button
                  onClick={
                    restartGame
                  }
                >
                  重新收集
                </button>

              </div>

            </div>

          )}


          {/* =================================================
              COMPLETE
          ================================================= */}

          {completed &&
            !showReward && (

              <div className="wish-overlay">

                <div className="wish-result">

                  <p className="result-tag">
                    WISH COMPLETE
                  </p>


                  <div className="result-symbol success">
                    ✦
                  </div>


                  <h2>
                    星愿收集完成
                  </h2>


                  <p>
                    27 颗星愿，
                    <br />
                    都已经被好好收藏。
                  </p>


                  <div className="completion-stars">
                    ✦ ✧ ✦ ✧ ✦
                  </div>


                  <p className="progress-text">
                    星愿完成度
                    <br />

                    <strong>
                      100%
                    </strong>

                  </p>


                  {onComplete && (

                    <button
                      onClick={
                        startReward
                      }
                    >
                      获得第二颗星星
                    </button>

                  )}

                </div>

              </div>

            )}

        </div>


        {/* =================================================
            SECOND STAR REWARD
        ================================================= */}

        {showReward && (

          <div
            className={`
              wish-reward-overlay
              wish-reward-${rewardPhase}
            `}
          >

            <div className="wish-reward-particle-field">

              {Array.from({
                length: 28
              }).map(
                (_, index) => (

                  <span
                    key={index}
                    className="wish-reward-particle"
                    style={{
                      "--i": index
                    }}
                  >
                    ✦
                  </span>

                )
              )}

            </div>


            <div className="wish-reward-rings">

              <div className="wish-reward-ring wish-ring-one"></div>

              <div className="wish-reward-ring wish-ring-two"></div>

              <div className="wish-reward-ring wish-ring-three"></div>

            </div>


            <div className="wish-reward-yellow-star">

              <div className="wish-reward-star-halo"></div>

              <div className="wish-reward-star-rays"></div>

              <div className="wish-reward-star-core">
                ★
              </div>

              <div className="wish-reward-star-shine">
                ✦
              </div>

            </div>


            <div className="wish-reward-text">

              <div className="wish-reward-small-text">
                第二颗星愿
              </div>

              <h2>
                黄色星星已获得
              </h2>

              <p>
                一份星海能量，
                <br />
                正在你的旅途中亮起。
              </p>

            </div>


            <div className="wish-reward-flash"></div>

          </div>

        )}


        {/* BOTTOM HINT */}

        <p className="wish-hint">
          左右拖动许愿瓶，接住从星空降落的星愿
        </p>

      </div>

    </div>

  );
}


export default WishBottle;