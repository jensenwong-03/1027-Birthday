import { useEffect, useRef, useState } from "react";
import "../styles/StarWishFlight.css";
import StarBackground from "../components/StarBackground";

/* =========================================================
   GAME SETTINGS
========================================================= */

const GAME_WIDTH = 900;
const GAME_HEIGHT = 560;

const STAR_SIZE = 42;
const STAR_HITBOX = 34;
const STAR_X = 150;

const PIPE_WIDTH = 110;
const PIPE_HITBOX = 86;
const PIPE_GAP = 240;
const PIPE_SPEED = 4;

const GRAVITY = 0.42;
const JUMP_FORCE = -8.4;

const WIN_SCORE = 10;

/* =========================================================
   REWARD SETTINGS
========================================================= */

const REWARD_DURATION = 3200;

/* =========================================================
   RANDOM GAP
========================================================= */

function randomGap() {
  return 120 + Math.random() * 190;
}

/* =========================================================
   PARTICLE
========================================================= */

function createParticle(x, y) {
  return {
    id: Math.random(),
    x,
    y,
    size: 4 + Math.random() * 5,
    life: 1,
    dx: -1 - Math.random() * 2,
    dy: (Math.random() - 0.5) * 2,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function StarWishFlight({ onComplete }) {

  /* =========================================
     GAME STATE
  ========================================= */

  const [started, setStarted] = useState(false);

  const [countdown, setCountdown] = useState(3);

  const [gameOver, setGameOver] = useState(false);

  const [score, setScore] = useState(0);

  const [gapY, setGapY] = useState(randomGap());

  /* =========================================
     REWARD STATE
  ========================================= */

  const [showReward, setShowReward] = useState(false);

  const [rewardPhase, setRewardPhase] =
    useState("appear");

  /* =========================================
     DOM REFS
     
     这些会直接控制画面位置，
     避免每一帧触发 React render。
  ========================================= */

  const starElementRef =
    useRef(null);

  const pipeTopElementRef =
    useRef(null);

  const pipeBottomElementRef =
    useRef(null);

  const particleContainerRef =
    useRef(null);

  /* =========================================
     GAME REFS
  ========================================= */

  const velocity =
    useRef(0);

  const animationFrame =
    useRef(null);

  const scored =
    useRef(false);

  const completed =
    useRef(false);

  const gameOverRef =
    useRef(false);

  const birdYRef =
    useRef(250);

  const pipeXRef =
    useRef(GAME_WIDTH);

  const gapYRef =
    useRef(gapY);

  const scoreRef =
    useRef(0);

  const particlesRef =
    useRef([]);

  const lastTimeRef =
    useRef(0);

  /* =========================================
     PERFORMANCE REFS
  ========================================= */

  // 粒子不需要 60FPS 更新
  const particleFrameRef =
    useRef(0);

  // 防止 reward timer 重复
  const rewardTimersRef =
    useRef([]);

  /* =========================================
     DIRECT DOM UPDATE
  ========================================= */

  function updateStarPosition(y) {

    const element =
      starElementRef.current;

    if (!element) return;

    element.style.transform =
      `translate3d(0, ${y}px, 0) rotate(${Math.max(
        -30,
        Math.min(velocity.current * 5, 60)
      )}deg)`;
  }

  function updatePipePosition(x) {

    const top =
      pipeTopElementRef.current;

    const bottom =
      pipeBottomElementRef.current;

    if (top) {
      top.style.transform =
        `translate3d(${x}px, 0, 0)`;
    }

    if (bottom) {
      bottom.style.transform =
        `translate3d(${x}px, 0, 0)`;
    }
  }

  /* =========================================
     PARTICLE DOM
     
     不再每一帧 setParticles。
     直接操作 particle container。
  ========================================= */

  function updateParticles() {

    const container =
      particleContainerRef.current;

    if (!container) return;

    particlesRef.current =
      particlesRef.current
        .map(particle => ({
          ...particle,

          x:
            particle.x +
            particle.dx,

          y:
            particle.y +
            particle.dy,

          life:
            particle.life - 0.045,
        }))
        .filter(
          particle =>
            particle.life > 0
        )
        .slice(-35);

    /*
      使用 DocumentFragment，
      一次性更新 DOM，
      比 React 每帧 diff 80 个节点轻很多。
    */

    const fragment =
      document.createDocumentFragment();

    particlesRef.current.forEach(
      particle => {

        const span =
          document.createElement("span");

        span.className =
          "flight-particle";

        span.style.left =
          `${particle.x}px`;

        span.style.top =
          `${particle.y}px`;

        span.style.width =
          `${particle.size}px`;

        span.style.height =
          `${particle.size}px`;

        span.style.opacity =
          `${particle.life}`;

        span.style.transform =
          `scale(${particle.life})`;

        fragment.appendChild(span);
      }
    );

    container.replaceChildren(fragment);
  }

  /* =========================================
     START GAME
  ========================================= */

  function startGame() {

    if (started) return;

    velocity.current = 0;

    birdYRef.current = 250;

    pipeXRef.current =
      GAME_WIDTH;

    gapYRef.current =
      randomGap();

    scoreRef.current = 0;

    gameOverRef.current = false;

    scored.current = false;

    completed.current = false;

    particlesRef.current = [];

    particleFrameRef.current = 0;

    lastTimeRef.current = 0;

    setScore(0);

    setGapY(
      gapYRef.current
    );

    setGameOver(false);

    setShowReward(false);

    setRewardPhase("appear");

    setCountdown(3);

    setStarted(true);

    /*
      下一帧再设置 DOM，
      确保 refs 已经挂载。
    */

    requestAnimationFrame(() => {

      updateStarPosition(250);

      updatePipePosition(
        GAME_WIDTH
      );

      if (
        particleContainerRef.current
      ) {
        particleContainerRef.current
          .replaceChildren();
      }

    });
  }

  /* =========================================
     RESTART GAME
  ========================================= */

  function restartGame() {

    cancelAnimationFrame(
      animationFrame.current
    );

    velocity.current = 0;

    birdYRef.current = 250;

    pipeXRef.current =
      GAME_WIDTH;

    gapYRef.current =
      randomGap();

    scoreRef.current = 0;

    gameOverRef.current = false;

    particlesRef.current = [];

    particleFrameRef.current = 0;

    completed.current = false;

    scored.current = false;

    lastTimeRef.current = 0;

    setScore(0);

    setGapY(
      gapYRef.current
    );

    setCountdown(3);

    setGameOver(false);

    setShowReward(false);

    setRewardPhase("appear");

    setStarted(true);

    requestAnimationFrame(() => {

      updateStarPosition(250);

      updatePipePosition(
        GAME_WIDTH
      );

      if (
        particleContainerRef.current
      ) {
        particleContainerRef.current
          .replaceChildren();
      }

    });
  }

  /* =========================================
     JUMP
  ========================================= */

  function jump() {

    if (!started) return;

    if (gameOverRef.current) return;

    if (completed.current) return;

    if (showReward) return;

    if (countdown > 0) return;

    velocity.current =
      JUMP_FORCE;
  }

  /* =========================================
     GAME OVER
  ========================================= */

  function triggerGameOver() {

    if (gameOverRef.current) return;

    gameOverRef.current = true;

    setGameOver(true);

    cancelAnimationFrame(
      animationFrame.current
    );
  }

  /* =========================================
     KEYBOARD / MOUSE
  ========================================= */

 useEffect(() => {

  /* =========================================
     MOBILE / MOUSE INPUT
     
     Pointer Events 比 mousedown 更适合游戏。
     手机 touch 会直接触发 pointerdown，
     不需要等待浏览器转换成 mouse event。
  ========================================= */

  function handlePointerDown(e) {

    /*
      只处理主要指针。
      防止多指同时点击造成重复跳跃。
    */

    if (
      e.pointerType === "touch" &&
      e.isPrimary === false
    ) {
      return;
    }

    /*
      防止手机浏览器把这个动作
      当成滚动 / 缩放 / 其他手势。
    */

    if (e.cancelable) {
      e.preventDefault();
    }

    /*
      游戏结束：
      点击直接重新开始
    */

    if (gameOverRef.current) {

      restartGame();

      return;
    }

    /*
      已经完成 / 正在奖励动画
    */

    if (completed.current) {
      return;
    }

    if (showReward) {
      return;
    }

    /*
      正常跳跃
    */

    jump();
  }


  /* =========================================
     KEYBOARD
  ========================================= */

  function handleKeyDown(e) {

    if (e.code !== "Space") {
      return;
    }

    e.preventDefault();

    if (completed.current) {
      return;
    }

    if (showReward) {
      return;
    }

    if (gameOverRef.current) {

      restartGame();

      return;
    }

    jump();
  }


  /*
    pointerdown：
    手机触摸 / 鼠标点击都会立即进入这里
  */

  window.addEventListener(
    "pointerdown",
    handlePointerDown,
    {
      passive: false,
    }
  );


  window.addEventListener(
    "keydown",
    handleKeyDown
  );


  return () => {

    window.removeEventListener(
      "pointerdown",
      handlePointerDown
    );

    window.removeEventListener(
      "keydown",
      handleKeyDown
    );

  };

}, [
  started,
  countdown,
  showReward
]);
  /* =========================================
     COUNTDOWN
  ========================================= */

  useEffect(() => {

    if (!started) return;

    if (gameOver) return;

    if (showReward) return;

    if (countdown <= 0) return;

    const timer =
      setTimeout(() => {

        setCountdown(
          prev => prev - 1
        );

      }, 1000);

    return () => {
      clearTimeout(timer);
    };

  }, [
    started,
    countdown,
    gameOver,
    showReward
  ]);

  /* =========================================
     GAME LOOP
     
     IMPORTANT:
     这里完全不再 setBirdY / setPipeX。
  ========================================= */

  useEffect(() => {

    if (!started) return;

    if (gameOver) return;

    if (countdown > 0) return;

    if (showReward) return;

    lastTimeRef.current =
      performance.now();

    function gameLoop(timestamp) {

      if (gameOverRef.current) {
        return;
      }

      if (completed.current) {
        return;
      }

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

      /* =================================
         STAR PHYSICS
      ================================= */

      velocity.current +=
        GRAVITY *
        timeScale;

      let nextBirdY =
        birdYRef.current +
        velocity.current *
        timeScale;

      /* =================================
         BOUNDARY
      ================================= */

      if (nextBirdY < 0) {

        nextBirdY = 0;

        birdYRef.current =
          nextBirdY;

        updateStarPosition(
          nextBirdY
        );

        triggerGameOver();

        return;
      }

      if (
        nextBirdY >
        GAME_HEIGHT -
        STAR_SIZE
      ) {

        nextBirdY =
          GAME_HEIGHT -
          STAR_SIZE;

        birdYRef.current =
          nextBirdY;

        updateStarPosition(
          nextBirdY
        );

        triggerGameOver();

        return;
      }

      birdYRef.current =
        nextBirdY;

      /* =================================
         DIRECT DOM UPDATE
         
         不触发 React render
      ================================= */

      updateStarPosition(
        nextBirdY
      );

      /* =================================
         PIPE
      ================================= */

      let nextPipeX =
        pipeXRef.current -
        PIPE_SPEED *
        timeScale;

      if (
        nextPipeX <
        -PIPE_WIDTH
      ) {

        nextPipeX =
          GAME_WIDTH;

        gapYRef.current =
          randomGap();

        setGapY(
          gapYRef.current
        );

        scored.current =
          false;
      }

      pipeXRef.current =
        nextPipeX;

      updatePipePosition(
        nextPipeX
      );

      /* =================================
         PARTICLES
         
         每 2 帧更新一次，
         手机负担明显降低。
      ================================= */

      particleFrameRef.current++;

      if (
        particleFrameRef.current >= 2
      ) {

        particleFrameRef.current = 0;

        particlesRef.current.push(
          createParticle(
            STAR_X + 6,
            nextBirdY +
              STAR_SIZE / 2
          )
        );

        updateParticles();
      }

      /* =================================
         COLLISION
         
         直接使用 refs，
         不依赖 React state。
      ================================= */

      const birdLeft =
        STAR_X + 4;

      const birdRight =
        birdLeft +
        STAR_HITBOX;

      const birdTop =
        nextBirdY + 6;

      const birdBottom =
        birdTop +
        STAR_HITBOX;

      const pipeLeft =
        nextPipeX + 12;

      const pipeRight =
        pipeLeft +
        PIPE_HITBOX;

      const hitPipe =
        birdRight >
          pipeLeft &&
        birdLeft <
          pipeRight;

      if (hitPipe) {

        if (
          birdTop <
            gapYRef.current ||
          birdBottom >
            gapYRef.current +
              PIPE_GAP
        ) {

          triggerGameOver();

          return;
        }
      }

      /* =================================
         SCORE
      ================================= */

      if (
        !scored.current &&
        pipeRight < STAR_X
      ) {

        scored.current = true;

        const nextScore =
          scoreRef.current + 1;

        scoreRef.current =
          nextScore;

        setScore(
          nextScore
        );
      }

      animationFrame.current =
        requestAnimationFrame(
          gameLoop
        );
    }

    animationFrame.current =
      requestAnimationFrame(
        gameLoop
      );

    return () => {

      cancelAnimationFrame(
        animationFrame.current
      );

    };

  }, [
    started,
    countdown,
    gameOver,
    showReward
  ]);

  /* =========================================
     VICTORY
  ========================================= */

  useEffect(() => {

    if (
      score <
      WIN_SCORE
    ) {
      return;
    }

    if (
      completed.current
    ) {
      return;
    }

    completed.current =
      true;

    cancelAnimationFrame(
      animationFrame.current
    );

  }, [score]);

  /* =========================================
     REWARD
  ========================================= */

  function startReward() {

    if (showReward) return;

    /*
      清理旧 timer
    */

    rewardTimersRef.current.forEach(
      timer =>
        clearTimeout(timer)
    );

    rewardTimersRef.current = [];

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
      completeTimer,
    ];
  }

  /* =========================================
     CLEANUP
  ========================================= */

  useEffect(() => {

    return () => {

      cancelAnimationFrame(
        animationFrame.current
      );

      rewardTimersRef.current.forEach(
        timer =>
          clearTimeout(timer)
      );

    };

  }, []);

  /* =========================================
     PROGRESS
  ========================================= */

  const progress =
    (score / WIN_SCORE) *
    100;

  /* =========================================
     RENDER
  ========================================= */

  return (

    <div className="star-wish-flight">

      <StarBackground />

      <div
        className="flight-game"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        }}
      >

        {/* =================================
           PARTICLES
           
           空 container。
           粒子由 DOM 直接控制。
        ================================= */}

        <div
          className="flight-stars"
          ref={particleContainerRef}
        />


        {/* =================================
           HUD
        ================================= */}

        <div className="flight-hud">

          <div className="flight-score">

            <span className="score-label">
              星愿
            </span>

            <span className="score-number">

              {score}

              <span className="score-total">
                /{WIN_SCORE}
              </span>

            </span>

          </div>


          <div className="flight-progress">

            <div className="progress-track">

              <div
                className="progress-fill"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>

          </div>

        </div>


        {/* =================================
           START
        ================================= */}

        {!started && (

          <div
            className="
              flight-overlay
              start-overlay
            "
          >

            <div className="flight-card">

              <div className="flight-card-star">
                ✦
              </div>

              <h2>
                星愿启航
              </h2>

              <p>
                带着星星飞向属于我们的未来
              </p>

              <p className="flight-hint">

                点击屏幕或按空格键
                <br />
                让星星飞起来

              </p>

              <button
                className="flight-button"
                onClick={startGame}
              >
                开始飞行
              </button>

            </div>

          </div>

        )}


        {/* =================================
           COUNTDOWN
        ================================= */}

        {started &&
          !gameOver &&
          !showReward &&
          countdown > 0 && (

            <div
              className="
                countdown-overlay
              "
            >

              <div
                key={countdown}
                className="
                  countdown-number
                "
              >

                {countdown}

              </div>

              <div
                className="
                  countdown-text
                "
              >

                准备好了吗？

              </div>

            </div>

          )}


        {/* =================================
           STAR
           
           初始位置由 CSS / DOM 控制。
        ================================= */}

        <div
          ref={starElementRef}
          className="wish-star"
          style={{
            left: STAR_X,
            top: 0,
            width: STAR_SIZE,
            height: STAR_SIZE,
          }}
        >

          <div className="wish-star-trail trail-1" />
          <div className="wish-star-trail trail-2" />
          <div className="wish-star-trail trail-3" />
          <div className="wish-star-trail trail-4" />

          <div className="wish-star-glow" />

          <div className="wish-star-core">
            ★
          </div>

          <div className="wish-star-shine">
            ✦
          </div>

        </div>


        {/* =================================
           TOP GIFT
        ================================= */}

        <div
          ref={pipeTopElementRef}
          className="
            gift-pipe
            gift-pipe-top
          "
          style={{
            left: 0,
            height: gapY,
          }}
        >

          <div className="gift-ribbon-horizontal" />

          <div className="gift-ribbon-vertical" />

          <div className="gift-bow">

            <span className="bow-left">
              ◀
            </span>

            <span className="bow-center">
              ◆
            </span>

            <span className="bow-right">
              ▶
            </span>

          </div>

          <div className="gift-top-decoration">
            ✦
          </div>

        </div>


        {/* =================================
           BOTTOM GIFT
        ================================= */}

        <div
          ref={pipeBottomElementRef}
          className="
            gift-pipe
            gift-pipe-bottom
          "
          style={{
            left: 0,
            top:
              gapY +
              PIPE_GAP,
            height:
              GAME_HEIGHT -
              gapY -
              PIPE_GAP,
          }}
        >

          <div className="gift-ribbon-horizontal" />

          <div className="gift-ribbon-vertical" />

          <div className="gift-bottom-decoration">
            ✦
          </div>

        </div>


        {/* =================================
           CONTROL HINT
        ================================= */}

        {started &&
          !gameOver &&
          !showReward &&
          countdown <= 0 &&
          score === 0 && (

            <div
              className="
                flight-control-hint
              "
            >
              点击 / 空格键
            </div>

          )}


        {/* =================================
           GAME OVER
        ================================= */}

        {gameOver &&
          score <
            WIN_SCORE && (

            <div
              className="
                flight-overlay
                gameover-overlay
              "
            >

              <div
                className="
                  flight-card
                  gameover-card
                "
              >

                <div
                  className="gameover-star"
                >
                  ✦
                </div>

                <h2>
                  再试一次
                </h2>

                <p>
                  星星还没有抵达终点
                </p>

                <div
                  className="final-score"
                >

                  <span>
                    已收集星愿
                  </span>

                  <strong>

                    {score}

                    <small>
                      / {WIN_SCORE}
                    </small>

                  </strong>

                </div>

                <button
                  className="flight-button"
                  onClick={restartGame}
                >
                  重新飞行
                </button>

                <div
                  className="restart-hint"
                >
                  或按空格键再次尝试
                </div>

              </div>

            </div>

        )}


        {/* =================================
           NORMAL VICTORY
        ================================= */}

        {score >= WIN_SCORE &&
          !showReward && (

          <div
            className="
              flight-overlay
              victory-overlay
            "
          >

            <div className="victory-stars">

              <span>✦</span>
              <span>✧</span>
              <span>★</span>
              <span>✦</span>
              <span>✧</span>
              <span>★</span>
              <span>✦</span>

            </div>

            <div
              className="
                flight-card
                victory-card
              "
            >

              <div
                className="victory-icon"
              >
                ★
              </div>

              <div
                className="
                  victory-small-title
                "
              >
                星愿完成
              </div>

              <h2>
                星愿已收集
              </h2>

              <p>
                你成功带着星星
                <br />
                飞到了我们的下一段旅程
              </p>

              <div
                className="victory-score"
              >

                <span>
                  ✦
                </span>

                {WIN_SCORE}

                <span>
                  ✦
                </span>

              </div>

              <div
                className="
                  victory-message
                "
              >

                第一颗星愿，
                <br />
                已经被你点亮。

              </div>

              <button
                className="
                  flight-button
                  victory-button
                "
                onClick={startReward}
              >
                获得第一颗星星
              </button>

            </div>

          </div>

        )}


        {/* =========================================
           RED STAR REWARD
        ========================================= */}

        {showReward && (

          <div
            className={`
              star-reward-overlay
              star-reward-${rewardPhase}
            `}
          >

            {/* 背景星尘 */}

            <div className="reward-particle-field">

              {Array.from(
                { length: 28 }
              ).map((_, index) => (

                <span
                  key={index}
                  className="reward-particle"
                  style={{
                    "--i": index,
                  }}
                >
                  ✦
                </span>

              ))}

            </div>


            {/* 光圈 */}

            <div className="reward-rings">

              <div className="reward-ring ring-one"></div>

              <div className="reward-ring ring-two"></div>

              <div className="reward-ring ring-three"></div>

            </div>


            {/* 红色星星 */}

            <div className="reward-red-star">

              <div className="reward-star-halo"></div>

              <div className="reward-star-rays"></div>

              <div className="reward-star-core">
                ★
              </div>

              <div className="reward-star-shine">
                ✦
              </div>

            </div>


            {/* 文字 */}

            <div className="reward-text">

              <div className="reward-small-text">
                第一颗星愿
              </div>

              <h2>
                红色星星已获得
              </h2>

              <p>
                一份生日星光，
                <br />
                正在你的旅途中亮起。
              </p>

            </div>


            {/* 爆发白光 */}

            <div className="reward-flash"></div>

          </div>

        )}

      </div>

    </div>

  );
}