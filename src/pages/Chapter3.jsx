import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/Chapter3.css";

import {
  Canvas,
  useFrame,
  useThree
} from "@react-three/fiber";

import {
  PointerLockControls,
  Stars,
  Sparkles
} from "@react-three/drei";

import * as THREE from "three";


/* =========================================================
   SETTINGS
   ========================================================= */

const WORLD_SIZE = 180;
const WORLD_LIMIT = WORLD_SIZE / 2 - 4;

const PASSWORD = ["2", "0", "0", "4"];

const PLAYER_WALK_SPEED = 8;
const PLAYER_RUN_SPEED = 20;

const PLAYER_HEIGHT = 3;

const KEY_COLLECT_DISTANCE = 4.5;
const GATE_TRIGGER_DISTANCE = 6;


/* =========================================================
   KEY LOCATIONS
   ========================================================= */

const KEY_ZONES = [
  {
    digit: "2",
    zone: "forest",
    position: [-58, 3, -48]
  },

  {
    digit: "0",
    zone: "river",
    position: [48, 3, -42]
  },

  {
    digit: "0",
    zone: "ruins",
    position: [-48, 3, 48]
  },

  {
    digit: "4",
    zone: "valley",
    position: [55, 3, 48]
  }
];


/* =========================================================
   GATE
   ========================================================= */

const GATE_POSITION = [0, 0, -80];


/* =========================================================
   RIVER
   ========================================================= */

const RIVER_POINTS = [
  [-78, 0, 24],
  [-65, 0, 18],
  [-50, 0, 11],
  [-34, 0, 1],
  [-20, 0, 7],
  [-6, 0, 13],
  [10, 0, 4],
  [25, 0, -8],
  [42, 0, -4],
  [58, 0, -13],
  [76, 0, -23]
];

const RIVER_WIDTH = 4.5;


/* =========================================================
   HOUSE COLLIDERS
   ========================================================= */

const HOUSE_COLLIDERS = [
  {
    x: 55,
    z: -5,
    width: 16,
    depth: 14
  },

  {
    x: -62,
    z: 25,
    width: 15,
    depth: 13
  },

  {
    x: 38,
    z: 55,
    width: 16,
    depth: 14
  }
];


/* =========================================================
   STATIC WORLD COLLIDERS / MOUNTAIN DATA
   ========================================================= */

const CLIFF_DATA = [
  { x: 68, z: 25, scale: 1.25 },
  { x: -68, z: -22, scale: 1.15 }
];

const FENCE_COLLIDERS = [
  { x: 55, z: -14, width: 12.8, depth: 1.4 },
  { x: -62, z: 34, width: 12.8, depth: 1.4 },
  { x: 38, z: 64, width: 12.8, depth: 1.4 }
];

const RUIN_PILLAR_COLLIDERS = [
  { x: -53, z: 43, radius: 1.7 },
  { x: -43, z: 43, radius: 1.7 },
  { x: -53, z: 53, radius: 1.7 },
  { x: -43, z: 53, radius: 1.7 }
];

/*
 * North side deliberately leaves a wide opening around x = 0
 * so the Star Gate at z = -80 is never hidden behind a mountain.
 */
const MOUNTAIN_DATA = [
  [-78, -68, 1.8],
  [-58, -79, 1.45],
  [-35, -84, 1.55],

  [35, -84, 1.55],
  [58, -79, 1.6],
  [78, -66, 1.7],

  [-82, 0, 1.5],
  [84, 10, 1.8],

  [-75, 65, 2.0],
  [-35, 82, 1.5],
  [8, 84, 1.8],
  [48, 78, 1.6],
  [78, 62, 2.0]
];

/* Filled once by WorldDecoration so random trees / rocks can also block player. */
let WORLD_DECORATION_COLLIDERS = [];


/* =========================================================
   HELPERS
   ========================================================= */

function distanceXZ(
  x1,
  z1,
  x2,
  z2
) {

  const dx =
    x1 - x2;

  const dz =
    z1 - z2;

  return Math.sqrt(
    dx * dx +
    dz * dz
  );

}


/* =========================================================
   RIVER DISTANCE
   ========================================================= */

function distanceToRiver(
  x,
  z
) {

  let min =
    Infinity;

  for (
    let i = 0;
    i < RIVER_POINTS.length - 1;
    i++
  ) {

    const ax =
      RIVER_POINTS[i][0];

    const az =
      RIVER_POINTS[i][2];

    const bx =
      RIVER_POINTS[i + 1][0];

    const bz =
      RIVER_POINTS[i + 1][2];

    const abx =
      bx - ax;

    const abz =
      bz - az;

    const apx =
      x - ax;

    const apz =
      z - az;

    const lengthSq =
      abx * abx +
      abz * abz;

    let t =
      (
        apx * abx +
        apz * abz
      ) /
      lengthSq;

    t =
      Math.max(
        0,
        Math.min(1, t)
      );

    const px =
      ax +
      abx * t;

    const pz =
      az +
      abz * t;

    const dx =
      x - px;

    const dz =
      z - pz;

    const d =
      Math.sqrt(
        dx * dx +
        dz * dz
      );

    min =
      Math.min(
        min,
        d
      );

  }

  return min;

}


/* =========================================================
   PLAYER COLLISION
   ========================================================= */

function blockedPosition(
  x,
  z
) {

  /* HOUSES */

  for (const house of HOUSE_COLLIDERS) {

    const padding = 0.45;

    const insideX =
      x > house.x - house.width / 2 - padding &&
      x < house.x + house.width / 2 + padding;

    const insideZ =
      z > house.z - house.depth / 2 - padding &&
      z < house.z + house.depth / 2 + padding;

    if (insideX && insideZ) {
      return true;
    }

  }


  /* FENCES */

  for (const fence of FENCE_COLLIDERS) {

    const insideX =
      x > fence.x - fence.width / 2 &&
      x < fence.x + fence.width / 2;

    const insideZ =
      z > fence.z - fence.depth / 2 &&
      z < fence.z + fence.depth / 2;

    if (insideX && insideZ) {
      return true;
    }

  }


  /* CLIFFS */

  for (const cliff of CLIFF_DATA) {

    const radius = 9.2 * cliff.scale;

    if (
      distanceXZ(
        x,
        z,
        cliff.x,
        cliff.z
      ) < radius
    ) {
      return true;
    }

  }


  /* RUIN PILLARS - center remains accessible for the key */

  for (const pillar of RUIN_PILLAR_COLLIDERS) {

    if (
      distanceXZ(
        x,
        z,
        pillar.x,
        pillar.z
      ) < pillar.radius
    ) {
      return true;
    }

  }


  /* DISTANT MOUNTAINS */

  for (const mountain of MOUNTAIN_DATA) {

    const mx = mountain[0];
    const mz = mountain[1];
    const scale = mountain[2];

    /* Slightly smaller than visual base so collision feels natural. */
    const radius = 9.5 * scale;

    if (
      distanceXZ(
        x,
        z,
        mx,
        mz
      ) < radius
    ) {
      return true;
    }

  }


  /* RANDOM LARGE DECORATIONS: TREES / ROCKS */

  for (const object of WORLD_DECORATION_COLLIDERS) {

    const dx = x - object.x;
    const dz = z - object.z;

    if (
      dx * dx + dz * dz <
      object.radius * object.radius
    ) {
      return true;
    }

  }


  /*
   * River intentionally has no collision.
   * Player is allowed to walk into the water.
   */

  return false;

}


/* =========================================================
   PLAYER
   ========================================================= */

