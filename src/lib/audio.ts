// Audio utility for Pomodoro timer notifications

export function requestNotificationPermission() {
  try {
    if (typeof window === 'undefined') return;
    
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  } catch (error) {
    console.log('Request notification permission failed:', error);
  }
}

export function showNotification(title: string, body: string) {
  try {
    if (typeof window === 'undefined') return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/next.svg',
        badge: '/next.svg',
      });
    }
  } catch (error) {
    console.log('Notification failed:', error);
  }
}

export function playNotificationSound() {
  try {
    // Check if Web Audio API is supported
    if (typeof window === 'undefined' || !window.AudioContext) {
      console.log('Web Audio API not supported');
      return;
    }

    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Audio notification failed:', error);
  }
}

export function playBreakSound() {
  try {
    // Check if Web Audio API is supported
    if (typeof window === 'undefined' || !window.AudioContext) {
      console.log('Web Audio API not supported');
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play a more pleasant sound for breaks
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  } catch (error) {
    console.log('Break sound failed:', error);
  }
}
