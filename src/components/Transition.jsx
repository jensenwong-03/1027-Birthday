import { useEffect, useState } from "react";
import "../styles/Transition.css";
import StarBackground from "./StarBackground";

function Transition({ active }) {

  // ACCESS GRANTED
  const [hideContent, setHideContent] = useState(false);

  // Warp 星空
  const [showWarp, setShowWarp] = useState(false);

  // Opening Birthday Realm
  const [showOpening, setShowOpening] = useState(false);

  // 白光
  const [showFlash, setShowFlash] = useState(false);


  useEffect(() => {

    if (!active) {

      setHideContent(false);
      setShowWarp(false);
      setShowOpening(false);
      setShowFlash(false);

      return;
    }


    // =====================================================
    // 0s
    // ACCESS GRANTED + WARP
    // =====================================================

    setHideContent(false);
    setShowWarp(true);
    setShowOpening(false);
    setShowFlash(false);


    // =====================================================
    // 2s
    // ACCESS GRANTED → OPENING
    // =====================================================

    const accessTimer = setTimeout(() => {

      // 隐藏 ACCESS GRANTED
      setHideContent(true);

      // ★ Opening 阶段完全关闭 Warp
      setShowWarp(false);

      // 显示 Opening Birthday Realm
      setShowOpening(true);

    }, 2000);


    // =====================================================
    // 3.5s
    // OPENING → WHITE LIGHT
    // =====================================================

    const flashTimer = setTimeout(() => {

      // 隐藏 Opening
      setShowOpening(false);

      // 开始白光
      setShowFlash(true);

    }, 3500);


    // =====================================================
    // 8.5s
    // WHITE LIGHT 完整结束
    // =====================================================

    const flashEndTimer = setTimeout(() => {

      setShowFlash(false);

    },14000);


    return () => {

      clearTimeout(accessTimer);
      clearTimeout(flashTimer);
      clearTimeout(flashEndTimer);

    };

  }, [active]);


  return (

    <div
      className={`transition ${
        active ? "active" : ""
      }`}
    >


      {/* =================================================
          WARP 星空

          只存在 ACCESS GRANTED 阶段
      ================================================= */}

      {showWarp && (

        <StarBackground warp={true} />

      )}


      {/* =================================================
          ACCESS GRANTED
      ================================================= */}

      <div
        className={`transition-content ${
          hideContent ? "hide" : ""
        }`}
      >

        <h1>
          系统已授予访问权
        </h1>

        <p className="sub">
          诞辰界域激活中...
        </p>

        <div className="sync-bar">

          <div className="sync-fill"></div>

        </div>

        <p className="loading-text">
          生日序列同步中...
        </p>

      </div>


      {/* =================================================
          OPENING BIRTHDAY REALM

          ★ 这里没有 Warp
      ================================================= */}

      {showOpening && (

        <div className="opening">

          <div className="opening-small">
            开启
          </div>

          <div className="opening-title">
            生辰之境
          </div>

        </div>

      )}


      {/* =================================================
          WHITE LIGHT
      ================================================= */}

      {showFlash && (

        <div className="flash">

          <div className="flash-core"></div>

        </div>

      )}

    </div>

  );

}

export default Transition;