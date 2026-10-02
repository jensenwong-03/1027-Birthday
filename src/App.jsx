import { useEffect, useState } from "react";

import PasswordGate from "./pages/PasswordGate";
import CosmicCursor from "./components/CosmicCursor";
import Boot from "./pages/Boot";
import World from "./pages/World";
import Transition from "./components/Transition";
import Chapter1 from "./pages/Chapter1";
import StarWishFlight from "./pages/StarWishFlight";
import Chapter2 from "./pages/Chapter2";
import Chapter3Intro from "./pages/Chapter3Intro";
import Chapter3 from "./pages/Chapter3";
import FinalReward from "./pages/FinalReward";

import {
  AudioProvider,
  useAudio
} from "./components/AudioManager";


function AppContent() {

  const {
    startAudio,
    playMusic,
    playSFX
  } = useAudio();


  /* =========================================
     开发者快捷进入章节

     ?chapter=2
     → 第二关

     ?chapter=3
     → 第三关剧情

     ?chapter=3game
     → 直接进入第三关游戏

     ?chapter=final
     → 直接进入最终章节
     ========================================= */

  const params = new URLSearchParams(
    window.location.search
  );

  const devChapter = params.get("chapter");


  /* =========================================
     当前页面
     ========================================= */

  const [page, setPage] = useState(() => {

    if (devChapter === "2") {
      return "chapter2";
    }

    if (devChapter === "3") {
      return "chapter3Intro";
    }

    if (devChapter === "3game") {
      return "chapter3";
    }

    if (devChapter === "final") {
      return "finalReward";
    }

    return "password";

  });


  /* =========================================
     三颗生日星星

     第一关 → 红星
     第二关 → 黄星
     第三关 → 蓝星
     ========================================= */

  const [stars, setStars] = useState({
    red: false,
    yellow: false,
    blue: false
  });


  /* =========================================
     转场
     ========================================= */

  const [transition, setTransition] = useState(false);


  /* =========================================
     页面 → 音乐
     ========================================= */

  useEffect(() => {

    if (page === "world") {

      playMusic("main");

    }

    if (page === "chapter1") {

      playMusic("chapter1");

    }

    if (page === "starwish") {

      playMusic("chapter1");

    }

    if (page === "chapter2") {

      playMusic("chapter2");

    }

    if (page === "chapter3Intro") {

      playMusic("chapter3");

    }

    if (page === "chapter3") {

      playMusic("chapter3");

    }

    if (page === "finalReward") {

      playMusic("ending");

    }

  }, [
    page,
    playMusic
  ]);


  /* =========================================
     PASSWORD → BOOT
     ========================================= */

  function unlockSystem() {

    /*
      用户主动点击进入
      → 获得浏览器 Audio 权限
    */

    startAudio();

    playSFX("click");

    setPage("boot");

  }


  /* =========================================
     BOOT → WORLD
     ========================================= */

  function enterWorld() {

    playSFX("whoosh");

    setTransition(true);


    setTimeout(() => {

      setPage("world");

    }, 4300);


    setTimeout(() => {

      setTransition(false);

    }, 5200);

  }


  /* =========================================
     WORLD → CHAPTER 1
     ========================================= */

  function enterChapter1() {

    playSFX("click");

    setPage("chapter1");

  }


  /* =========================================
     CHAPTER 1 STORY → GAME
     ========================================= */

  function startChapter1() {

    playSFX("whoosh");

    setPage("starwish");

  }


  /* =========================================
     CHAPTER 1 完成
     ========================================= */

  function completeChapter1() {

    playSFX("success");

    setStars(prev => ({

      ...prev,

      red: true

    }));

    setPage("world");

  }


  /* =========================================
     CHAPTER 2
     ========================================= */

  function enterChapter2() {

    playSFX("click");

    setPage("chapter2");

  }


  /* =========================================
     CHAPTER 2 完成
     ========================================= */

  function completeChapter2() {

    playSFX("success");

    setStars(prev => ({

      ...prev,

      yellow: true

    }));

    setPage("world");

  }


  /* =========================================
     WORLD → CHAPTER 3 INTRO
     ========================================= */

  function enterChapter3Intro() {

    playSFX("click");

    setPage("chapter3Intro");

  }


  /* =========================================
     CHAPTER 3 INTRO → GAME
     ========================================= */

  function startChapter3() {

    playSFX("whoosh");

    setPage("chapter3");

  }


  /* =========================================
     CHAPTER 3 完成
     ========================================= */

  function completeChapter3() {

    playSFX("success");

    setStars(prev => ({

      ...prev,

      blue: true

    }));

    setPage("world");

  }


  /* =========================================
     最终章节
     ========================================= */

  function enterFinalChapter() {

    playSFX("magic");

    setPage("finalReward");

  }


  /* =========================================
     RENDER
     ========================================= */

  return (

    <>

      {/* =====================================
          星空鼠标
         ===================================== */}

      <CosmicCursor />


      {/* =====================================
          密码入口
         ===================================== */}

      {page === "password" && (

        <PasswordGate
          onSuccess={unlockSystem}
        />

      )}


      {/* =====================================
          系统启动
         ===================================== */}

      {page === "boot" && (

        <Boot
          onEnter={enterWorld}
        />

      )}


      {/* =====================================
          生日秘境
         ===================================== */}

      {page === "world" && (

        <World
          onStart={enterChapter1}
          stars={stars}
          onEnterChapter1={enterChapter1}
          onEnterChapter2={enterChapter2}
          onEnterChapter3={enterChapter3Intro}
          onEnterFinal={enterFinalChapter}
        />

      )}


      {/* =====================================
          第一关剧情
         ===================================== */}

      {page === "chapter1" && (

        <Chapter1
          onStart={startChapter1}
        />

      )}


      {/* =====================================
          第一关游戏
         ===================================== */}

      {page === "starwish" && (

        <StarWishFlight
          onComplete={completeChapter1}
        />

      )}


      {/* =====================================
          第二关
         ===================================== */}

      {page === "chapter2" && (

        <Chapter2
          onComplete={completeChapter2}
        />

      )}


      {/* =====================================
          第三关剧情
         ===================================== */}

      {page === "chapter3Intro" && (

        <Chapter3Intro
          onStart={startChapter3}
        />

      )}


      {/* =====================================
          第三关游戏
         ===================================== */}

      {page === "chapter3" && (

        <Chapter3
          onComplete={completeChapter3}
        />

      )}


      {/* =====================================
          最终章节
         ===================================== */}

      {page === "finalReward" && (

        <FinalReward />

      )}


      {/* =====================================
          原本的系统转场
         ===================================== */}

      <Transition
        active={transition}
      />

    </>

  );

}


/* =========================================================
   APP
========================================================= */

function App() {

  return (

    <AudioProvider>

      <AppContent />

    </AudioProvider>

  );

}


export default App;