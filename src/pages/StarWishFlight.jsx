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

  const [birdY, setBirdY] = useState(250);

  const [pipeX, setPipeX] =
    useState(GAME_WIDTH);

  const [gapY, setGapY] =
    useState(randomGap());

  const [score, setScore] = useState(0);

  const [particles, setParticles] =
    useState([]);


  /* =========================================
     REWARD STATE
  ========================================= */

  const [showReward, setShowReward] =
    useState(false);


  const [rewardPhase, setRewardPhase] =
    useState("appear");


  /* =========================================
     REFS
  ========================================= */

  const velocity = useRef(0);

  const animationFrame =
    useRef(null);

  const scored =
    useRef(false);

  const completed =
    useRef(false);

  const birdYRef =
    useRef(250);

  const pipeXRef =
    useRef(GAME_WIDTH);

  const gapYRef =
    useRef(gapY);

  const scoreRef =
    useRef(0);

  const gameOverRef =
    useRef(false);

  const particlesRef =
    useRef([]);

  const lastTimeRef =
    useRef(0);


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

    lastTimeRef.current = 0;

    setBirdY(250);

    setPipeX(GAME_WIDTH);

    setGapY(gapYRef.current);

    setScore(0);

    setParticles([]);

    setGameOver(false);

    setShowReward(false);

    setRewardPhase("appear");

    setCountdown(3);

    setStarted(true);
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

    completed.current = false;

    scored.current = false;

    lastTimeRef.current = 0;

    setBirdY(250);

    setPipeX(GAME_WIDTH);

    setGapY(gapYRef.current);

    setParticles([]);

    setScore(0);

    setCountdown(3);

    setGameOver(false);

    setShowReward(false);

    setRewardPhase("appear");

    setStarted(true);
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

    function mouseJump() {
      jump();
    }


    function keyJump(e) {

      if (e.code !== "Space") return;

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


    window.addEventListener(
      "mousedown",
      mouseJump
    );

    window.addEventListener(
      "keydown",
      keyJump
    );


    return () => {

      window.removeEventListener(
        "mousedown",
        mouseJump
      );

      window.removeEventListener(
        "keydown",
        keyJump
      );

    };

  }, [
    started,
    countdown,
    gameOver,
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


    const timer = setTimeout(() => {

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

        setBirdY(nextBirdY);

        triggerGameOver();

        return;
      }


      if (
        nextBirdY >
        GAME_HEIGHT - STAR_SIZE
      ) {

        nextBirdY =
          GAME_HEIGHT -
          STAR_SIZE;

        birdYRef.current =
          nextBirdY;

        setBirdY(nextBirdY);

        triggerGameOver();

        return;
      }


      birdYRef.current =
        nextBirdY;

      setBirdY(nextBirdY);


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

      setPipeX(nextPipeX);


      /* =================================
         SCORE

         计分只在 GAME LOOP 内执行一次。
         这样一根柱子只会产生一次 +1，
         不会因为 React 的 pipeX/birdY 更新
         在同一根柱子通过时重复计分。
      ================================= */

      const scorePipeRight =
        nextPipeX + 12 + PIPE_HITBOX;

      if (
        !scored.current &&
        scorePipeRight < STAR_X
      ) {

        scored.current = true;

        const nextScore =
          scoreRef.current + 1;

        scoreRef.current =
          nextScore;

        setScore(nextScore);
      }


      /* =================================
         PARTICLES
      ================================= */

      const newParticle =
        createParticle(
          STAR_X + 6,
          nextBirdY +
            STAR_SIZE / 2
        );


      particlesRef.current = [
        ...particlesRef.current,
        newParticle,
      ]
        .map(particle => ({

          ...particle,

          x:
            particle.x +
            particle.dx *
            timeScale,

          y:
            particle.y +
            particle.dy *
            timeScale,

          life:
            particle.life -
            0.03 *
            timeScale,

        }))
        .filter(
          particle =>
            particle.life > 0
        )
        .slice(-80);


      setParticles(
        particlesRef.current
      );


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
     COLLISION
  ========================================= */

  useEffect(() => {

    if (!started) return;

    if (gameOver) return;

    if (countdown > 0) return;

    if (showReward) return;


    const birdLeft =
      STAR_X + 4;

    const birdRight =
      birdLeft +
      STAR_HITBOX;

    const birdTop =
      birdY + 6;

    const birdBottom =
      birdTop +
      STAR_HITBOX;


    const pipeLeft =
      pipeX + 12;

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
        birdTop < gapY ||
        birdBottom >
          gapY +
          PIPE_GAP
      ) {

        triggerGameOver();

        return;
      }
    }


  }, [
    birdY,
    pipeX,
    gapY,
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


    /* =====================================
       通关后先停在提示板
       玩家点击按钮后才开始红星动画
    ===================================== */

  }, [score, onComplete]);


  function startReward() {

    if (showReward) return;

    setShowReward(true);
    setRewardPhase("appear");

    const glowTimer =
      setTimeout(() => {
        setRewardPhase("glow");
      }, 700);

    const burstTimer =
      setTimeout(() => {
        setRewardPhase("burst");
      }, 1700);

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, REWARD_DURATION);

    void glowTimer;
    void burstTimer;
  }


  /* =========================================
     STAR ROTATION
  ========================================= */

  const starRotation =
    Math.max(
      -30,
      Math.min(
        velocity.current * 5,
        60
      )
    );


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
        ================================= */}

        <div className="flight-stars">

          {particles.map(
            particle => (

              <span
                key={particle.id}
                className="flight-particle"

                style={{
                  left:
                    particle.x,

                  top:
                    particle.y,

                  width:
                    particle.size,

                  height:
                    particle.size,

                  opacity:
                    particle.life,

                  transform:
                    `scale(${particle.life})`,
                }}
              />

            )
          )}

        </div>


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
        ================================= */}

        <div
          className="wish-star"

          style={{
            left: STAR_X,
            top: birdY,
            width: STAR_SIZE,
            height: STAR_SIZE,

            transform:
              `rotate(${starRotation}deg)`,
          }}
        >

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
          className="
            gift-pipe
            gift-pipe-top
          "

          style={{
            left: pipeX,
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
          className="
            gift-pipe
            gift-pipe-bottom
          "

          style={{
            left: pipeX,

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
           
           这里不再直接显示旧的
           「进入第二章」按钮
           
           改成红星奖励动画
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
                className="flight-button victory-button"
                onClick={startReward}
              >
                获得第一颗星星
              </button>

            </div>

          </div>

        )}


        {/* =========================================
           RED STAR REWARD
           
           第一关专属
           
           获得红色星星
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