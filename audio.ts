
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
const audioCtx = new AudioContextClass();

export const resumeAudioContext = () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playTypewriterClick = () => {
  resumeAudioContext();

  const t = audioCtx.currentTime;
  
  // 1. The "Thock" (Body of the sound)
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(300, t);
  oscillator.frequency.exponentialRampToValueAtTime(50, t + 0.08);

  gainNode.gain.setValueAtTime(0.4, t);
  gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(t + 0.08);
  
  // 2. The "Click" (High frequency mechanical latch)
  const clickOsc = audioCtx.createOscillator();
  const clickGain = audioCtx.createGain();
  
  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(2000, t);
  clickOsc.frequency.exponentialRampToValueAtTime(500, t + 0.02);
  
  clickGain.gain.setValueAtTime(0.05, t);
  clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
  
  clickOsc.connect(clickGain);
  clickGain.connect(audioCtx.destination);
  
  clickOsc.start();
  clickOsc.stop(t + 0.02);
};
