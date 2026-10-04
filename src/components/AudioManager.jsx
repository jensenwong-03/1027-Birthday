import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

/* ================= BGM ================= */

import mainBgm from "../assets/audio/bgm/main.wav";
import chapter1Bgm from "../assets/audio/bgm/chapter1.wav";
import chapter2Bgm from "../assets/audio/bgm/chapter2.wav";
import chapter3Bgm from "../assets/audio/bgm/chapter3.wav";
import endingBgm from "../assets/audio/bgm/ending.wav";

/* ================= SFX ================= */

import clickSfx from "../assets/audio2/sfx/click.wav";
import starSfx from "../assets/audio2/sfx/star.wav";
import starSpecialSfx from "../assets/audio2/sfx/star-special.wav";
import hitSfx from "../assets/audio2/sfx/hit.wav";
import successSfx from "../assets/audio2/sfx/success.wav";
import magicSfx from "../assets/audio2/sfx/magic.wav";
import whooshSfx from "../assets/audio2/sfx/whoosh.wav";
import gateSfx from "../assets/audio2/sfx/gate.wav";
import letterSfx from "../assets/audio2/sfx/letter.wav";
import finalChimeSfx from "../assets/audio2/sfx/final-chime.wav";

/* ================= MAP ================= */

const BGM = {
  main: mainBgm,
  chapter1: chapter1Bgm,
  chapter2: chapter2Bgm,
  chapter3: chapter3Bgm,
  ending: endingBgm
};

