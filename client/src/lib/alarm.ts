let audioCtx: AudioContext | null = null;

export function playAlarm(volume: number): void {
  if (!audioCtx) audioCtx = new AudioContext();

  const now = audioCtx.currentTime;
  const master = audioCtx.createGain();
  master.gain.value = volume * 0.3;
  master.connect(audioCtx.destination);

  // Play a gentle two-tone chime, repeated 3 times
  const notes = [523.25, 659.25]; // C5, E5
  for (let rep = 0; rep < 3; rep++) {
    const offset = rep * 0.45;
    for (let i = 0; i < notes.length; i++) {
      const osc = audioCtx.createOscillator();
      const env = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.value = notes[i];

      const start = now + offset + i * 0.12;
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(1, start + 0.03);
      env.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

      osc.connect(env);
      env.connect(master);
      osc.start(start);
      osc.stop(start + 0.35);
    }
  }
}
