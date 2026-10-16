// Notification System Abstraction
// Designed to be swapped with Firebase Cloud Messaging (FCM) or Web Push in production.
// Includes realistic Web Audio pleasant alert chime and in-app toasts.

class NotificationService {
  constructor() {
    this.audioContext = null;
  }

  playAlertSound() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioContext.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.35);
    } catch (e) {
      // Audio playback can be blocked until user gesture, ignore gracefully
    }
  }

  sendPharmacyNotification(pharmacyId, request) {
    this.playAlertSound();
    return {
      success: true,
      notificationId: `notif_${Date.now()}`,
      pharmacyId,
      title: 'Nouvelle demande',
      body: `${request.medicineName} ${request.dosage || ''} - Patient à ${request.patientDistance || 'proximité'}`,
      timestamp: Date.now()
    };
  }
}

export const notificationService = new NotificationService();
