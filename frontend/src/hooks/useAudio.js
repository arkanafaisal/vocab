import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_PATHS = {
  correct: "/sounds/correct.wav",
  wrong: "/sounds/wrong.wav",
  normal: "/sounds/bgm-normal.wav",
  medium: "/sounds/bgm-fire-medium.wav",
  intense: "/sounds/bgm-fire-intense.wav"
};

export function useAudio(streak) {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("vocab_muted") === "true");
  const [volume, setVolumeState] = useState(() => {
    const saved = parseFloat(localStorage.getItem("vocab_volume"));
    return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 1;
  });
  const isMutedRef = useRef(isMuted);
  const volumeRef = useRef(volume);
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const bgmGainRef = useRef(null);
  const sfxGainRef = useRef(null);
  const buffersRef = useRef({});
  const loadingRef = useRef({});
  const bgmSourceRef = useRef(null);
  const currentBgmKeyRef = useRef(null);
  const unlockedRef = useRef(false);

  const bgmKey = streak >= 10 ? "intense" : streak >= 5 ? "medium" : "normal";
  const bgmKeyRef = useRef(bgmKey);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    bgmKeyRef.current = bgmKey;
  }, [bgmKey]);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      const bgmGain = ctx.createGain();
      const sfxGain = ctx.createGain();

      master.gain.value = isMutedRef.current ? 0 : volumeRef.current;
      bgmGain.gain.value = 0.55;
      sfxGain.gain.value = 1;

      bgmGain.connect(master);
      sfxGain.connect(master);
      master.connect(ctx.destination);

      ctxRef.current = ctx;
      masterGainRef.current = master;
      bgmGainRef.current = bgmGain;
      sfxGainRef.current = sfxGain;
    }

    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }

    return ctxRef.current;
  }, []);

  const loadBuffer = useCallback(async (key) => {
    if (buffersRef.current[key]) return buffersRef.current[key];
    if (loadingRef.current[key]) return loadingRef.current[key];

    const ctx = ensureContext();
    if (!ctx) return null;

    loadingRef.current[key] = fetch(SOUND_PATHS[key])
      .then(res => res.arrayBuffer())
      .then(arr => ctx.decodeAudioData(arr))
      .then(decoded => {
        buffersRef.current[key] = decoded;
        return decoded;
      })
      .catch(() => null);

    return loadingRef.current[key];
  }, [ensureContext]);

  const startBgm = useCallback(async (key) => {
    if (!unlockedRef.current || isMutedRef.current) return;
    if (currentBgmKeyRef.current === key && bgmSourceRef.current) return;

    const ctx = ensureContext();
    if (!ctx) return;

    const buffer = await loadBuffer(key);
    if (!buffer || isMutedRef.current || bgmKeyRef.current !== key) return;

    if (bgmSourceRef.current) {
      try {
        bgmSourceRef.current.stop();
        bgmSourceRef.current.disconnect();
      } catch {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(bgmGainRef.current);
    source.start(0);

    bgmSourceRef.current = source;
    currentBgmKeyRef.current = key;
  }, [ensureContext, loadBuffer]);

  useEffect(() => {
    const unlock = () => {
      unlockedRef.current = true;
      ensureContext();
      loadBuffer("correct");
      loadBuffer("wrong");
      if (!isMutedRef.current) {
        startBgm(bgmKeyRef.current);
      }
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureContext, loadBuffer, startBgm]);

  useEffect(() => {
    if (unlockedRef.current && !isMuted) {
      startBgm(bgmKey);
    }
  }, [bgmKey, isMuted, startBgm]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (ctx && master) {
      master.gain.setTargetAtTime(isMuted ? 0 : volume, ctx.currentTime, 0.05);
    }
  }, [isMuted, volume]);

  useEffect(() => {
    return () => {
      if (bgmSourceRef.current) {
        try {
          bgmSourceRef.current.stop();
        } catch {}
      }
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playSfx = useCallback(async (key) => {
    if (isMutedRef.current) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const buffer = await loadBuffer(key);
    if (!buffer || isMutedRef.current) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(sfxGainRef.current);
    source.start(0);
  }, [ensureContext, loadBuffer]);

  const toggleMute = useCallback(() => {
    unlockedRef.current = true;
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem("vocab_muted", String(next));
      if (!next) {
        ensureContext();
        setTimeout(() => startBgm(bgmKeyRef.current), 0);
      }
      return next;
    });
  }, [ensureContext, startBgm]);

  const setVolume = useCallback((nextVal) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVal)));
    unlockedRef.current = true;
    setVolumeState(clamped);
    localStorage.setItem("vocab_volume", String(clamped));
    if (clamped === 0) {
      setIsMuted(true);
      localStorage.setItem("vocab_muted", "true");
    } else if (isMutedRef.current) {
      setIsMuted(false);
      localStorage.setItem("vocab_muted", "false");
      ensureContext();
      setTimeout(() => startBgm(bgmKeyRef.current), 0);
    }
  }, [ensureContext, startBgm]);

  return { isMuted, toggleMute, volume, setVolume, playSfx };
}

