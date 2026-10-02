import { useEffect, useState } from "react";
import "../styles/Chapter1.css";
import StarBackground from "../components/StarBackground";

function Chapter1({ onStart }) {

  const stories = [
    "您缓缓地睁开了双眸，仿佛唤醒了沉睡的世界...",
    "夜空璀璨如星河，却静谧得令人恍然...",
    "当沉寂的黑暗蔓延，无数星辰随之浮现并悄然闪烁...",
    "而其中一颗特别的星星，正静静等待着您的到来~",
  ];

  const [showStory, setShowStory] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showButton, setShowButton] = useState(false);

  // 第一阶段结束后开始故事
  useEffect(() => {

    const timer = setTimeout(() => {
      setShowStory(true);
    }, 2500);

    return () => clearTimeout(timer);

  }, []);

  // 一个字一个字出现
  useEffect(() => {

    if (!showStory) return;

    if (storyIndex >= stories.length) {

      setShowButton(true);

      return;

    }

    const currentText = stories[storyIndex];

    let index = 0;

    setDisplayText("");

    const typingTimer = setInterval(() => {

      index++;

      setDisplayText(
        currentText.slice(0, index)
      );

      // 这一句话打完
      if (index >= currentText.length) {

        clearInterval(typingTimer);

        // 停顿 1 秒后进入下一句话
        setTimeout(() => {

          setStoryIndex(prev => prev + 1);

        }, 1000);

      }

    }, 120);

    return () => {

      clearInterval(typingTimer);

    };

  }, [showStory, storyIndex]);

  return (
    <>
      <StarBackground />

      <div className="chapter1">

        {!showStory ? (

          <div className="chapter-intro">

            <p className="chapter-number">
              CHAPTER 01
            </p>

            <h1>
              星空旅程
            </h1>

            <div className="chapter-line"></div>

            <p>
              第一份生日礼物已解锁~
            </p>

          </div>

        ) : (

          <div className="story-box">

            <p className="story">

              {displayText}

              {!showButton && (
                <span className="typing-cursor">
                  |
                </span>
              )}

            </p>

            {showButton && (

            <button
             className="start-btn"
                 onClick={onStart}
            >
             开始旅程
                </button>

            )}

          </div>

        )}

      </div>
    </>
  );
}

export default Chapter1;