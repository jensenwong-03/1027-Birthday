import { useEffect, useState } from "react";
import "../styles/CosmicCursor.css";

function CosmicCursor() {

  const [position, setPosition] = useState({
    x: -100,
    y: -100,
  });

  const [clicking, setClicking] = useState(false);

  const [visible, setVisible] = useState(false);


  useEffect(() => {

    /* =========================================
       MOUSE / POINTER MOVE
       ========================================= */

    function updatePosition(e) {

      setPosition({
        x: e.clientX,
        y: e.clientY,
      });

      setVisible(true);

    }


    /* =========================================
       CLICK
       ========================================= */

    function handleMouseDown() {

      setClicking(true);

    }


    function handleMouseUp() {

      setClicking(false);

    }


    /* =========================================
       MOUSE LEAVE / ENTER
       ========================================= */

    function handleMouseLeave() {

      setVisible(false);

    }


    function handleMouseEnter() {

      setVisible(true);

    }


    /* =========================================
       NORMAL MOUSE MOVEMENT
       ========================================= */

    window.addEventListener(
      "mousemove",
      updatePosition
    );


    /* =========================================
       IMPORTANT:
       POINTER MOVE ALSO TRACKS DRAGGING
       ========================================= */

    window.addEventListener(
      "pointermove",
      updatePosition
    );


    window.addEventListener(
      "mousedown",
      handleMouseDown
    );


    window.addEventListener(
      "mouseup",
      handleMouseUp
    );


    document.addEventListener(
      "mouseleave",
      handleMouseLeave
    );


    document.addEventListener(
      "mouseenter",
      handleMouseEnter
    );


    /* =========================================
       CLEANUP
       ========================================= */

    return () => {

      window.removeEventListener(
        "mousemove",
        updatePosition
      );


      window.removeEventListener(
        "pointermove",
        updatePosition
      );


      window.removeEventListener(
        "mousedown",
        handleMouseDown
      );


      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );


      document.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );


      document.removeEventListener(
        "mouseenter",
        handleMouseEnter
      );

    };

  }, []);


  return (

    <div
      className={`cosmic-cursor ${
        visible ? "visible" : ""
      } ${
        clicking ? "clicking" : ""
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >

      {/* =====================================
          星星本体
          ===================================== */}

      <div className="cursor-star">
        ✦
      </div>


      {/* =====================================
          发光核心
          ===================================== */}

      <div className="cursor-glow" />


      {/* =====================================
          星尘
          ===================================== */}

      <div className="cursor-particle particle-1">
        ·
      </div>

      <div className="cursor-particle particle-2">
        ·
      </div>

      <div className="cursor-particle particle-3">
        ·
      </div>

      <div className="cursor-particle particle-4">
        ·
      </div>


      {/* =====================================
          点击扩散
          ===================================== */}

      <div className="cursor-ring" />

    </div>

  );

}


export default CosmicCursor;