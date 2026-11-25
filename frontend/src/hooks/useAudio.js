import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_PATHS = {
  correct: "/sounds/correct.wav",
  wrong: "/sounds/wrong.wav",
  normal: "/sounds/bgm-normal.wav",
  fireLoop: "/sounds/freesound_community-fire-burning-loop-6135.mp3",
  fireCrackle: "/sounds/virtualzero-campfire-burning-wood-ambience-hd-375866.mp3"
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
  const overlayGainRef = useRef(null);
  const sfxGainRef = useRef(null);
  const buffersRef = useRef({});
  const loadingRef = useRef({});
  const bgmSourceRef = useRef(null);
  const overlaySourceRef = useRef(null);
  const currentBaseKeyRef = useRef(null);
  const unlockedRef = useRef(false);

  const tier = streak >= 10 ? "intense" : streak >= 5 ? "medium" : "normal";
  const tierRef = useRef(tier);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    tierRef.current = tier;
  }, [tier]);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      const bgmGain = ctx.createGain();
      const overlayGain = ctx.createGain();
      const sfxGain = ctx.createGain();

      master.gain.value = isMutedRef.current ? 0 : volumeRef.current;
      bgmGain.gain.value = 0.55;
      overlayGain.gain.value = 0.55;
      sfxGain.gain.value = 1;

      bgmGain.connect(master);
      overlayGain.connect(master);
      sfxGain.connect(master);
      master.connect(ctx.destination);

      ctxRef.current = ctx;
      masterGainRef.current = master;
      bgmGainRef.current = bgmGain;
      overlayGainRef.current = overlayGain;
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

  const stopBgm = useCallback(() => {
    if (bgmSourceRef.current) {
      try {
        bgmSourceRef.current.stop();
        bgmSourceRef.current.disconnect();
      } catch {}
      bgmSourceRef.current = null;
    }
    currentBaseKeyRef.current = null;
  }, []);

  const stopOverlay = useCallback(() => {
    if (overlaySourceRef.current) {
      try {
        overlaySourceRef.current.stop();
        overlaySourceRef.current.disconnect();
      } catch {}
      overlaySourceRef.current = null;
    }
  }, []);

  const syncBgm = useCallback(async (targetTier) => {
    if (!unlockedRef.current || isMutedRef.current) return;

    const ctx = ensureContext();
    if (!ctx) return;

    if (targetTier !== "intense") {
      stopOverlay();
    }

    const baseKey = targetTier === "normal" ? "normal" : "fireLoop";
    const targetBgmGain = targetTier === "intense" ? 0.72 : 0.55;
    bgmGainRef.current.gain.setTargetAtTime(targetBgmGain, ctx.currentTime, 0.1);

    if (currentBaseKeyRef.current !== baseKey || !bgmSourceRef.current) {
      const buffer = await loadBuffer(baseKey);
      if (!buffer || isMutedRef.current || tierRef.current !== targetTier) return;

      stopBgm();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(bgmGainRef.current);
      source.start(0);

      bgmSourceRef.current = source;
      currentBaseKeyRef.current = baseKey;
    }

    if (targetTier === "intense" && !overlaySourceRef.current) {
      const crackleBuf = await loadBuffer("fireCrackle");
      if (!crackleBuf || isMutedRef.current || tierRef.current !== "intense") return;

      stopOverlay();

      const overlay = ctx.createBufferSource();
      overlay.buffer = crackleBuf;
      overlay.loop = true;
      overlay.connect(overlayGainRef.current);
      overlay.start(0);
      overlaySourceRef.current = overlay;
    }
  }, [ensureContext, loadBuffer, stopBgm, stopOverlay]);

  useEffect(() => {
    const unlock = () => {
      unlockedRef.current = true;
      ensureContext();
      loadBuffer("correct");
      loadBuffer("wrong");
      if (!isMutedRef.current) {
        syncBgm(tierRef.current);
      }
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureContext, loadBuffer, syncBgm]);

  useEffect(() => {
    if (unlockedRef.current && !isMuted) {
      syncBgm(tier);
    }
  }, [tier, isMuted, syncBgm]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (ctx && master) {
      master.gain.setTargetAtTime(isMuted ? 0 : volume, ctx.currentTime, 0.05);
    }
  }, [isMuted, volume]);

  useEffect(() => {
    return () => {
      stopBgm();
      stopOverlay();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, [stopBgm, stopOverlay]);

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
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    localStorage.setItem("vocab_muted", String(next));
    if (!next) {
      ensureContext();
      syncBgm(tierRef.current);
    }
  }, [ensureContext, syncBgm]);

  const setVolume = useCallback((nextVal) => {
    const clamped = Math.max(0, Math.min(1, Number(nextVal)));
    unlockedRef.current = true;
    volumeRef.current = clamped;
    setVolumeState(clamped);
    localStorage.setItem("vocab_volume", String(clamped));
    if (clamped === 0) {
      isMutedRef.current = true;
      setIsMuted(true);
      localStorage.setItem("vocab_muted", "true");
    } else if (isMutedRef.current) {
      isMutedRef.current = false;
      setIsMuted(false);
      localStorage.setItem("vocab_muted", "false");
      ensureContext();
      syncBgm(tierRef.current);
    }
  }, [ensureContext, syncBgm]);

  return { isMuted, toggleMute, volume, setVolume, playSfx };
}
