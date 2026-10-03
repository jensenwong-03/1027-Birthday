import { useEffect, useRef, useState } from "react";
import "../styles/FinalReward.css";
const VIDEO_SRC = "https://pub-4ba84e432b974580adef222fef9de7da.r2.dev/birthday.mp4";

/* =========================================================
   PARTICLE FIELD
   ========================================================= */

function ParticleField({ active = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let frame;
    let particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: 170 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.7 + 0.25,
        a: Math.random() * 0.65 + 0.12,
        s: Math.random() * 0.25 + 0.035,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      particles.forEach((p) => {
        p.tw += 0.018;
        p.y -= p.s;

        if (p.y < -4) {
          p.y = window.innerHeight + 4;
          p.x = Math.random() * window.innerWidth;
        }

        const alpha =
          p.a * (0.72 + Math.sin(p.tw) * 0.28);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(190, 232, 255, ${alpha})`;
        ctx.fill();
      });

      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`final-particle-canvas ${
        active ? "is-active" : ""
      }`}
      aria-hidden="true"
    />
  );
}

/* =========================================================
   ENERGY CORE
   ========================================================= */

function EnergyCore({ pulse = false }) {
  return (
    <div
      className={`energy-core ${
        pulse ? "energy-core-pulse" : ""
      }`}
    >
      <div className="energy-core-glow" />

      <div className="energy-core-ring energy-core-ring-a" />
      <div className="energy-core-ring energy-core-ring-b" />
      <div className="energy-core-ring energy-core-ring-c" />

      <div className="energy-core-star">✦</div>
    </div>
  );
}

/* =========================================================
   BIRTHDAY LETTER
   ========================================================= */

function BirthdayLetter({ onBack }) {
  return (
    <div className="reward-letter-layer">
      <div className="letter-stars" />

      <div className="letter-card">
        <div className="letter-topline">
          一封来自星辰的信
        </div>

        <div className="letter-symbol">✦</div>

        <h2>生日快乐，王诗峦小姐！</h2>

        <div className="letter-divider">
          <span />
          <i>✦</i>
          <span />
        </div>

        <div className="letter-copy">
          <p>
            恭喜妳，走到了星海的尽头~
          </p>

          <p>
            从第一颗星星开始，
            到最后一把星钥匙，
            谢谢妳愿意一步一步走到这里。
          </p>

          <p>
            其实这片星海并没有真正的终点。
            因为只要我们还在一起，
            就总会有下一颗星星，
            下一段旅程，
            还有下一份值得收藏的回忆~
          </p>

          <p className="letter-final-line">
            愿妳新的一岁，
            <br />
            所遇皆是温柔，所愿皆能实现。
            <br />
            也愿每一次抬头看星星的时候，
            <br />
            都能想起，有人一直陪伴着你。
          </p>
        </div>

        <div className="letter-sign">
          — 永远属于妳的星海 | 鈤
        </div>

        <button
          className="letter-back"
          onClick={onBack}
        >
          返回星海
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   VIDEO
   ========================================================= */

function MemoryVideo({ onBack, onEnded }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;

    const playPromise = video.play();

    if (playPromise?.catch) {
      playPromise.catch(() => {
        setMuted(true);

        video.muted = true;

        video.play().catch(() => {});
      });
    }
  }, []);

  return (
    <div className="memory-video-layer">
      <div className="memory-video-backdrop" />

      <div className="memory-video-shell">
        <div className="memory-video-top">
          <span>OUR LITTLE UNIVERSE</span>

          <button
            onClick={onBack}
            aria-label="Close video"
          >
            ×
          </button>
        </div>

        <div className="memory-video-frame">
          <video
            ref={videoRef}
            playsInline
            controls
            autoPlay
            preload="metadata"
            onEnded={onEnded}
            onError={(event) => {
              console.error(
                "Birthday video failed to load:",
                event.currentTarget.error
              );
            }}
          >
            <source
              src={VIDEO_SRC}
              type="video/mp4"
            />

            你的浏览器暂时无法播放这个影片。
          </video>

          <div className="video-corner video-corner-tl" />
          <div className="video-corner video-corner-tr" />
          <div className="video-corner video-corner-bl" />
          <div className="video-corner video-corner-br" />
        </div>

        <div className="memory-video-bottom">
          <span>MEMORY UNLOCKED</span>

          <button
            className="sound-toggle"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;

              video.muted = !video.muted;
              setMuted(video.muted);

              if (video.paused) {
                video.play().catch(() => {});
              }
            }}
          >
            {muted ? "开启声音" : "关闭声音"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FINAL BLESSING
   ========================================================= */

function FinalBlessing({ onComplete }) {
  const [found, setFound] = useState(false);
  const [complete, setComplete] = useState(false);

  const starRef = useRef(null);

  const collectStar = () => {
    if (found) return;

    setFound(true);

    window.setTimeout(() => {
      setComplete(true);

      window.setTimeout(() => {
        onComplete();
      }, 2200);
    }, 1050);
  };

  return (
    <section
      className={`final-blessing ${
        found ? "star-found" : ""
      } ${complete ? "blessing-complete" : ""}`}
    >
      {/* Atmospheric background */}
      <div className="blessing-nebula blessing-nebula-a" />
      <div className="blessing-nebula blessing-nebula-b" />

      {/* Extra stars */}
      <div className="blessing-floating-star star-a">
        ✦
      </div>

      <div className="blessing-floating-star star-b">
        ·
      </div>

      <div className="blessing-floating-star star-c">
        ✧
      </div>

      <div className="blessing-floating-star star-d">
        ·
      </div>

      {/* Four Chinese characters */}
      <div className="blessing-title-wrap">
        <div className="blessing-subtitle">
          ONE LAST THING
        </div>

        <div className="blessing-title">
          <span>生</span>
          <span>日</span>
          <span>祝</span>
          <span>福</span>
        </div>

        <div className="blessing-title-line">
          <span />
          <i>✦</i>
          <span />
        </div>

        {!found && (
          <div className="blessing-hint">
            还有一颗星星，在等着你。
          </div>
        )}

        {found && !complete && (
          <div className="blessing-hint blessing-hint-found">
            星光正在回应你的祝福……
          </div>
        )}
      </div>

      {/* Interactive star */}
      {!found && (
        <button
          ref={starRef}
          className="blessing-star"
          onClick={collectStar}
          onTouchStart={collectStar}
          aria-label="触碰星星"
        >
          <span className="blessing-star-core">
            ✦
          </span>

          <span className="blessing-star-ring ring-1" />
          <span className="blessing-star-ring ring-2" />
          <span className="blessing-star-ring ring-3" />
        </button>
      )}

      {/* Star flight */}
      {found && (
        <div className="star-flight">
          <div className="star-flight-core">✦</div>

          <div className="star-flight-trail trail-1" />
          <div className="star-flight-trail trail-2" />
          <div className="star-flight-trail trail-3" />
        </div>
      )}

      {/* Final light explosion */}
      {complete && (
        <div className="blessing-explosion">
          <div className="explosion-core">✦</div>

          {Array.from(
            { length: 28 },
            (_, index) => (
              <span
                key={index}
                className={`explosion-particle particle-${index + 1}`}
              />
            )
          )}
        </div>
      )}

      <div className="blessing-footer">
        <span>✦</span>
        <span>
          SOME WISHES ARE MEANT TO BE FOUND
        </span>
        <span>✦</span>
      </div>
    </section>
  );
}

/* =========================================================
   FINAL REWARD
   ========================================================= */

export default function FinalReward() {
  const [phase, setPhase] = useState("awakening");
  const [reward, setReward] = useState(null);

  /*
    awakening
      ↓
    fracture
      ↓
    revealing
      ↓
    ready
      ↓
    video
      ↓
    finalBlessing
      ↓
    letter
  */

  useEffect(() => {
    const timers = [
      window.setTimeout(
        () => setPhase("fracture"),
        1700
      ),

      window.setTimeout(
        () => setPhase("revealing"),
        3400
      ),
    ];

    return () =>
      timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== "revealing") return;

    const timer = window.setTimeout(
      () => setPhase("ready"),
      1200
    );

    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (reward) {
      document.body.classList.add(
        "final-reward-open"
      );
    } else {
      document.body.classList.remove(
        "final-reward-open"
      );
    }

    return () =>
      document.body.classList.remove(
        "final-reward-open"
      );
  }, [reward]);

  const openReward = (type) => {
    setReward(type);
  };

  const closeReward = () => {
    setReward(null);
  };

  /*
    IMPORTANT:
    Video no longer directly opens the letter.

    It now starts the final blessing sequence.
  */
  const videoEnded = () => {
    setReward(null);
    setPhase("finalBlessing");
  };

  const blessingComplete = () => {
    setPhase("ready");
    setReward("letter");
  };

  const isTransitioning =
    phase === "awakening" ||
    phase === "fracture" ||
    phase === "revealing";

  return (
    <main
      className={`final-reward ${phase} ${
        reward ? "reward-open" : ""
      }`}
    >
      <ParticleField
        active={!reward}
      />

      <div className="final-nebula final-nebula-a" />
      <div className="final-nebula final-nebula-b" />

      {/* =====================================================
          ORIGINAL ENERGY TRANSITION
         ===================================================== */}

      {isTransitioning && (
        <section
          className="energy-awakening"
          aria-hidden="true"
        >
          <div className="energy-stars energy-stars-a">
            ✦
          </div>

          <div className="energy-stars energy-stars-b">
            ✦
          </div>

          <div className="energy-stars energy-stars-c">
            ✦
          </div>

          <div className="energy-stars energy-stars-d">
            ✦
          </div>

          <EnergyCore
            pulse={phase === "fracture"}
          />

          <div className="awakening-copy">
            <div className="awakening-small">
              全部星愿能量已然集齐
            </div>

            <div className="awakening-title">
              03 / 03
            </div>

            <div className="awakening-line" />
          </div>

          <div className="fracture-screen">
            {Array.from(
              { length: 18 },
              (_, index) => (
                <span
                  key={index}
                  className={`fracture-piece fracture-piece-${
                    index + 1
                  }`}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          FINAL REWARD CHAMBER
         ===================================================== */}

      {phase === "ready" &&
        !reward && (
          <section className="reward-chamber">
            <div className="chamber-orbit chamber-orbit-a" />
            <div className="chamber-orbit chamber-orbit-b" />

            <div className="reward-header">
              <div className="reward-eyebrow">
                星海 // 最终物语
              </div>

              <h1>
                <span>REWARDS</span>
                <strong>UNLOCKED</strong>
              </h1>

              <p>
                您已经集齐了所有星愿能量。
                <br />
                现在，请打开最后的礼物吧~
              </p>
            </div>

            <div className="reward-core-wrap">
              <EnergyCore pulse />

              <div className="core-caption">
                THE FINAL STAR
              </div>
            </div>

            <div className="reward-options">
              <button
                className="reward-option reward-option-letter"
                onClick={() =>
                  openReward("letter")
                }
              >
                <span className="option-icon">
                  ✦
                </span>

                <span className="option-label">
                  生日祝福
                </span>

                <span className="option-sub">
                  A LETTER FROM THE STARS
                </span>

                <span className="option-arrow">
                  ↗
                </span>
              </button>

              <button
                className="reward-option reward-option-video"
                onClick={() =>
                  openReward("video")
                }
              >
                <span className="option-icon">
                  ▶
                </span>

                <span className="option-label">
                  播放影片
                </span>

                <span className="option-sub">
                  A MEMORY WAITING FOR YOU
                </span>

                <span className="option-arrow">
                  ↗
                </span>
              </button>
            </div>

            <div className="reward-footer">
              <span>✦</span>

              <span>
                THE JOURNEY ENDS HERE
              </span>

              <span>✦</span>
            </div>
          </section>
        )}

      {/* =====================================================
          VIDEO
         ===================================================== */}

      {reward === "video" && (
        <MemoryVideo
          onBack={closeReward}
          onEnded={videoEnded}
        />
      )}

      {/* =====================================================
          NEW FINAL BLESSING
         ===================================================== */}

      {phase === "finalBlessing" && (
        <FinalBlessing
          onComplete={blessingComplete}
        />
      )}

      {/* =====================================================
          LETTER
         ===================================================== */}

      {reward === "letter" && (
        <BirthdayLetter
          onBack={closeReward}
        />
      )}
    </main>
  );
}
