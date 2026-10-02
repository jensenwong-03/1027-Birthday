import { useEffect, useState } from "react";
import "../styles/Boot.css";
import StarBackground from "../components/StarBackground";

function Boot({ onEnter }) {
  const messages = [
    "正在努力缓冲ing...",
    "叮✨！检测到新的宿主...",
    "正在读取生日资料...",
    "正在建立生日副本中...",
    "欢迎回来鸭，亲爱的王诗峦小姐🩷~"
  ];

  const [step, setStep] = useState(0);
  const [showButton, setShowButton] = useState(false);

  // 控制 Boot 淡出
  const [fadeOut, setFadeOut] = useState(false);

  // 控制 Warp 星空
  const [warp, setWarp] = useState(false);

  // 按钮文字
  const [buttonText, setButtonText] = useState("进入副本");

  useEffect(() => {
    if (step < messages.length - 1) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 1800);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step]);

function handleEnter() {

  setButtonText("权限验证已通过");

  setWarp(true);

  // 不再 Fade Boot

  setTimeout(() => {
    onEnter();
  }, 5000);

}

 return (
  <>

    {/* 星空背景 */}
    <StarBackground warp={warp} />

    {/* Boot UI */}
    <div className={`boot-screen ${warp ? "warp" : ""}`}>

      <div className="boot-logo">
        1027·序列
      </div>

      <p className="boot-text">
        {messages[step]}
      </p>

      <div className="loading-bar">
        <div className="loading-fill"></div>
      </div>

      {showButton && (
        <button
          className="boot-button"
          onClick={handleEnter}
        >
          {buttonText}
        </button>
      )}

    </div>

  </>
);
}

export default Boot;