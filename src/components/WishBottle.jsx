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

    // ⚡ 整体加快游戏节奏
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
  ======================================================= */

  const [stars, setStars] =
    useState([]);


  const [bottleX, setBottleX] =
    useState(
      GAME_WIDTH / 2 -
      BOTTLE_WIDTH / 2
    );


  /*
   * 星愿收集
   *
   * 普通星星 = +1
   * 特别星星 = +2
   *
   * 27 = 最终目标
   */

  const [collectedStars, setCollectedStars] =
    useState(0);


  const [shield, setShield] =
    useState(MAX_SHIELD);


  const [gameOver, setGameOver] =
    useState(false);


  const [completed, setCompleted] =
    useState(false);


  const [message, setMessage] =
    useState("");


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


  /*
   * 已经生成多少颗实体星星
   */

  const spawnedStarsRef =
    useRef(0);


  /*
   * 当前星愿收集总量
   *
   * 普通 +1
   * 特别 +2
   */

  const collectedStarsRef =
    useRef(0);


  /*
   * 当前护盾
   */

  const shieldRef =
    useRef(MAX_SHIELD);


  /*
   * 瓶子位置
   */

  const bottleXRef =
    useRef(bottleX);


  /*
   * 拖动状态
   */

  const draggingRef =
    useRef(false);


  /*
   * Message timer
   */

  const messageTimerRef =
    useRef(null);


  /*
   * Countdown timers
   */

  const countdownTimersRef =
    useRef([]);


  /*
   * 实际游戏中的星星
   *
   * React state 只负责画面
   */

  const starsRef =
    useRef([]);


  /* =======================================================
     UPDATE BOTTLE REF
  ======================================================= */

  useEffect(() => {

    bottleXRef.current =
      bottleX;

  }, [bottleX]);


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


    /*
     * DOUBLE STAR
     */

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


    /*
     * SINGLE STAR
     */

    const star =
      spawnNextStar();


    return star
      ? [star]
      : [];
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


    setStars([]);


    const centerX =
      GAME_WIDTH / 2 -
      BOTTLE_WIDTH / 2;


    setBottleX(
      centerX
    );


    bottleXRef.current =
      centerX;


    setCollectedStars(0);

    setShield(MAX_SHIELD);

    setGameOver(false);

    setCompleted(false);

    setShowReward(false);

    setRewardPhase("appear");

    setMessage("");

    setDragging(false);

    draggingRef.current =
      false;

    setCountdown(null);

    setShowBriefing(true);
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
        messageTimerRef.current
      ) {

        clearTimeout(
          messageTimerRef.current
        );
      }


      countdownTimersRef.current
        .forEach(clearTimeout);

    };

  }, []);


  /* =======================================================
     MESSAGE
  ======================================================= */

  function showMessage(
    text,
    duration = 700
  ) {

    setMessage(text);


    if (
      messageTimerRef.current
    ) {

      clearTimeout(
        messageTimerRef.current
      );
    }


    messageTimerRef.current =
      setTimeout(() => {

        setMessage("");

      }, duration);
  }


  /* =======================================================
     MOVE BOTTLE
  ======================================================= */

  function moveBottle(
    clientX
  ) {

    if (
      !gameRef.current
    ) {

      return;
    }


    const rect =
      gameRef.current
        .getBoundingClientRect();


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


    setBottleX(
      newX
    );
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


    function gameLoop() {

      const currentStars =
        starsRef.current;


      /* ===================================================
         NO ACTIVE STAR
      =================================================== */

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


      /* ===================================================
         PROCESS EACH STAR
      =================================================== */

      for (
        let i = 0;
        i < currentStars.length;
        i++
      ) {

        const star =
          currentStars[i];


        const nextY =
          star.y +
          star.speed;


        const nextX =
          star.x +
          star.drift;


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


        const starLeft =
          nextX -
          star.size / 2;


        const starRight =
          nextX +
          star.size / 2;


        const starTop =
          nextY -
          star.size / 2;


        const starBottom =
          nextY +
          star.size / 2;


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

          /*
           * ================================================
           * 星愿收集
           *
           * 普通星星 = +1
           * 特别星星 = +2
           *
           * 这就是唯一的收集分数
           * ================================================
           */

          const collectedGain =
            star.type === "special"
              ? 2
              : 1;


          const newCollected =
            collectedStarsRef.current +
            collectedGain;


          collectedStarsRef.current =
            newCollected;


          setCollectedStars(
            newCollected
          );


          /*
           * ================================================
           * MESSAGE
           * ================================================
           */

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


          /*
           * ================================================
           * COMPLETE
           * ================================================
           */

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


          /*
           * 当前星星已经收集
           * 不加入 updatedStars
           */

          continue;
        }


        /* =================================================
           STILL FALLING
        ================================================= */

        if (
          nextY <
          GAME_HEIGHT + 60
        ) {

          updatedStars.push({

            ...star,

            x: nextX,

            y: nextY,

            rotation:
              star.rotation +
              star.rotationSpeed

          });


          continue;
        }


        /* =================================================
           MISSED
        ================================================= */

        const newShield =
          Math.max(
            0,
            shieldRef.current - 1
          );


        shieldRef.current =
          newShield;


        setShield(
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


      /* ===================================================
         SAVE STARS
      =================================================== */

      starsRef.current =
        updatedStars;


      setStars(
        updatedStars
      );


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
     通关后先显示提示板，点击按钮才进入黄色星星动画
  ======================================================= */

  function startReward() {

    if (showReward) return;

    setShowReward(true);
    setRewardPhase("appear");

    setTimeout(() => {
      setRewardPhase("glow");
    }, 700);

    setTimeout(() => {
      setRewardPhase("burst");
    }, 1700);

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, REWARD_DURATION);
  }


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


          {/* SHIELD */}

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
                    className={
                      index < shield
                        ? "shield active"
                        : "shield empty"
                    }
                  >
                    ✦
                  </span>

                )
              )}

            </div>

          </div>


          {/* STAR COLLECTION */}

          <div className="energy-display">

            <span>
              ⭐ 星愿收集
            </span>


            <strong>
              {collectedStars} /{" "}
              {TOTAL_STARS}
            </strong>


            <div className="wish-progress">

              <div
                className="wish-progress-fill"
                style={{
                  width:
                    `${
                      (
                        collectedStars /
                        TOTAL_STARS
                      ) * 100
                    }%`
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
                className={
                  `falling-star ${
                    star.type ===
                    "special"
                      ? "special-star"
                      : ""
                  }`
                }
                style={{
                  left: star.x,
                  top: star.y,
                  fontSize: star.size,
                  transform:
                    `translate(-50%, -50%) rotate(${star.rotation}deg)`
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
            className={
              `wish-bottle ${
                dragging
                  ? "bottle-dragging"
                  : ""
              }`
            }
            style={{
              left: bottleX
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
                  length:
                    Math.min(
                      collectedStars,
                      12
                    )
                }).map(
                  (_, index) => (

                    <span
                      key={index}
                    >
                      ✦
                    </span>

                  )
                )}

              </div>

            </div>

          </div>


          {/* MESSAGE */}

          {message && (

            <div className="wish-message">
              {message}
            </div>

          )}


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

          {completed && !showReward && (

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
            className={`wish-reward-overlay wish-reward-${rewardPhase}`}
          >

            <div className="wish-reward-particle-field">
              {Array.from({ length: 28 }).map((_, index) => (
                <span
                  key={index}
                  className="wish-reward-particle"
                  style={{ "--i": index }}
                >
                  ✦
                </span>
              ))}
            </div>

            <div className="wish-reward-rings">
              <div className="wish-reward-ring wish-ring-one"></div>
              <div className="wish-reward-ring wish-ring-two"></div>
              <div className="wish-reward-ring wish-ring-three"></div>
            </div>

            <div className="wish-reward-yellow-star">
              <div className="wish-reward-star-halo"></div>
              <div className="wish-reward-star-rays"></div>
              <div className="wish-reward-star-core">★</div>
              <div className="wish-reward-star-shine">✦</div>
            </div>

            <div className="wish-reward-text">
              <div className="wish-reward-small-text">第二颗星愿</div>
              <h2>黄色星星已获得</h2>
              <p>
                一份星海能量，<br />
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