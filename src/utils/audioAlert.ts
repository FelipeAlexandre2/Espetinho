/**
 * Native Web Audio API chime tone for new order notification.
 * Works offline, requires no external mp3 files, and produces an instant pleasant bell.
 */
export function playOrderAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();

    // First tone: 659.25 Hz (E5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.25);

    // Second tone: 880 Hz (A5) for high-pitch pleasant completion
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.45);
      } catch (e) {
        // Ignore minor audio context timing errors
      }
    }, 140);
  } catch (err) {
    console.warn('AudioContext unavailable or user gesture required:', err);
  }
}