const SFX = {
  click: clickSfx,
  star: starSfx,
  "star-special": starSpecialSfx,
  hit: hitSfx,
  success: successSfx,
  magic: magicSfx,
  whoosh: whooshSfx,
  gate: gateSfx,
  letter: letterSfx,
  "final-chime": finalChimeSfx
};

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const currentRef = useRef(null);
  const fadeRef = useRef(null);
  const sfxPool = useRef({});

  /*
   * When true, no background track may start or change.
   * This is specifically used while the birthday video is playing.
   */
  const musicLockedRef = useRef(false);

  const [audioStarted, setAudioStarted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.32);
  const [sfxVolume, setSfxVolume] = useState(0.55);
  const [muted, setMuted] = useState(false);

  /* ================= START AUDIO ================= */

  const startAudio = useCallback(() => {
    setAudioStarted(true);

    Object.entries(SFX).forEach(([key, src]) => {
      if (sfxPool.current[key]) return;

      const audio = new Audio(src);
      audio.preload = "auto";
      sfxPool.current[key] = audio;
    });
  }, []);

  /* ================= FADE ================= */

  const fade = useCallback(
    (
      audio,
      from,
      to,
      duration = 1000,
      callback
    ) => {
      if (!audio) return;

      const start = performance.now();

      const animate = (now) => {
        if (!audio) return;

        const progress = Math.min(
          (now - start) / duration,
          1
        );

        audio.volume =
          from +
          (to - from) *
            progress;

        if (progress < 1) {
          fadeRef.current =
            requestAnimationFrame(animate);
        } else {
          callback && callback();
        }
      };

      fadeRef.current =
        requestAnimationFrame(animate);
    },
    []
  );

  /* ================= PLAY MUSIC ================= */

  const playMusic = useCallback(
    async (name) => {
      if (!audioStarted) return;
      if (musicLockedRef.current) return;
      if (!BGM[name]) return;

      const oldAudio = currentRef.current;

      if (
        oldAudio &&
        oldAudio.dataset.track === name &&
        !oldAudio.paused
      ) {
        return;
      }

      const newAudio =
        new Audio(BGM[name]);

      newAudio.loop = true;
      newAudio.dataset.track = name;

      // 不使用0避免浏览器忽略播放
      newAudio.volume = 0.01;

      try {
        await newAudio.play();
      } catch (error) {
        console.log(
          "Music play blocked:",
          name,
          error
        );
        return;
      }

      /*
       * Video may have opened while play() was resolving.
       * Never let that race re-enable BGM during video playback.
       */
      if (musicLockedRef.current) {
        newAudio.volume = 0;
        newAudio.pause();
        return;
      }

      // 停止之前fade动画
      if (fadeRef.current) {
        cancelAnimationFrame(
          fadeRef.current
        );
      }

      // 新音乐进入
      fade(
        newAudio,
        0.01,
        muted ? 0 : musicVolume,
        1200
      );

      // 旧音乐退出
      if (oldAudio) {
        fade(
          oldAudio,
          oldAudio.volume,
          0,
          1200,
          () => {
            oldAudio.pause();
            oldAudio.currentTime = 0;
          }
        );
      }

      currentRef.current =
        newAudio;
    },
    [
      audioStarted,
      musicVolume,
      muted,
      fade
    ]
  );

  /* ================= PAUSE FOR VIDEO ================= */

  const pauseMusic = useCallback(() => {
    musicLockedRef.current = true;

    if (fadeRef.current) {
      cancelAnimationFrame(
        fadeRef.current
      );
      fadeRef.current = null;
    }

    const audio =
      currentRef.current;

    if (!audio) return;

    try {
      audio.volume = 0;
      audio.pause();
    } catch {}
  }, []);

  /* ================= RESUME AFTER VIDEO ================= */

  const resumeMusic = useCallback(async () => {
    musicLockedRef.current = false;

    const audio =
      currentRef.current;

    if (!audio) return;

    try {
      audio.volume =
        muted ? 0 : musicVolume;

      await audio.play();
    } catch (error) {
      console.log(
        "Music resume blocked:",
        error
      );
    }
  }, [musicVolume, muted]);

  /* ================= STOP ================= */

  const stopMusic = useCallback(() => {
    const audio =
      currentRef.current;

    if (!audio) return;

    if (fadeRef.current) {
      cancelAnimationFrame(
        fadeRef.current
      );
      fadeRef.current = null;
    }

    fade(
      audio,
      audio.volume,
      0,
      800,
      () => {
        audio.pause();
        audio.currentTime = 0;
        currentRef.current = null;
      }
    );
  }, [fade]);

  /* ================= SFX ================= */

  const playSFX = useCallback(
    (
      name,
      multiplier = 1
    ) => {
      if (!audioStarted) return;
      if (muted) return;
      if (!SFX[name]) return;

      const base =
        sfxPool.current[name];

      if (!base) return;

      const audio =
        base.cloneNode();

      audio.volume = Math.min(
        1,
        sfxVolume * multiplier
      );

      audio.play()
        .catch(() => {});
    },
    [
      audioStarted,
      muted,
      sfxVolume
    ]
  );

  /* ================= VOLUME ================= */

  useEffect(() => {
    if (!currentRef.current) return;

    if (musicLockedRef.current) {
      currentRef.current.volume = 0;
      return;
    }

    currentRef.current.volume =
      muted
        ? 0
        : musicVolume;
  }, [
    musicVolume,
    muted
  ]);

  /* ================= VIDEO EVENTS ================= */

  useEffect(() => {
    const handleVideoStart = () => {
      pauseMusic();
    };

    const handleVideoEnd = () => {
      resumeMusic();
    };

    window.addEventListener(
      "birthday-video-start",
      handleVideoStart
    );

    window.addEventListener(
      "birthday-video-end",
      handleVideoEnd
    );

    return () => {
      window.removeEventListener(
        "birthday-video-start",
        handleVideoStart
      );

      window.removeEventListener(
        "birthday-video-end",
        handleVideoEnd
      );
    };
  }, [
    pauseMusic,
    resumeMusic
  ]);

  /* ================= CLEAN ================= */

  useEffect(() => {
    return () => {
      if (currentRef.current) {
        currentRef.current.pause();
      }

      if (fadeRef.current) {
        cancelAnimationFrame(
          fadeRef.current
        );
      }
    };
  }, []);

  const toggleMute = () =>
    setMuted((v) => !v);

  return (
    <AudioContext.Provider
      value={{
        startAudio,
        playMusic,
        pauseMusic,
        resumeMusic,
        stopMusic,
        playSFX,
        musicVolume,
        setMusicVolume,
        sfxVolume,
        setSfxVolume,
        muted,
        toggleMute,
        audioStarted
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx =
    useContext(AudioContext);

  if (!ctx) {
    throw new Error(
      "useAudio must be inside AudioProvider"
    );
  }

  return ctx;
}
