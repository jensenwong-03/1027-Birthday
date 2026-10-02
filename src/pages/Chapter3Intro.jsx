import { useEffect, useState } from "react";
import "../styles/Chapter3Intro.css";
import StarBackground from "../components/StarBackground";


function Chapter3Intro({
  onStart
}) {

  const texts = [
    "星愿瓶已经装满。",
    "散落的星光，也终于汇聚成了一条新的道路。",
    "可是……",
    "真正的生日密码，仍然隐藏在星海深处。"
  ];


  const [textIndex, setTextIndex] =
    useState(0);


  const [showButton, setShowButton] =
    useState(false);


  /* =========================================
     STORY SEQUENCE
     ========================================= */

  useEffect(() => {

    if (
      textIndex >= texts.length
    ) {

      const timer =
        setTimeout(() => {

          setShowButton(true);

        }, 1200);


      return () => {

        clearTimeout(timer);

      };

    }


    const timer =
      setTimeout(() => {

        setTextIndex(
          previous =>
            previous + 1
        );

      }, 1800);


    return () => {

      clearTimeout(timer);

    };

  }, [
    textIndex
  ]);


  /* =========================================
     START
     ========================================= */

  function handleStart() {

    setShowButton(false);

    if (onStart) {

      onStart();

    }

  }


  return (

    <div className="chapter3-intro-page">

      <StarBackground />


      <div className="chapter3-intro-screen">


        {/* =====================================
            CHAPTER NUMBER
           ===================================== */}

        <p className="chapter3-intro-number">

          CHAPTER 03

        </p>


        {/* =====================================
            TITLE
           ===================================== */}

        <h1>

          星海密码

        </h1>


        {/* =====================================
            DIVIDER
           ===================================== */}

        <div className="chapter3-intro-line" />


        {/* =====================================
            STORY
           ===================================== */}

        <div className="chapter3-intro-story">

          {texts
            .slice(
              0,
              textIndex
            )
            .map(
              (
                text,
                index
              ) => (

                <p
                  key={index}
                  className="chapter3-intro-story-line"
                >

                  {text}

                </p>

              )
            )}

        </div>


        {/* =====================================
            START BUTTON
           ===================================== */}

        {showButton && (

          <button
            className="chapter3-start-btn"
            onClick={
              handleStart
            }
          >

            进入星海

          </button>

        )}

      </div>

    </div>

  );

}


export default Chapter3Intro;