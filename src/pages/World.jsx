import { useEffect, useMemo, useState } from "react";
import "../styles/World.css";
import StarBackground from "../components/StarBackground";

function World({
  onStart,
  stars = {},
  onEnterChapter1,
  onEnterChapter2,
  onEnterChapter3,
  onEnterFinal
}) {

  /* =========================================
     三颗星星状态
     第一关 → 红星
     第二关 → 黄星
     第三关 → 蓝星
     ========================================= */

  const redStar = !!stars.red;
  const yellowStar = !!stars.yellow;
  const blueStar = !!stars.blue;


  /* =========================================
     完成数量
     ========================================= */

  const starCount = useMemo(() => {

    return [
      redStar,
      yellowStar,
      blueStar
    ].filter(Boolean).length;

  }, [
    redStar,
    yellowStar,
    blueStar
  ]);


  /* =========================================
     完成度
     ========================================= */

  const progress = useMemo(() => {

    if (starCount === 0) return 0;
    if (starCount === 1) return 33;
    if (starCount === 2) return 67;

    return 100;

  }, [starCount]);


  /* =========================================
     三星全部收集后的状态
     ========================================= */

  const [allCollected, setAllCollected] = useState(false);

  const [showFusionHint, setShowFusionHint] =
    useState(false);

  const [startFusion, setStartFusion] =
    useState(false);

  const [fusionFinished, setFusionFinished] =
    useState(false);


  /* =========================================
     三星全部集齐
     ========================================= */

  useEffect(() => {

    if (starCount === 3) {

      setAllCollected(true);

      /*
       * 先让世界页面停留一下
       * 给玩家看到三颗星已经全部点亮
       */
      const hintTimer = setTimeout(() => {

        setShowFusionHint(true);

      }, 700);


      /*
       * 然后开始三星融合
       */
      const fusionTimer = setTimeout(() => {

        setStartFusion(true);

      }, 2200);


      return () => {

        clearTimeout(hintTimer);
        clearTimeout(fusionTimer);

      };

    }

    setAllCollected(false);
    setShowFusionHint(false);
    setStartFusion(false);
    setFusionFinished(false);

  }, [starCount]);


  /* =========================================
     融合完成
     → 最终章节
     ========================================= */

  useEffect(() => {

    if (!startFusion) return;

    /*
     * 融合动画持续约 5.8 秒
     */
    const timer = setTimeout(() => {

      setFusionFinished(true);

      if (onEnterFinal) {
        onEnterFinal();
      }

    }, 5800);


    return () => clearTimeout(timer);

  }, [startFusion, onEnterFinal]);


  /* =========================================
     进入章节
     ========================================= */

  function handleChapter1() {

    if (onEnterChapter1) {
      onEnterChapter1();
      return;
    }

    if (onStart) {
      onStart();
    }

  }


  function handleChapter2() {

    if (onEnterChapter2) {
      onEnterChapter2();
    }

  }


  function handleChapter3() {

    if (onEnterChapter3) {
      onEnterChapter3();
    }

  }


  /* =========================================
     当前任务文字
     ========================================= */

  let missionText = "收集三颗生日星愿";

  if (starCount === 1) {
    missionText = "继续寻找剩余的两颗星愿";
  }

  if (starCount === 2) {
    missionText = "最后一颗星愿正在等待你";
  }

  if (starCount === 3) {
    missionText = "三颗星愿已经全部集齐";
  }


  /* =========================================
     融合动画样式
     直接写在这里
     不需要新增 CSS 文件
     ========================================= */

  const fusionStyles = `
    
    .world-fusion-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      overflow: hidden;
      background:
        radial-gradient(
          circle at center,
          rgba(30, 40, 100, 0.12),
          rgba(2, 4, 18, 0.96) 72%
        );
      animation: worldFusionFadeIn 1.2s ease forwards;
    }

    .world-fusion-stars {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .world-fusion-star {
      position: absolute;
      width: 88px;
      height: 88px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
      line-height: 1;
      opacity: 0;
      filter:
        drop-shadow(0 0 12px currentColor)
        drop-shadow(0 0 32px currentColor)
        drop-shadow(0 0 70px currentColor);
      text-shadow:
        0 0 12px currentColor,
        0 0 28px currentColor,
        0 0 55px currentColor;
    }

    .world-fusion-red {
      color: #ff405f;
      animation:
        fusionRedMove 4.1s cubic-bezier(.2,.8,.2,1) forwards,
        fusionStarPulse 1.2s ease-in-out infinite;
    }

    .world-fusion-yellow {
      color: #ffe56b;
      animation:
        fusionYellowMove 4.1s cubic-bezier(.2,.8,.2,1) forwards,
        fusionStarPulse 1.2s ease-in-out infinite .2s;
    }

    .world-fusion-blue {
      color: #63c8ff;
      animation:
        fusionBlueMove 4.1s cubic-bezier(.2,.8,.2,1) forwards,
        fusionStarPulse 1.2s ease-in-out infinite .4s;
    }

    .world-fusion-core {
      position: absolute;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: white;
      opacity: 0;
      box-shadow:
        0 0 15px white,
        0 0 35px #9edcff,
        0 0 75px #ffffff,
        0 0 130px #ffffff;
      animation:
        fusionCoreAppear 3.2s ease forwards 2.5s,
        fusionCorePulse .75s ease-in-out infinite 3.8s;
    }

    .world-fusion-ring {
      position: absolute;
      width: 130px;
      height: 130px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,.28);
      box-shadow:
        0 0 30px rgba(180,220,255,.35),
        inset 0 0 30px rgba(180,220,255,.18);
      opacity: 0;
      animation:
        fusionRingAppear 3s ease forwards 2.6s,
        fusionRingRotate 4s linear infinite 2.8s;
    }

    .world-fusion-ring-two {
      width: 220px;
      height: 220px;
      border-color: rgba(150,190,255,.18);
      animation:
        fusionRingAppear 3s ease forwards 2.9s,
        fusionRingRotateReverse 6s linear infinite 3s;
    }

    .world-fusion-ring-three {
      width: 340px;
      height: 340px;
      border-color: rgba(255,255,255,.09);
      animation:
        fusionRingAppear 3s ease forwards 3.2s,
        fusionRingRotate 8s linear infinite 3.2s;
    }

    .world-fusion-energy {
      position: absolute;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background:
        radial-gradient(
          circle,
          rgba(255,255,255,1) 0%,
          rgba(190,230,255,.85) 12%,
          rgba(110,180,255,.35) 38%,
          transparent 72%
        );
      opacity: 0;
      transform: scale(.2);
      animation:
        fusionEnergyAppear 1.8s ease forwards 3.5s,
        fusionEnergyPulse .9s ease-in-out infinite 4s;
    }

    .world-fusion-flash {
      position: absolute;
      inset: -20%;
      background: white;
      opacity: 0;
      mix-blend-mode: screen;
      animation: fusionFlash 1.5s ease forwards 4.65s;
    }

    .world-fusion-text {
      position: absolute;
      left: 50%;
      top: calc(50% + 150px);
      transform: translateX(-50%);
      width: 100%;
      text-align: center;
      color: white;
      opacity: 0;
      letter-spacing: 10px;
      font-size: 20px;
      text-shadow:
        0 0 15px white,
        0 0 35px rgba(150,200,255,.9);
      animation: fusionTextAppear 1.5s ease forwards 2.9s;
    }

    @keyframes worldFusionFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fusionRedMove {
      0% {
        opacity: 0;
        transform:
          translate(-42vw, -12vh)
          scale(.35)
          rotate(-30deg);
      }

      18% {
        opacity: 1;
      }

      55% {
        transform:
          translate(-170px, -45px)
          scale(1)
          rotate(180deg);
      }

      82% {
        transform:
          translate(0, 0)
          scale(1.15)
          rotate(340deg);
      }

      100% {
        opacity: 1;
        transform:
          translate(0, 0)
          scale(.8)
          rotate(360deg);
      }
    }

    @keyframes fusionYellowMove {
      0% {
        opacity: 0;
        transform:
          translate(42vw, -8vh)
          scale(.35)
          rotate(30deg);
      }

      18% {
        opacity: 1;
      }

      55% {
        transform:
          translate(170px, -40px)
          scale(1)
          rotate(-180deg);
      }

      82% {
        transform:
          translate(0, 0)
          scale(1.15)
          rotate(-340deg);
      }

      100% {
        opacity: 1;
        transform:
          translate(0, 0)
          scale(.8)
          rotate(-360deg);
      }
    }

    @keyframes fusionBlueMove {
      0% {
        opacity: 0;
        transform:
          translate(0, 42vh)
          scale(.35)
          rotate(0deg);
      }

      18% {
        opacity: 1;
      }

      55% {
        transform:
          translate(0, 120px)
          scale(1)
          rotate(180deg);
      }

      82% {
        transform:
          translate(0, 0)
          scale(1.15)
          rotate(340deg);
      }

      100% {
        opacity: 1;
        transform:
          translate(0, 0)
          scale(.8)
          rotate(360deg);
      }
    }

    @keyframes fusionStarPulse {
      0%, 100% {
        filter:
          drop-shadow(0 0 12px currentColor)
          drop-shadow(0 0 30px currentColor)
          drop-shadow(0 0 60px currentColor);
      }

      50% {
        filter:
          drop-shadow(0 0 20px currentColor)
          drop-shadow(0 0 45px currentColor)
          drop-shadow(0 0 95px currentColor);
      }
    }

    @keyframes fusionCoreAppear {
      0% {
        opacity: 0;
        transform: scale(.1);
      }

      60% {
        opacity: 1;
        transform: scale(1.5);
      }

      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes fusionCorePulse {
      0%, 100% {
        transform: scale(1);
      }

      50% {
        transform: scale(1.65);
      }
    }

    @keyframes fusionRingAppear {
      from {
        opacity: 0;
        transform: scale(.15);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes fusionRingRotate {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    @keyframes fusionRingRotateReverse {
      from {
        transform: rotate(360deg);
      }

      to {
        transform: rotate(0deg);
      }
    }

    @keyframes fusionEnergyAppear {
      0% {
        opacity: 0;
        transform: scale(.2);
      }

      45% {
        opacity: 1;
        transform: scale(1.7);
      }

      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes fusionEnergyPulse {
      0%, 100% {
        transform: scale(1);
      }

      50% {
        transform: scale(1.45);
      }
    }

    @keyframes fusionTextAppear {
      from {
        opacity: 0;
        transform:
          translateX(-50%)
          translateY(15px);
      }

      to {
        opacity: 1;
        transform:
          translateX(-50%)
          translateY(0);
      }
    }

    @keyframes fusionFlash {
      0% {
        opacity: 0;
      }

      25% {
        opacity: .05;
      }

      55% {
        opacity: .95;
      }

      100% {
        opacity: 0;
      }
    }

  `;


  /* =========================================
     页面
     ========================================= */

  return (
    <>
      <StarBackground />

      {/* 三星融合专用动画 */}
      {startFusion && !fusionFinished && (
        <>
          <style>{fusionStyles}</style>

          <div className="world-fusion-overlay">

            <div className="world-fusion-stars">

              <div className="world-fusion-star world-fusion-red">
                ★
              </div>

              <div className="world-fusion-star world-fusion-yellow">
                ★
              </div>

              <div className="world-fusion-star world-fusion-blue">
                ★
              </div>

              <div className="world-fusion-ring"></div>

              <div className="world-fusion-ring world-fusion-ring-two"></div>

              <div className="world-fusion-ring world-fusion-ring-three"></div>

              <div className="world-fusion-energy"></div>

              <div className="world-fusion-core"></div>

              <div className="world-fusion-text">
                三颗星辰正在汇聚……
              </div>

              <div className="world-fusion-flash"></div>

            </div>

          </div>
        </>
      )}


      <div className="world-screen">

        <div
          className={`world-container ${
            allCollected
              ? "world-completed"
              : ""
          }`}
        >

          {/* =====================================
              顶部标签
             ===================================== */}

          <p className="world-tag">
            生日星愿系统
          </p>


          {/* =====================================
              标题
             ===================================== */}

          <h1>
            王小姐的生日秘境
          </h1>


          <p className="world-description">
            欢迎进入专属生日副本
            <br />
            这里藏着三份特别的挑战与惊喜
          </p>


          {/* =====================================
              三颗星星
             ===================================== */}

          <div className="world-stars">

            {/* 红星 */}

            <div
              className={`world-star-item ${
                redStar
                  ? "star-obtained red-star"
                  : "star-locked"
              }`}
            >

              <div className="world-star red">

                <div className="star-core">
                  ★
                </div>

                {redStar && (
                  <div className="star-glow"></div>
                )}

              </div>

              <span>
                {redStar
                  ? "第一颗星愿"
                  : "等待第一颗星愿"}
              </span>

            </div>


            {/* 黄星 */}

            <div
              className={`world-star-item ${
                yellowStar
                  ? "star-obtained yellow-star"
                  : "star-locked"
              }`}
            >

              <div className="world-star yellow">

                <div className="star-core">
                  ★
                </div>

                {yellowStar && (
                  <div className="star-glow"></div>
                )}

              </div>

              <span>
                {yellowStar
                  ? "第二颗星愿"
                  : "等待第二颗星愿"}
              </span>

            </div>


            {/* 蓝星 */}

            <div
              className={`world-star-item ${
                blueStar
                  ? "star-obtained blue-star"
                  : "star-locked"
              }`}
            >

              <div className="world-star blue">

                <div className="star-core">
                  ★
                </div>

                {blueStar && (
                  <div className="star-glow"></div>
                )}

              </div>

              <span>
                {blueStar
                  ? "第三颗星愿"
                  : "等待第三颗星愿"}
              </span>

            </div>

          </div>


          {/* =====================================
              任务卡
             ===================================== */}

          <div className="mission-card">

            <h2>
              当前任务
            </h2>


            <div className="mission-list">

              <p>
                ✦ 收集生日能量
              </p>

              <p>
                ✦ 完成三个挑战
              </p>

              <p>
                ✦ 解锁最终祝福
              </p>

            </div>


            {/* =================================
                当前任务提示
               ================================= */}

            <div className="mission-status">

              <span className="mission-status-dot"></span>

              <span>
                {missionText}
              </span>

            </div>


            {/* =================================
                完成度
               ================================= */}

            <div className="progress-area">

              <p>
                副本完成度
              </p>


              <div className="progress-bar">

                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`
                  }}
                ></div>

              </div>


              <span>
                {progress}%
              </span>

            </div>


            {/* =================================
                星愿数量
               ================================= */}

            <div className="star-progress">

              <span>
                已获得
              </span>

              <strong>
                {starCount}
              </strong>

              <span>
                / 3 颗星愿
              </span>

            </div>

          </div>


          {/* =====================================
              按钮区域
             ===================================== */}

          {!allCollected && (

            <div className="world-buttons">

              {/* 第一关 */}

              {!redStar && (

                <button
                  className="enter-btn"
                  onClick={handleChapter1}
                >
                  开启第一关
                </button>

              )}


              {/* 第二关 */}

              {redStar && !yellowStar && (

                <button
                  className="enter-btn"
                  onClick={handleChapter2}
                >
                  开启第二关
                </button>

              )}


              {/* 第三关 */}

              {redStar &&
                yellowStar &&
                !blueStar && (

                  <button
                    className="enter-btn"
                    onClick={handleChapter3}
                  >
                    开启第三关
                  </button>

              )}

            </div>

          )}


          {/* =====================================
              三星完成
             ===================================== */}

          {allCollected && (

            <div className="world-final-area">

              <div className="final-star-message">

                <div className="final-star-orbit">

                  <span className="orbit-star orbit-red">
                    ★
                  </span>

                  <span className="orbit-star orbit-yellow">
                    ★
                  </span>

                  <span className="orbit-star orbit-blue">
                    ★
                  </span>

                  <div className="orbit-core">
                    ✦
                  </div>

                </div>


                <h3>
                  三颗星愿已经集齐
                </h3>


                {showFusionHint && (

                  <p>
                    最终的生日祝福正在苏醒……
                  </p>

                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </>
  );
}

export default World;
5