function Player({
  collectedKeys,
  keyPositions,
  onCollectKey,
  onGateEnter,
  onPlayerMove,
  enteringGate,
  gameEnded
}) {

  const { camera } =
    useThree();

  const velocityY =
    useRef(0);

  const keys =
    useRef({});

  const canJump =
    useRef(true);

  const collectedRef =
    useRef(collectedKeys);

  const gateTriggered =
    useRef(false);


  const reusableForward =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const reusableRight =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const reusableMovement =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const reusableGateDirection =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const upVector =
    useMemo(
      () => new THREE.Vector3(
        0,
        1,
        0
      ),
      []
    );


  useEffect(() => {

    collectedRef.current =
      collectedKeys;

  }, [collectedKeys]);


  /* =======================================================
     KEYBOARD
     ======================================================= */

  useEffect(() => {

    function keyDown(e) {

      /*
       * 使用 code + key 双重记录
       *
       * 这样 Shift + 方向键
       * 会更加稳定
       */

      keys.current[e.code] =
        true;

      keys.current[e.key] =
        true;


      if (
        [
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight"
        ].includes(e.code)
      ) {

        e.preventDefault();

      }


      if (
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight" ||
        e.key === "Shift"
      ) {

        keys.current.shift =
          true;

      }


      if (
        e.code === "Space" &&
        canJump.current &&
        !enteringGate &&
        !gameEnded
      ) {

        velocityY.current =
          8;

        canJump.current =
          false;

      }

    }


    function keyUp(e) {

      keys.current[e.code] =
        false;

      keys.current[e.key] =
        false;


      if (
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight" ||
        e.key === "Shift"
      ) {

        keys.current.shift =
          false;

      }

    }


    window.addEventListener(
      "keydown",
      keyDown,
      {
        passive: false
      }
    );

    window.addEventListener(
      "keyup",
      keyUp
    );


    return () => {

      window.removeEventListener(
        "keydown",
        keyDown
      );

      window.removeEventListener(
        "keyup",
        keyUp
      );

    };

  }, [enteringGate, gameEnded]);


  /* =======================================================
     PLAYER LOOP
     ======================================================= */

  useFrame(
    (_, delta) => {

      const dt =
        Math.min(
          delta,
          0.035
        );


      /* ===================================================
         GAME ENDED
         完成后彻底停止玩家输入与移动计算
         =================================================== */

      if (gameEnded) {
        return;
      }


      /* ===================================================
         GATE WALK
         =================================================== */

      if (enteringGate) {

        reusableGateDirection.set(
          GATE_POSITION[0] - camera.position.x,
          0,
          GATE_POSITION[2] - camera.position.z
        );


        const direction =
          reusableGateDirection;


        direction.y =
          0;


        const distance =
          direction.length();


        if (
          distance > 0.8
        ) {

          direction.normalize();

          const amount =
            10 * dt;

          camera.position.x +=
            direction.x *
            amount;

          camera.position.z +=
            direction.z *
            amount;

        }


        onPlayerMove(
          camera.position.x,
          camera.position.z
        );

        return;

      }


      /* ===================================================
         INPUT
         =================================================== */

      let moveX =
        0;

      let moveZ =
        0;


      if (
        keys.current.KeyW ||
        keys.current.ArrowUp
      ) {

        moveZ -= 1;

      }


      if (
        keys.current.KeyS ||
        keys.current.ArrowDown
      ) {

        moveZ += 1;

      }


      if (
        keys.current.KeyA ||
        keys.current.ArrowLeft
      ) {

        moveX -= 1;

      }


      if (
        keys.current.KeyD ||
        keys.current.ArrowRight
      ) {

        moveX += 1;

      }


      /* ===================================================
         MOVEMENT
         =================================================== */

      if (
        moveX !== 0 ||
        moveZ !== 0
      ) {

        camera.getWorldDirection(
          reusableForward
        );


        reusableForward.y =
          0;

        reusableForward.normalize();


        reusableRight.crossVectors(
          reusableForward,
          upVector
        );

        reusableRight.normalize();


        reusableMovement.set(
          0,
          0,
          0
        );


        reusableMovement.addScaledVector(
          reusableForward,
          -moveZ
        );


        reusableMovement.addScaledVector(
          reusableRight,
          moveX
        );


        reusableMovement.normalize();


        /* =================================================
           SHIFT RUN
           ================================================= */

        const running =
          keys.current.ShiftLeft ||
          keys.current.ShiftRight ||
          keys.current.shift ||
          keys.current.Shift;


        const speed =
          running
            ? PLAYER_RUN_SPEED
            : PLAYER_WALK_SPEED;


        const amount =
          speed * dt;


        const nextX =
          camera.position.x +
          reusableMovement.x *
          amount;


        const nextZ =
          camera.position.z +
          reusableMovement.z *
          amount;


        /* =================================================
           X COLLISION
           ================================================= */

        if (
          !blockedPosition(
            nextX,
            camera.position.z
          )
        ) {

          camera.position.x =
            nextX;

        }


        /* =================================================
           Z COLLISION
           ================================================= */

        if (
          !blockedPosition(
            camera.position.x,
            nextZ
          )
        ) {

          camera.position.z =
            nextZ;

        }

      }


      /* ===================================================
         GRAVITY
         =================================================== */

      velocityY.current -=
        22 * dt;


      camera.position.y +=
        velocityY.current *
        dt;


      if (
        camera.position.y <
        PLAYER_HEIGHT
      ) {

        camera.position.y =
          PLAYER_HEIGHT;

        velocityY.current =
          0;

        canJump.current =
          true;

      }


      /* ===================================================
         WORLD LIMIT
         =================================================== */

      camera.position.x =
        THREE.MathUtils.clamp(
          camera.position.x,
          -WORLD_LIMIT,
          WORLD_LIMIT
        );


      camera.position.z =
        THREE.MathUtils.clamp(
          camera.position.z,
          -WORLD_LIMIT,
          WORLD_LIMIT
        );


      /* ===================================================
         KEY AUTO COLLECT
         =================================================== */

      const currentCollected =
        collectedRef.current;


      for (
        let i = 0;
        i < keyPositions.length;
        i++
      ) {

        if (
          currentCollected.includes(i)
        ) {

          continue;

        }


        const key =
          keyPositions[i];


        const distance =
          distanceXZ(
            camera.position.x,
            camera.position.z,
            key.position[0],
            key.position[2]
          );


        if (
          distance <
          KEY_COLLECT_DISTANCE
        ) {

          onCollectKey(
            i,
            key.digit
          );

        }

      }


      /* ===================================================
         STAR GATE
         =================================================== */

      if (
        currentCollected.length === 4 &&
        !gateTriggered.current
      ) {

        const distance =
          distanceXZ(
            camera.position.x,
            camera.position.z,
            GATE_POSITION[0],
            GATE_POSITION[2]
          );


        if (
          distance <
          GATE_TRIGGER_DISTANCE
        ) {

          gateTriggered.current =
            true;

          onGateEnter();

        }

      }


      /* ===================================================
         MINIMAP
         =================================================== */

      if (
        moveX !== 0 ||
        moveZ !== 0
      ) {

        onPlayerMove(
          camera.position.x,
          camera.position.z
        );

      }

    }
  );


  return null;

}


/* =========================================================
   GROUND
   ========================================================= */

