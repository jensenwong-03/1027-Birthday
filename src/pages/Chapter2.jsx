import { useEffect, useState } from "react";
import "../styles/Chapter2.css";
import StarBackground from "../components/StarBackground";
import WishBottle from "../components/WishBottle";

function Chapter2({ onComplete }) {

  const texts = [
    "散落在夜空中的星愿，",
    "需要有人将它们好好收藏。",
    "传说，当星愿瓶被装满时，",
    "真正的生日祝福，便会降临。"
  ];

  const [showGame, setShowGame] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (textIndex >= texts.length) {
      const buttonTimer = setTimeout(() => {
        setShowButton(true);
      }, 1200);

      return () => clearTimeout(buttonTimer);
    }

    const timer = setTimeout(() => {
      setTextIndex(prev => prev + 1);
    }, 1800);

    return () => {
      clearTimeout(timer);
    };
  }, [textIndex]);

  function startGame() {
    setShowGame(true);
  }

  return (
    <div className="chapter2-page">
      <StarBackground />

      {!showGame && (
        <div className="chapter2-screen">
          <div className="chapter2-intro">

            <p className="chapter-number">
              CHAPTER 02
            </p>

            <h1>
              星愿许愿瓶
            </h1>

            <div className="chapter-line"></div>

            <div className="chapter-story">
              {texts
                .slice(0, textIndex)
                .map((text, index) => (
                  <p
                    key={index}
                    className="chapter2-story-line"
                  >
                    {text}
                  </p>
                ))}
            </div>

            {showButton && (
              <button
                className="start-chapter2-btn"
                onClick={startGame}
              >
                开始收集
              </button>
            )}

          </div>
        </div>
      )}

      {showGame && (
        <div className="wish-bottle-screen">
          <WishBottle
            onComplete={onComplete}
          />
        </div>
      )}
    </div>
  );
}

export default Chapter2;