function Ground() {

  return (

    <>

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
      >

        <planeGeometry
          args={[
            WORLD_SIZE,
            WORLD_SIZE
          ]}
        />

        <meshStandardMaterial
          color="#193d36"
          roughness={0.95}
        />

      </mesh>


      {/* CENTRAL ROAD */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        position={[
          0,
          0.025,
          0
        ]}
      >

        <planeGeometry
          args={[
            11,
            WORLD_SIZE
          ]}
        />

        <meshStandardMaterial
          color="#314a50"
          roughness={1}
        />

      </mesh>


      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        position={[
          0,
          0.026,
          0
        ]}
      >

        <planeGeometry
          args={[
            WORLD_SIZE,
            8
          ]}
        />

        <meshStandardMaterial
          color="#314a50"
          roughness={1}
        />

      </mesh>


      {/* FOREST GRASS */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        position={[
          -35,
          0.035,
          -35
        ]}
      >

        <circleGeometry
          args={[
            16,
            32
          ]}
        />

        <meshStandardMaterial
          color="#25533f"
        />

      </mesh>


      {/* VALLEY GRASS */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        position={[
          38,
          0.035,
          35
        ]}
      >

        <circleGeometry
          args={[
            20,
            32
          ]}
        />

        <meshStandardMaterial
          color="#214b3d"
        />

      </mesh>


      <GrassPatch
        position={[
          -30,
          0,
          -20
        ]}
        scale={1.3}
      />

      <GrassPatch
        position={[
          28,
          0,
          -30
        ]}
        scale={1.1}
      />

      <GrassPatch
        position={[
          20,
          0,
          28
        ]}
        scale={1.4}
      />

      <GrassPatch
        position={[
          -30,
          0,
          35
        ]}
        scale={1.2}
      />

    </>

  );

}


/* =========================================================
   GRASS PATCH
   ========================================================= */

function GrassPatch({
  position,
  scale = 1
}) {

  return (

    <group
      position={position}
      scale={scale}
    >

      {[...Array(7)].map(
        (_, i) => {

          const angle =
            i /
            7 *
            Math.PI *
            2;


          return (

            <mesh
              key={i}
              position={[
                Math.cos(angle) *
                  0.35,
                0.45,
                Math.sin(angle) *
                  0.35
              ]}
              rotation={[
                0,
                angle,
                -0.25
              ]}
            >

              <coneGeometry
                args={[
                  0.08,
                  0.9,
                  4
                ]}
              />

              <meshStandardMaterial
                color="#3e875d"
                roughness={1}
              />

            </mesh>

          );

        }
      )}

    </group>

  );

}


/* =========================================================
   RIVER
   ========================================================= */

function River() {

  const geometry =
    useMemo(() => {

      const curve =
        new THREE.CatmullRomCurve3(
          RIVER_POINTS.map(
            p =>
              new THREE.Vector3(
                p[0],
                0.12,
                p[2]
              )
          ),
          false,
          "catmullrom",
          0.35
        );


      const points =
        curve.getPoints(80);


      const left = [];
      const right = [];


      for (
        let i = 0;
        i < points.length;
        i++
      ) {

        const current =
          points[i];

        const previous =
          points[
            Math.max(
              0,
              i - 1
            )
          ];

        const next =
          points[
            Math.min(
              points.length - 1,
              i + 1
            )
          ];


        const tangent =
          new THREE.Vector3()
            .subVectors(
              next,
              previous
            )
            .normalize();


        const side =
          new THREE.Vector3(
            -tangent.z,
            0,
            tangent.x
          );


        left.push(
          current.clone().add(
            side.clone().multiplyScalar(
              RIVER_WIDTH
            )
          )
        );


        right.push(
          current.clone().add(
            side.clone().multiplyScalar(
              -RIVER_WIDTH
            )
          )
        );

      }


      const all = [
        ...left,
        ...right.reverse()
      ];


      const shape =
        new THREE.Shape();


      shape.moveTo(
        all[0].x,
        all[0].z
      );


      for (
        let i = 1;
        i < all.length;
        i++
      ) {

        shape.lineTo(
          all[i].x,
          all[i].z
        );

      }


      shape.closePath();


      const geo =
        new THREE.ShapeGeometry(
          shape
        );


      geo.rotateX(
        -Math.PI / 2
      );


      return geo;

    }, []);


  return (

    <group>

      <mesh
        geometry={geometry}
        position={[
          0,
          0.08,
          0
        ]}
      >

        <meshStandardMaterial
          color="#1b8db4"
          transparent
          opacity={0.86}
          roughness={0.12}
          metalness={0.18}
        />

      </mesh>


      <mesh
        geometry={geometry}
        position={[
          0,
          0.105,
          0
        ]}
        scale={[
          0.72,
          1,
          0.72
        ]}
      >

        <meshBasicMaterial
          color="#62d9e8"
          transparent
          opacity={0.12}
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   TREE
   ========================================================= */

function Tree({
  position,
  scale = 1
}) {

  return (

    <group
      position={position}
      scale={scale}
    >

      <mesh
        position={[
          0,
          2,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            0.42,
            0.62,
            4,
            7
          ]}
        />

        <meshStandardMaterial
          color="#704b32"
          roughness={1}
        />

      </mesh>


      <mesh
        position={[
          0,
          5,
          0
        ]}
      >

        <coneGeometry
          args={[
            2.7,
            5,
            8
          ]}
        />

        <meshStandardMaterial
          color="#16806b"
          roughness={0.88}
        />

      </mesh>


      <mesh
        position={[
          0,
          6.8,
          0
        ]}
      >

        <coneGeometry
          args={[
            1.85,
            3.8,
            8
          ]}
        />

        <meshStandardMaterial
          color="#2ca982"
          roughness={0.82}
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   FLOWER
   ========================================================= */

function Flower({
  position,
  color = "#ff9ed8"
}) {

  return (

    <group
      position={position}
    >

      <mesh
        position={[
          0,
          0.55,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            0.035,
            0.05,
            1.1,
            5
          ]}
        />

        <meshStandardMaterial
          color="#65a85d"
        />

      </mesh>


      <mesh
        position={[
          0,
          1.1,
          0
        ]}
      >

        <sphereGeometry
          args={[
            0.18,
            7,
            7
          ]}
        />

        <meshBasicMaterial
          color={color}
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   ROCK
   ========================================================= */

function Rock({
  position,
  scale = 1
}) {

  return (

    <mesh
      position={[
        position[0],
        scale * 0.65,
        position[2]
      ]}
      scale={[
        scale,
        scale * 0.7,
        scale
      ]}
      rotation={[
        0,
        position[0] * 0.1,
        0
      ]}
    >

      <dodecahedronGeometry
        args={[
          1.5,
          0
        ]}
      />

      <meshStandardMaterial
        color="#59636b"
        roughness={1}
      />

    </mesh>

  );

}


/* =========================================================
   HOUSE
   ========================================================= */

function House({
  position,
  roofColor = "#7650a6"
}) {

  return (

    <group
      position={position}
    >

      <mesh
        position={[
          0,
          3.5,
          0
        ]}
      >

        <boxGeometry
          args={[
            16,
            7,
            14
          ]}
        />

        <meshStandardMaterial
          color="#80685a"
          roughness={0.96}
        />

      </mesh>


      <mesh
        position={[
          0,
          8.3,
          0
        ]}
        rotation={[
          0,
          Math.PI / 4,
          0
        ]}
      >

        <coneGeometry
          args={[
            11,
            5,
            4
          ]}
        />

        <meshStandardMaterial
          color={roofColor}
          roughness={0.82}
        />

      </mesh>


      <mesh
        position={[
          0,
          2.3,
          7.1
        ]}
      >

        <boxGeometry
          args={[
            2.5,
            4.5,
            0.2
          ]}
        />

        <meshStandardMaterial
          color="#30263b"
          roughness={0.7}
        />

      </mesh>


      <mesh
        position={[
          -4.5,
          4,
          7.12
        ]}
      >

        <boxGeometry
          args={[
            2.3,
            2.2,
            0.15
          ]}
        />

        <meshBasicMaterial
          color="#ffe08a"
        />

      </mesh>


      <mesh
        position={[
          4.5,
          4,
          7.12
        ]}
      >

        <boxGeometry
          args={[
            2.3,
            2.2,
            0.15
          ]}
        />

        <meshBasicMaterial
          color="#ffd47a"
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   RUINS
   ========================================================= */

function Ruins() {

  const pillars = [
    [-5, 3, -5],
    [5, 3, -5],
    [-5, 3, 5],
    [5, 3, 5]
  ];


  return (

    <group
      position={[
        -48,
        0,
        48
      ]}
    >

      {pillars.map(
        (p, i) => (

          <mesh
            key={i}
            position={p}
          >

            <boxGeometry
              args={[
                2.2,
                6,
                2.2
              ]}
            />

            <meshStandardMaterial
              color="#837b6a"
              roughness={1}
            />

          </mesh>

        )
      )}


      <mesh
        position={[
          0,
          0.8,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            5,
            5.5,
            1.6,
            10
          ]}
        />

        <meshStandardMaterial
          color="#686557"
          roughness={1}
        />

      </mesh>


      <mesh
        position={[
          0,
          2.4,
          0
        ]}
      >

        <octahedronGeometry
          args={[
            1.1,
            0
          ]}
        />

        <meshBasicMaterial
          color="#dca8ff"
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   CLIFF
   ========================================================= */

function Cliff({
  position,
  scale = 1
}) {

  return (

    <group
      position={[
        position[0],
        0,
        position[2]
      ]}
      scale={scale}
    >

      <mesh
        position={[
          0,
          4,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            7,
            10,
            8,
            7
          ]}
        />

        <meshStandardMaterial
          color="#59616b"
          roughness={1}
        />

      </mesh>


      <mesh
        position={[
          0,
          8.2,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            7.2,
            7.2,
            0.35,
            7
          ]}
        />

        <meshStandardMaterial
          color="#708768"
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   ANIMAL
   ========================================================= */

function Animal({
  position,
  type = "sheep"
}) {

  const group =
    useRef();


  const start =
    useMemo(
      () => ({
        x: position[0],
        z: position[2]
      }),
      [position]
    );


  const phase =
    useMemo(
      () =>
        Math.random() *
        Math.PI *
        2,
      []
    );


  useFrame(
    ({ clock }) => {

      if (!group.current) {

        return;

      }


      const t =
        clock.elapsedTime *
        0.22 +
        phase;


      const x =
        start.x +
        Math.sin(t) *
        2.2;


      const z =
        start.z +
        Math.cos(t * 0.7) *
        1.5;


      if (
        distanceToRiver(
          x,
          z
        ) >
        RIVER_WIDTH + 2
      ) {

        group.current.position.x =
          x;

        group.current.position.z =
          z;

      }


      group.current.rotation.y =
        Math.sin(t) *
        0.35;

    }
  );


  /* =======================================================
     BIRD
     ======================================================= */

  if (
    type === "bird"
  ) {

    return (

      <group
        ref={group}
        position={position}
      >

        <mesh>

          <sphereGeometry
            args={[
              0.65,
              7,
              7
            ]}
          />

          <meshStandardMaterial
            color="#f3eee5"
          />

        </mesh>


        <mesh
          position={[
            0.65,
            0,
            0
          ]}
        >

          <coneGeometry
            args={[
              0.18,
              0.55,
              4
            ]}
          />

          <meshStandardMaterial
            color="#e6aa55"
          />

        </mesh>


        <mesh
          position={[
            -0.55,
            0,
            0
          ]}
        >

          <boxGeometry
            args={[
              1.2,
              0.1,
              0.45
            ]}
          />

          <meshStandardMaterial
            color="#d7dce1"
          />

        </mesh>

      </group>

    );

  }


  /* =======================================================
     DEER
     ======================================================= */

  if (
    type === "deer"
  ) {

    return (

      <group
        ref={group}
        position={position}
      >

        <mesh
          position={[
            0,
            1.4,
            0
          ]}
        >

          <boxGeometry
            args={[
              1.8,
              0.9,
              0.8
            ]}
          />

          <meshStandardMaterial
            color="#9c7049"
          />

        </mesh>


        <mesh
          position={[
            0.95,
            1.9,
            0
          ]}
        >

          <boxGeometry
            args={[
              0.7,
              0.7,
              0.6
            ]}
          />

          <meshStandardMaterial
            color="#aa7c50"
          />

        </mesh>


        {[
          [-0.6, 0.55, -0.3],
          [-0.6, 0.55, 0.3],
          [0.5, 0.55, -0.3],
          [0.5, 0.55, 0.3]
        ].map(
          (p, i) => (

            <mesh
              key={i}
              position={p}
            >

              <cylinderGeometry
                args={[
                  0.08,
                  0.1,
                  1.2,
                  6
                ]}
              />

              <meshStandardMaterial
                color="#62452f"
              />

            </mesh>

          )
        )}

      </group>

    );

  }


  /* =======================================================
     SHEEP
     ======================================================= */

  return (

    <group
      ref={group}
      position={position}
    >

      <mesh
        position={[
          0,
          1.1,
          0
        ]}
      >

        <sphereGeometry
          args={[
            1.2,
            8,
            7
          ]}
        />

        <meshStandardMaterial
          color="#f0eee7"
        />

      </mesh>


      <mesh
        position={[
          1,
          1.35,
          0
        ]}
      >

        <sphereGeometry
          args={[
            0.65,
            7,
            7
          ]}
        />

        <meshStandardMaterial
          color="#47454a"
        />

      </mesh>


      {[
        [-0.6, 0.35, -0.45],
        [-0.6, 0.35, 0.45],
        [0.6, 0.35, -0.45],
        [0.6, 0.35, 0.45]
      ].map(
        (p, i) => (

          <mesh
            key={i}
            position={p}
          >

            <cylinderGeometry
              args={[
                0.08,
                0.1,
                0.8,
                6
              ]}
            />

            <meshStandardMaterial
              color="#4b4850"
            />

          </mesh>

        )
      )}

    </group>

  );

}


/* =========================================================
   STONE PATH
   ========================================================= */

function StonePath({
  position = [0, 0, 0],
  rotation = 0,
  length = 20,
  width = 4
}) {

  const stones =
    useMemo(() => {

      const result = [];

      const count =
        Math.floor(
          length / 2.5
        );


      for (
        let i = 0;
        i < count;
        i++
      ) {

        result.push({
          x:
            (Math.random() - 0.5) *
            width,

          z:
            (i - count / 2) *
              2.5 +
            (Math.random() - 0.5) *
              0.6,

          scale:
            0.8 +
            Math.random() *
              0.35,

          rotation:
            Math.random() *
            Math.PI

        });

      }


      return result;

    }, [length, width]);


  return (

    <group
      position={position}
      rotation={[
        0,
        rotation,
        0
      ]}
    >

      {stones.map(
        (stone, i) => (

          <mesh
            key={i}
            position={[
              stone.x,
              0.12,
              stone.z
            ]}
            rotation={[
              0,
              stone.rotation,
              0
            ]}
            scale={[
              stone.scale,
              0.18,
              stone.scale * 0.8
            ]}
          >

            <cylinderGeometry
              args={[
                1.15,
                1.25,
                0.35,
                7
              ]}
            />

            <meshStandardMaterial
              color="#667078"
              roughness={0.95}
            />

          </mesh>

        )
      )}

    </group>

  );

}


/* =========================================================
   GLOW MUSHROOM
   ========================================================= */

function GlowMushroom({
  position,
  color = "#a6e8ff",
  scale = 1
}) {

  return (

    <group
      position={position}
      scale={scale}
    >

      <mesh
        position={[
          0,
          0.55,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            0.09,
            0.13,
            1.1,
            6
          ]}
        />

        <meshStandardMaterial
          color="#d9d1bd"
          roughness={0.8}
        />

      </mesh>


      <mesh
        position={[
          0,
          1.12,
          0
        ]}
      >

        <sphereGeometry
          args={[
            0.35,
            8,
            6
          ]}
        />

        <meshBasicMaterial
          color={color}
        />

      </mesh>


      <pointLight
        color={color}
        intensity={0.55}
        distance={5}
      />

    </group>

  );

}


/* =========================================================
   LANTERN
   ========================================================= */

function Lantern({
  position
}) {

  return (

    <group
      position={position}
    >

      <mesh
        position={[
          0,
          1.5,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            0.08,
            0.12,
            3,
            6
          ]}
        />

        <meshStandardMaterial
          color="#4d5960"
          metalness={0.65}
          roughness={0.35}
        />

      </mesh>


      <mesh
        position={[
          0,
          3,
          0
        ]}
      >

        <boxGeometry
          args={[
            0.7,
            0.8,
            0.7
          ]}
        />

        <meshBasicMaterial
          color="#ffe59a"
          transparent
          opacity={0.9}
        />

      </mesh>


      <pointLight
        position={[
          0,
          3,
          0
        ]}
        color="#ffd77d"
        intensity={1.2}
        distance={8}
      />

    </group>

  );

}


/* =========================================================
   HOUSE FENCE
   ========================================================= */

function HouseFence({
  position
}) {

  return (

    <group
      position={position}
    >

      {[...Array(7)].map(
        (_, i) => (

          <mesh
            key={i}
            position={[
              i * 1.8 - 5.4,
              0.9,
              0
            ]}
          >

            <boxGeometry
              args={[
                0.22,
                1.8,
                0.22
              ]}
            />

            <meshStandardMaterial
              color="#765a3d"
            />

          </mesh>

        )
      )}


      <mesh
        position={[
          0,
          0.8,
          0
        ]}
      >

        <boxGeometry
          args={[
            12,
            0.18,
            0.18
          ]}
        />

        <meshStandardMaterial
          color="#765a3d"
        />

      </mesh>

    </group>

  );

}


/* =========================================================
   DISTANT MOUNTAINS
   ========================================================= */

function DistantMountains() {

  const mountains = MOUNTAIN_DATA;


  return (

    <group>

      {mountains.map(
        (mountain, i) => {

          const x =
            mountain[0];

          const z =
            mountain[1];

          const scale =
            mountain[2];


          return (

            <mesh
              key={i}
              position={[
                x,
                scale * 3,
                z
              ]}
              scale={[
                scale,
                scale,
                scale
              ]}
            >

              <coneGeometry
                args={[
                  15,
                  18,
                  7
                ]}
              />

              <meshStandardMaterial
                color="#203c45"
                roughness={1}
              />

            </mesh>

          );

        }
      )}

    </group>

  );

}


/* =========================================================
   RUIN DEBRIS
   ========================================================= */

function RuinDebris() {

  const debris =
    useMemo(() => {

      const result = [];


      for (
        let i = 0;
        i < 18;
        i++
      ) {

        const angle =
          Math.random() *
          Math.PI *
          2;

        const radius =
          7 +
          Math.random() *
          6;


        result.push({

          x:
            Math.cos(angle) *
            radius,

          z:
            Math.sin(angle) *
            radius,

          scale:
            0.35 +
            Math.random() *
              0.7,

          rotation:
            Math.random() *
            Math.PI

        });

      }


      return result;

    }, []);


  return (

    <group
      position={[
        -48,
        0,
        48
      ]}
    >

      {debris.map(
        (d, i) => (

          <mesh
            key={i}
            position={[
              d.x,
              d.scale * 0.45,
              d.z
            ]}
            rotation={[
              0,
              d.rotation,
              0
            ]}
            scale={[
              d.scale,
              d.scale * 0.65,
              d.scale
            ]}
          >

            <dodecahedronGeometry
              args={[
                1.2,
                0
              ]}
            />

            <meshStandardMaterial
              color="#6f6b5e"
              roughness={1}
            />

          </mesh>

        )
      )}

    </group>

  );

}


/* =========================================================
   FIREFLIES
   ========================================================= */

function Fireflies() {

  const positions =
    useMemo(() => {

      const result = [];


      for (
        let i = 0;
        i < 90;
        i++
      ) {

        result.push(
          (Math.random() - 0.5) *
            160,

          1 +
            Math.random() *
            8,

          (Math.random() - 0.5) *
            160
        );

      }


      return result;

    }, []);


  return (

    <points>

      <bufferGeometry>

        <bufferAttribute
          attach="attributes-position"
          count={
            positions.length / 3
          }
          array={
            new Float32Array(
              positions
            )
          }
          itemSize={3}
        />

      </bufferGeometry>


      <pointsMaterial
        size={0.18}
        transparent
        opacity={0.75}
        sizeAttenuation
      />

    </points>

  );

}


/* =========================================================
   WORLD LANDMARKS
   ========================================================= */

function WorldLandmarks() {

  return (

    <>

      {/* ===================================================
          STONE PATHS
         =================================================== */}

      <StonePath
        position={[
          0,
          0,
          30
        ]}
        rotation={0}
        length={55}
        width={4}
      />


      <StonePath
        position={[
          -32,
          0,
          -8
        ]}
        rotation={
          Math.PI / 2
        }
        length={35}
        width={3.5}
      />


      <StonePath
        position={[
          35,
          0,
          18
        ]}
        rotation={
          Math.PI / 2
        }
        length={42}
        width={3.5}
      />


      {/* ===================================================
          FOREST
         =================================================== */}

      <GlowMushroom
        position={[
          -45,
          0,
          -40
        ]}
        color="#8fdfff"
        scale={1.1}
      />

      <GlowMushroom
        position={[
          -52,
          0,
          -35
        ]}
        color="#c9a7ff"
        scale={0.8}
      />

      <GlowMushroom
        position={[
          -40,
          0,
          -50
        ]}
        color="#9ff0d5"
        scale={0.75}
      />

      <GlowMushroom
        position={[
          -60,
          0,
          -42
        ]}
        color="#ffe49b"
        scale={0.65}
      />


      {/* ===================================================
          RIVER
         =================================================== */}

      <GlowMushroom
        position={[
          38,
          0,
          -17
        ]}
        color="#72e5ff"
        scale={0.75}
      />

      <GlowMushroom
        position={[
          51,
          0,
          -7
        ]}
        color="#9eeaff"
        scale={0.8}
      />

      <GlowMushroom
        position={[
          64,
          0,
          -18
        ]}
        color="#bca8ff"
        scale={0.65}
      />


      {/* ===================================================
          HOUSES
         =================================================== */}

      <HouseFence
        position={[
          55,
          0,
          -14
        ]}
      />

      <HouseFence
        position={[
          -62,
          0,
          34
        ]}
      />

      <HouseFence
        position={[
          38,
          0,
          64
        ]}
      />


      <Lantern
        position={[
          48,
          0,
          -13
        ]}
      />

      <Lantern
        position={[
          62,
          0,
          -13
        ]}
      />

      <Lantern
        position={[
          -69,
          0,
          31
        ]}
      />

      <Lantern
        position={[
          31,
          0,
          64
        ]}
      />


      {/* ===================================================
          RUINS
         =================================================== */}

      <RuinDebris />


      <GlowMushroom
        position={[
          -40,
          0,
          45
        ]}
        color="#c9a7ff"
        scale={1}
      />

      <GlowMushroom
        position={[
          -55,
          0,
          39
        ]}
        color="#7deaff"
        scale={0.8}
      />


      {/* ===================================================
          VALLEY
         =================================================== */}

      <GlowMushroom
        position={[
          47,
          0,
          43
        ]}
        color="#9ff0d5"
        scale={0.8}
      />

      <GlowMushroom
        position={[
          60,
          0,
          53
        ]}
        color="#ffe49b"
        scale={0.7}
      />

      <GlowMushroom
        position={[
          50,
          0,
          61
        ]}
        color="#bba5ff"
        scale={0.9}
      />

    </>

  );

}


/* =========================================================
   WORLD DECORATION
   ========================================================= */

function randomPosition() {

  return {

    x:
      (Math.random() - 0.5) *
      (WORLD_SIZE - 12),

    z:
      (Math.random() - 0.5) *
      (WORLD_SIZE - 12)

  };

}


function WorldDecoration() {

  const objects =
    useMemo(() => {

      const result = [];


      /* ===================================================
         TREES
         =================================================== */

      let attempts = 0;


      while (
        result.filter(
          o =>
            o.type === "tree"
        ).length < 30 &&
        attempts < 500
      ) {

        attempts++;


        const p =
          randomPosition();


        /* Keep the Star Gate approach visually clear. */
        if (
          p.z < -58 &&
          Math.abs(p.x) < 24
        ) {

          continue;

        }


        if (
          distanceToRiver(
            p.x,
            p.z
          ) <
          RIVER_WIDTH + 3
        ) {

          continue;

        }


        if (
          Math.abs(p.x) < 9 ||
          Math.abs(p.z) < 9
        ) {

          continue;

        }


        let insideHouse =
          false;


        for (
          const house of HOUSE_COLLIDERS
        ) {

          if (
            Math.abs(
              p.x - house.x
            ) <
            house.width / 2 + 2
            &&
            Math.abs(
              p.z - house.z
            ) <
            house.depth / 2 + 2
          ) {

            insideHouse =
              true;

            break;

          }

        }


        if (
          insideHouse
        ) {

          continue;

        }


        result.push({

          type: "tree",

          position: [
            p.x,
            0,
            p.z
          ],

          scale:
            0.75 +
            Math.random() *
            0.55

        });

      }


      /* ===================================================
         FLOWERS
         =================================================== */

      for (
        let i = 0;
        i < 40;
        i++
      ) {

        const p =
          randomPosition();


        /* Keep the Star Gate approach visually clear. */
        if (
          p.z < -58 &&
          Math.abs(p.x) < 24
        ) {

          continue;

        }


        if (
          distanceToRiver(
            p.x,
            p.z
          ) <
          RIVER_WIDTH + 1
        ) {

          continue;

        }


        result.push({

          type: "flower",

          position: [
            p.x,
            0,
            p.z
          ],

          color:
            [
              "#ff9ed8",
              "#ffe38b",
              "#a7b9ff",
              "#8ff0d0",
              "#d8a8ff"
            ][
              Math.floor(
                Math.random() * 5
              )
            ]

        });

      }


      /* ===================================================
         ROCKS
         =================================================== */

      for (
        let i = 0;
        i < 25;
        i++
      ) {

        const p =
          randomPosition();


        /* Keep the Star Gate approach visually clear. */
        if (
          p.z < -58 &&
          Math.abs(p.x) < 24
        ) {

          continue;

        }


        if (
          distanceToRiver(
            p.x,
            p.z
          ) <
          RIVER_WIDTH + 1
        ) {

          continue;

        }


        result.push({

          type: "rock",

          position: [
            p.x,
            0,
            p.z
          ],

          scale:
            0.5 +
            Math.random() *
            1.1

        });

      }


      return result;

    }, []);


  WORLD_DECORATION_COLLIDERS =
    objects
      .filter(
        obj =>
          obj.type === "tree" ||
          obj.type === "rock"
      )
      .map(
        obj => ({
          x: obj.position[0],
          z: obj.position[2],
          radius:
            obj.type === "tree"
              ? 0.75 * obj.scale
              : 1.15 * obj.scale
        })
      );


  return (

    <>

      {objects.map(
        (obj, index) => {

          if (
            obj.type === "tree"
          ) {

            return (

              <Tree
                key={index}
                position={
                  obj.position
                }
                scale={
                  obj.scale
                }
              />

            );

          }


          if (
            obj.type === "flower"
          ) {

            return (

              <Flower
                key={index}
                position={
                  obj.position
                }
                color={
                  obj.color
                }
              />

            );

          }


          return (

            <Rock
              key={index}
              position={
                obj.position
              }
              scale={
                obj.scale
              }
            />

          );

        }
      )}


      {/* HOUSES */}

      {HOUSE_COLLIDERS.map(
        (house, i) => (

          <House
            key={i}
            position={[
              house.x,
              0,
              house.z
            ]}
            roofColor={[
              "#7750a5",
              "#426da4",
              "#a65378"
            ][i]}
          />

        )
      )}


      {/* RUINS */}

      <Ruins />


      {/* CLIFFS */}

      {CLIFF_DATA.map(
        (cliff, i) => (

          <Cliff
            key={`cliff-${i}`}
            position={[
              cliff.x,
              0,
              cliff.z
            ]}
            scale={cliff.scale}
          />

        )
      )}


      {/* ANIMALS */}

      <Animal
        type="sheep"
        position={[
          -30,
          0,
          -30
        ]}
      />


      <Animal
        type="sheep"
        position={[
          -20,
          0,
          -35
        ]}
      />


      <Animal
        type="deer"
        position={[
          30,
          0,
          32
        ]}
      />


      <Animal
        type="bird"
        position={[
          -20,
          10,
          20
        ]}
      />


      <Animal
        type="bird"
        position={[
          20,
          12,
          -20
        ]}
      />

    </>

  );

}


/* =========================================================
   3D SPAWN EFFECT
   ========================================================= */

function SpawnEffect3D() {

  const group =
    useRef();

  const ring1 =
    useRef();

  const ring2 =
    useRef();

  const ring3 =
    useRef();

  const beamMaterial =
    useRef();

  const core =
    useRef();


  useFrame(
    ({ clock }) => {

      if (!group.current) {
        return;
      }


      const t =
        clock.elapsedTime;

      const grow =
        THREE.MathUtils.clamp(
          t / 1.15,
          0,
          1
        );

      const fade =
        1 -
        THREE.MathUtils.clamp(
          (t - 1.35) / 1.05,
          0,
          1
        );


      ring1.current.scale.setScalar(
        0.25 + grow * 3.6
      );

      ring2.current.scale.setScalar(
        0.2 + grow * 2.7
      );

      ring3.current.scale.setScalar(
        0.15 + grow * 1.9
      );

      ring1.current.rotation.z =
        t * 1.6;

      ring2.current.rotation.z =
        -t * 1.25;

      ring3.current.rotation.z =
        t * 0.9;


      if (beamMaterial.current) {
        beamMaterial.current.opacity =
          0.48 * fade;
      }


      if (core.current) {
        const pulse =
          1 + Math.sin(t * 10) * 0.12;

        core.current.scale.setScalar(
          pulse
        );
      }


      group.current.scale.y =
        0.85 + grow * 0.15;

    }
  );


  return (

    <group
      ref={group}
      position={[
        0,
        0.08,
        65
      ]}
    >

      <mesh
        ref={ring1}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            1.8,
            0.07,
            8,
            64
          ]}
        />

        <meshBasicMaterial
          color="#8befff"
          transparent
          opacity={0.85}
        />

      </mesh>


      <mesh
        ref={ring2}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            2.15,
            0.045,
            8,
            64
          ]}
        />

        <meshBasicMaterial
          color="#cba7ff"
          transparent
          opacity={0.68}
        />

      </mesh>


      <mesh
        ref={ring3}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            2.55,
            0.028,
            8,
            64
          ]}
        />

        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.58}
        />

      </mesh>


      <mesh
        position={[
          0,
          4.5,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            0.55,
            2.2,
            9,
            24,
            1,
            true
          ]}
        />

        <meshBasicMaterial
          ref={beamMaterial}
          color="#9deeff"
          transparent
          opacity={0.48}
          side={THREE.DoubleSide}
          depthWrite={false}
        />

      </mesh>


      <mesh
        ref={core}
        position={[
          0,
          0.3,
          0
        ]}
      >

        <sphereGeometry
          args={[
            0.42,
            16,
            16
          ]}
        />

        <meshBasicMaterial
          color="#e8fbff"
          transparent
          opacity={0.95}
        />

      </mesh>


      <Sparkles
        count={45}
        scale={[
          8,
          9,
          8
        ]}
        size={2.4}
        speed={1.25}
      />

    </group>

  );

}


/* =========================================================
   STAR KEY
   ========================================================= */

function StarKey({
  position,
  collected
}) {

  const group =
    useRef();


  useFrame(
    ({ clock }) => {

      if (
        !group.current ||
        collected
      ) {

        return;

      }


      const t =
        clock.elapsedTime;


      group.current.rotation.y =
        t * 0.8;


      group.current.rotation.x =
        Math.sin(t * 0.8) *
        0.15;


      group.current.position.y =
        position[1] +
        Math.sin(t * 2) *
        0.4;

    }
  );


  if (
    collected
  ) {

    return null;

  }


  return (

    <group
      ref={group}
      position={position}
    >

      <mesh>

        <octahedronGeometry
          args={[
            1.1,
            0
          ]}
        />

        <meshBasicMaterial
          color="#a9f4ff"
        />

      </mesh>


      <mesh
        rotation={[
          Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            1.7,
            0.07,
            6,
            32
          ]}
        />

        <meshBasicMaterial
          color="#ffffff"
        />

      </mesh>


      <mesh
        rotation={[
          Math.PI / 2,
          0,
          Math.PI / 3
        ]}
      >

        <torusGeometry
          args={[
            2.1,
            0.035,
            6,
            32
          ]}
        />

        <meshBasicMaterial
          color="#77dcff"
          transparent
          opacity={0.6}
        />

      </mesh>


      <Sparkles
        count={10}
        scale={[
          3.5,
          3.5,
          3.5
        ]}
        size={1.8}
        speed={0.45}
      />

    </group>

  );

}


/* =========================================================
   STAR GATE
   ========================================================= */

function StarGate({
  unlocked,
  entering
}) {

  const group =
    useRef();

  const ring1 =
    useRef();

  const ring2 =
    useRef();

  const ring3 =
    useRef();

  const core =
    useRef();


  useFrame(
    ({ clock }) => {

      if (
        !group.current
      ) {

        return;

      }


      const t =
        clock.elapsedTime;


      if (
        unlocked
      ) {

        ring1.current.rotation.z =
          t * 0.35;


        ring2.current.rotation.x =
          t * 0.45;


        ring2.current.rotation.z =
          -t * 0.25;


        ring3.current.rotation.y =
          t * 0.6;


        core.current.scale.setScalar(
          1 +
          Math.sin(t * 3) *
          0.05
        );

      }


      if (
        entering
      ) {

        group.current.scale.lerp(
          new THREE.Vector3(
            1.45,
            1.45,
            1.45
          ),
          0.035
        );

      }

    }
  );


  return (

    <group
      ref={group}
      position={GATE_POSITION}
    >

      {/* FLOATING CRYSTALS */}

      <mesh
        position={[
          -7,
          4,
          0
        ]}
      >

        <octahedronGeometry
          args={[
            1.4,
            0
          ]}
        />

        <meshBasicMaterial
          color="#76dfff"
        />

      </mesh>


      <mesh
        position={[
          7,
          4,
          0
        ]}
      >

        <octahedronGeometry
          args={[
            1.4,
            0
          ]}
        />

        <meshBasicMaterial
          color="#d4a4ff"
        />

      </mesh>


      {/* LEFT PILLAR */}

      <mesh
        position={[
          -7,
          5,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            1.35,
            1.9,
            10,
            8
          ]}
        />

        <meshStandardMaterial
          color="#536e82"
          metalness={0.75}
          roughness={0.24}
        />

      </mesh>


      {/* RIGHT PILLAR */}

      <mesh
        position={[
          7,
          5,
          0
        ]}
      >

        <cylinderGeometry
          args={[
            1.35,
            1.9,
            10,
            8
          ]}
        />

        <meshStandardMaterial
          color="#536e82"
          metalness={0.75}
          roughness={0.24}
        />

      </mesh>


      {/* TOP ARC */}

      <mesh
        position={[
          0,
          9,
          0
        ]}
      >

        <torusGeometry
          args={[
            7,
            1,
            10,
            32,
            Math.PI
          ]}
        />

        <meshStandardMaterial
          color="#6f91a6"
          metalness={0.8}
          roughness={0.2}
        />

      </mesh>


      {/* PORTAL CORE */}

      <mesh
        ref={core}
        position={[
          0,
          5,
          0
        ]}
      >

        <circleGeometry
          args={[
            5.2,
            48
          ]}
        />

        <meshBasicMaterial
          color={
            unlocked
              ? "#91edff"
              : "#182b3b"
          }
          transparent
          opacity={
            unlocked
              ? 0.34
              : 0.7
          }
          side={
            THREE.DoubleSide
          }
        />

      </mesh>


      {/* RING 1 */}

      <mesh
        ref={ring1}
        position={[
          0,
          5,
          0.3
        ]}
        rotation={[
          Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            5.9,
            0.14,
            8,
            64
          ]}
        />

        <meshBasicMaterial
          color="#8befff"
        />

      </mesh>


      {/* RING 2 */}

      <mesh
        ref={ring2}
        position={[
          0,
          5,
          0.35
        ]}
        rotation={[
          Math.PI / 2,
          0,
          0
        ]}
      >

        <torusGeometry
          args={[
            4.65,
            0.09,
            8,
            48
          ]}
        />

        <meshBasicMaterial
          color="#d6a5ff"
        />

      </mesh>


      {/* RING 3 */}

      <mesh
        ref={ring3}
        position={[
          0,
          5,
          0.4
        ]}
        rotation={[
          0,
          Math.PI / 2,
          0
        ]}
      >

        <torusGeometry
          args={[
            5.3,
            0.045,
            6,
            48
          ]}
        />

        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.75}
        />

      </mesh>


      {unlocked && (

        <>

          <Sparkles
            count={55}
            scale={[
              15,
              14,
              5
            ]}
            size={2.3}
            speed={0.8}
          />


          <Sparkles
            count={25}
            scale={[
              9,
              9,
              3
            ]}
            size={4}
            speed={1.5}
          />

        </>

      )}

    </group>

  );

}


/* =========================================================
   MINIMAP
   ========================================================= */

function Minimap({
  playerPosition,
  keyPositions,
  collectedKeys,
  gateUnlocked
}) {

  const mapSize =
    180;


  function mapX(x) {

    return (
      (x / mapSize) *
      100
    ) + 50;

  }


  function mapY(z) {

    return (
      (z / mapSize) *
      100
    ) + 50;

  }


  return (

    <div
      className="chapter3-minimap"
    >

      <div
        className="minimap-title"
      >
        STAR MAP
      </div>


      <div
        className="minimap-grid"
      >

        <div
          className="minimap-river"
        />


        {keyPositions.map(
          (key, index) => {

            if (
              collectedKeys.includes(
                index
              )
            ) {

              return null;

            }


            return (

              <div
                key={index}
                className="map-key"
                style={{
                  left:
                    `${mapX(
                      key.position[0]
                    )}%`,

                  top:
                    `${mapY(
                      key.position[2]
                    )}%`
                }}
              >

                ✦

              </div>

            );

          }
        )}


        <div
          className={
            gateUnlocked
              ? "map-gate unlocked"
              : "map-gate"
          }
          style={{
            left:
              `${mapX(
                GATE_POSITION[0]
              )}%`,

            top:
              `${mapY(
                GATE_POSITION[2]
              )}%`
          }}
        >

          ✦

        </div>


        <div
          className="map-player"
          style={{
            left:
              `${mapX(
                playerPosition.x
              )}%`,

            top:
              `${mapY(
                playerPosition.z
              )}%`
          }}
        />

      </div>

    </div>

  );

}


/* =========================================================
   CHAPTER 3
   ========================================================= */

function Chapter3({
  onComplete
}) {

  const [
    collectedKeys,
    setCollectedKeys
  ] = useState([]);


  const [
    gateUnlocked,
    setGateUnlocked
  ] = useState(false);


  const [
    message,
    setMessage
  ] = useState(
    "请寻找散落在星海中的四把钥匙"
  );


  const [
    playerPosition,
    setPlayerPosition
  ] = useState({
    x: 0,
    z: 65
  });


  const [
    enteringGate,
    setEnteringGate
  ] = useState(false);


  const [
    showGateComplete,
    setShowGateComplete
  ] = useState(false);


  const [
    showGateResponse,
    setShowGateResponse
  ] = useState(false);


  const [
    gameEnded,
    setGameEnded
  ] = useState(false);


  /* =======================================================
     REWARD STATE
     第三关专属：蓝色星星
     ======================================================= */

  const [
    showReward,
    setShowReward
  ] = useState(false);


  const [
    rewardPhase,
    setRewardPhase
  ] = useState("appear");


  const [
    showExploreHint,
    setShowExploreHint
  ] = useState(true);


  const [
    showSpawnEffect,
    setShowSpawnEffect
  ] = useState(true);


  const gateTriggered =
    useRef(false);


  /* =======================================================
     EXIT POINTER LOCK WHEN THE GAME ENDS
     ======================================================= */

  useEffect(() => {
    if (!gameEnded) return;

    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, [gameEnded]);


  /* =======================================================
     HINT + SPAWN EFFECT
     ======================================================= */

  useEffect(() => {

    const hintTimer =
      setTimeout(() => {

        setShowExploreHint(
          false
        );

      }, 5500);


    const spawnTimer =
      setTimeout(() => {

        setShowSpawnEffect(
          false
        );

      }, 2400);


    return () => {

      clearTimeout(
        hintTimer
      );

      clearTimeout(
        spawnTimer
      );

    };

  }, []);


  /* =======================================================
     KEY DATA
     ======================================================= */

  const keyPositions =
    useMemo(
      () =>
        KEY_ZONES.map(
          key => ({
            ...key,

            position: [
              key.position[0],
              key.position[1],
              key.position[2]
            ]
          })
        ),
      []
    );


  /* =======================================================
     COLLECT
     ======================================================= */

  function collectKey(
    index,
    digit
  ) {

    setCollectedKeys(
      previous => {

        if (
          previous.includes(
            index
          )
        ) {

          return previous;

        }


        const next = [
          ...previous,
          index
        ];


        setMessage(
          `发现星空钥匙「${digit}」`
        );


        if (
          next.length === 4
        ) {

          setTimeout(() => {

            setMessage(
              "四把星空钥匙已经集齐，星空之门正在等待你……"
            );


            setGateUnlocked(
              true
            );

          }, 500);

        }


        return next;

      }
    );

  }


  /* =======================================================
     ENTER GATE
     ======================================================= */

  function enterGate() {

    if (
      gateTriggered.current ||
      collectedKeys.length !== 4
    ) {

      return;

    }


    gateTriggered.current =
      true;

    /*
     * 从这一刻开始，第三关已经结束。
     * 不再允许 WASD / 鼠标继续控制玩家。
     */
    setGameEnded(true);
    setEnteringGate(true);
    setShowGateResponse(true);
    setShowGateComplete(false);

    setMessage(
      "星空之门正在回应你的呼唤……"
    );

    /*
     * 先完整播放“星空之门正在回应”过渡，
     * 再出现最终提示板。
     */
    window.setTimeout(() => {
      setShowGateResponse(false);
      setShowGateComplete(true);
    }, 1800);

  }


  /* =======================================================
     THIRD STAR REWARD
     通关后先显示提示板，点击按钮才进入蓝色星星动画
     ======================================================= */

  function startReward() {

    if (showReward) return;

    setShowGateComplete(false);
    setShowGateResponse(false);
    setEnteringGate(false);
    setShowReward(true);
    setRewardPhase("appear");

    setTimeout(() => {
      setRewardPhase("glow");
    }, 700);

    setTimeout(() => {
      setRewardPhase("burst");
    }, 1700);

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3200);
  }


  /* =======================================================
     PLAYER POSITION
     ======================================================= */

  const lastMapUpdate =
    useRef(0);


  function updatePlayer(
    x,
    z
  ) {

    const now =
      performance.now();


    if (
      now -
      lastMapUpdate.current <
      400
    ) {

      return;

    }


    lastMapUpdate.current =
      now;


    setPlayerPosition({
      x,
      z
    });

  }


  return (

    <div
      className={
        `chapter3-page ${
          enteringGate
            ? "gate-entering"
            : ""
        }`
      }
    >

      {/* =================================================
          SPAWN EFFECT
         ================================================= */}

      {showSpawnEffect && (

        <div
          className="chapter3-spawn-effect"
        >

          <div
            className="spawn-flash"
          />

          <div
            className="spawn-beam"
          />

          <div
            className="spawn-ring spawn-ring-1"
          />

          <div
            className="spawn-ring spawn-ring-2"
          />

          <div
            className="spawn-ring spawn-ring-3"
          />

          <div
            className="spawn-core"
          />


          <div
            className="spawn-particles"
          >

            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />

          </div>

        </div>

      )}


      {/* =================================================
          PASSWORD
         ================================================= */}

      <div
        className="chapter3-password"
      >

        <div
          className="password-label"
        >
          STAR PASSWORD
        </div>


        <div
          className="password-digits"
        >

          {PASSWORD.map(
            (digit, index) => {

              const found =
                collectedKeys.includes(
                  index
                );


              return (

                <span
                  key={index}
                  className={
                    found
                      ? "password-digit found"
                      : "password-digit hidden"
                  }
                >

                  {found
                    ? digit
                    : "?"}

                </span>

              );

            }
          )}

        </div>

      </div>


      {/* =================================================
          MESSAGE
         ================================================= */}

      <div
        className="chapter3-message"
      >

        {message}

      </div>


      {/* =================================================
          MINIMAP
         ================================================= */}

      <Minimap
        playerPosition={
          playerPosition
        }

        keyPositions={
          keyPositions
        }

        collectedKeys={
          collectedKeys
        }

        gateUnlocked={
          gateUnlocked
        }
      />


      {/* =================================================
          3D WORLD
         ================================================= */}

      <Canvas
        camera={{
          position: [
            0,
            PLAYER_HEIGHT,
            65
          ],

          fov: 70,

          near: 0.1,

          far: 260
        }}

        dpr={[
          0.9,
          1
        ]}

        gl={{
          antialias: false,

          powerPreference:
            "high-performance"
        }}

        onCreated={({
          camera
        }) => {

          camera.position.set(
            0,
            PLAYER_HEIGHT,
            65
          );

        }}
      >

        {/* =================================================
            SKY
           ================================================= */}

        <color
          attach="background"
          args={[
            "#06182c"
          ]}
        />


        <fog
          attach="fog"
          args={[
            "#06182c",
            70,
            190
          ]}
        />


        {/* =================================================
            LIGHTING
           ================================================= */}

        <ambientLight
          intensity={0.95}
        />


        <hemisphereLight
          skyColor="#75c8ed"
          groundColor="#173a34"
          intensity={1.05}
        />


        <directionalLight
          position={[
            -40,
            70,
            30
          ]}
          intensity={1.7}
        />


        <directionalLight
          position={[
            50,
            35,
            -60
          ]}
          intensity={0.55}
          color="#9ab8ff"
        />


        {/* =================================================
            STARS
           ================================================= */}

        <Stars
          radius={180}
          depth={90}
          count={650}
          factor={3.5}
          saturation={0}
          fade
          speed={0.18}
        />


        <Sparkles
          count={25}
          scale={[
            180,
            30,
            180
          ]}
          size={1.1}
          speed={0.12}
        />


        {/* =================================================
            WORLD
           ================================================= */}

        <Ground />

        <River />

        <DistantMountains />

        <WorldDecoration />

        <WorldLandmarks />

        <Fireflies />


        {showSpawnEffect && (
          <SpawnEffect3D />
        )}


        {/* =================================================
            KEYS
           ================================================= */}

        {keyPositions.map(
          (key, index) => (

            <StarKey
              key={index}
              position={
                key.position
              }
              collected={
                collectedKeys.includes(
                  index
                )
              }
            />

          )
        )}


        {/* =================================================
            GATE
           ================================================= */}

        <StarGate
          unlocked={
            gateUnlocked
          }

          entering={
            enteringGate
          }
        />


        {/* =================================================
            PLAYER
           ================================================= */}

        <Player
          collectedKeys={
            collectedKeys
          }

          keyPositions={
            keyPositions
          }

          onCollectKey={
            collectKey
          }

          onGateEnter={
            enterGate
          }

          onPlayerMove={
            updatePlayer
          }

          enteringGate={
            enteringGate
          }

          gameEnded={
            gameEnded
          }
        />


        {!gameEnded && (
          <PointerLockControls />
        )}

      </Canvas>


      {/* =================================================
          CROSSHAIR
         ================================================= */}

      <div
        className="chapter3-crosshair"
      >
        +
      </div>


      {/* =================================================
          CONTROLS
         ================================================= */}

      <div
        className="chapter3-controls"
      >

        <div
          className="control-group"
        >

          <div
            className="arrow-controls"
          >

            <span
              className="arrow-up"
            >
              ↑
            </span>

            <span>
              ←
            </span>

            <span>
              ↓
            </span>

            <span>
              →
            </span>

          </div>


          <small>
            移动
          </small>

        </div>


        <div
          className="control-item"
        >

          <b>
            WASD
          </b>

          <small>
            移动
          </small>

        </div>


        <div
          className="control-item"
        >

          <b>
            SHIFT
          </b>

          <small>
            奔跑
          </small>

        </div>


        <div
          className="control-item"
        >

          <b>
            SPACE
          </b>

          <small>
            跳跃
          </small>

        </div>

      </div>


      {/* =================================================
          IN-GAME EXPLORE HINT
         ================================================= */}

      {showExploreHint && (

        <div
          className="chapter3-explore-hint"
        >

          <div
            className="explore-hint-title"
          >
            星海迷境
          </div>


          <div
            className="explore-hint-text"
          >
            探索星海，寻找散落各处的数字星钥
          </div>


          <div
            className="explore-hint-sub"
          >
            靠近星空钥匙即可收集
          </div>

        </div>

      )}


      {/* =================================================
          GATE READY
         ================================================= */}

      {gateUnlocked &&
        !enteringGate && (

          <div
            className="chapter3-gate-ready"
          >

            <div
              className="gate-ready-symbol"
            >
              ✦
            </div>


            <p>
              STAR GATE AWAKENED
            </p>


            <span>
              四把钥匙已经集齐 · 前往星空之门
            </span>

          </div>

        )}


      {/* =================================================
          ENTERING
         ================================================= */}

      {showGateResponse && (

        <div
          className="chapter3-entering"
        >

          <div
            className="entering-ring"
          >
            ✦
          </div>


          <p>
            星海正在回应你的呼唤……
          </p>

        </div>

      )}


      {/* =================================================
          THIRD CHAPTER COMPLETE BOARD
         ================================================= */}

      {showGateComplete && !showReward && (

        <div className="chapter3-complete-overlay">

          <div className="chapter3-complete-card">

            <div className="chapter3-complete-symbol">✦</div>

            <div className="chapter3-complete-tag">STAR GATE COMPLETE</div>

            <h2>星海密码已解开</h2>

            <p>
              四把星空钥匙，
              <br />
              已经带你走到了星海的尽头。
            </p>

            <div className="chapter3-complete-divider">✦</div>

            <button
              className="chapter3-complete-button"
              onClick={startReward}
            >
              获得第三颗星星
            </button>

          </div>

        </div>

      )}


      {/* =================================================
          THIRD STAR REWARD
         ================================================= */}

      {showReward && (

        <div
          className={`chapter3-reward-overlay chapter3-reward-${rewardPhase}`}
        >

          <div className="chapter3-reward-particle-field">
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                key={index}
                className="chapter3-reward-particle"
                style={{ "--i": index }}
              >
                ✦
              </span>
            ))}
          </div>

          <div className="chapter3-reward-rings">
            <div className="chapter3-reward-ring chapter3-ring-one"></div>
            <div className="chapter3-reward-ring chapter3-ring-two"></div>
            <div className="chapter3-reward-ring chapter3-ring-three"></div>
          </div>

          <div className="chapter3-reward-blue-star">
            <div className="chapter3-reward-star-halo"></div>
            <div className="chapter3-reward-star-rays"></div>
            <div className="chapter3-reward-star-core">★</div>
            <div className="chapter3-reward-star-shine">✦</div>
          </div>

          <div className="chapter3-reward-text">
            <div className="chapter3-reward-small-text">第三颗星愿</div>
            <h2>蓝色星星已获得</h2>
            <p>
              最后一份星海能量，<br />
              正在为终点点亮星光。
            </p>
          </div>

          <div className="chapter3-reward-flash"></div>

        </div>

      )}

    </div>

  );

}


export default Chapter3;