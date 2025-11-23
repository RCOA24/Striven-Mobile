// src/utils/StepDetector.js
import { Accelerometer } from 'expo-sensors';

class StepDetector {
  constructor(onStep, threshold = 12) {
    this.onStep = onStep;
    // Note: Original code used m/s^2. 
    // expo-sensors returns Gs (1G = 9.81m/s^2).
    // We will convert inputs to m/s^2 to preserve your original logic/thresholds.
    this.threshold = threshold; 
    
    this.lastStepTime = 0;
    this.stepTimeout = 250; 
    this.maxStepTimeout = 2000; 
    this.accelerationHistory = [];
    this.maxHistoryLength = 10;
    
    // Advanced filtering
    this.baselineAcceleration = 9.81; // Earth's gravity in m/s^2
    this.peakThreshold = this.threshold;
    this.valleyThreshold = -this.threshold;
    
    // Step validation
    this.isWalking = false;
    this.consecutivePeaks = 0;
    
    // Calibration
    this.calibrationSamples = [];
    this.isCalibrated = false;
    this.calibrationCount = 0;
    this.maxCalibrationSamples = 50;
    
    // Idle tracking
    this.lastProcessTime = 0;
    
    // Sensor references
    this.subscription = null;
    this.isRunning = false;
  }

  // Start step detection
  async start() {
    if (this.isRunning) {
      console.log('Step detector already running');
      return;
    }

    try {
      // Check permissions
      const { status } = await Accelerometer.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Accelerometer permission denied');
      }

      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Accelerometer not available on this device');
      }

      console.log('Starting Accelerometer via expo-sensors');
      
      // Set update interval to ~16ms (approx 60Hz to match original Web API frequency)
      Accelerometer.setUpdateInterval(16);

      this.subscription = Accelerometer.addListener(data => {
        // expo-sensors returns data in Gs (1.0 = earth gravity)
        // We multiply by 9.81 to convert to m/s^2 so your original math works
        const GRAVITY = 9.81;
        this.processAcceleration(
          data.x * GRAVITY, 
          data.y * GRAVITY, 
          data.z * GRAVITY
        );
      });

      this.isRunning = true;
      console.log('Step detector started');

    } catch (error) {
      console.error('Failed to start step detector:', error);
      throw error;
    }
  }

  // Stop step detection
  stop() {
    if (!this.isRunning) return;

    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    this.isRunning = false;
    console.log('Step detector stopped');
  }

  // --- CORE LOGIC (Unchanged from PWA) ---

  // Auto-calibration for device-specific sensitivity
  calibrate(x, y, z) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.calibrationSamples.push(magnitude);
    this.calibrationCount++;

    if (this.calibrationCount >= this.maxCalibrationSamples) {
      const avg = this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
      const variance = this.calibrationSamples.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.calibrationSamples.length;
      const stdDev = Math.sqrt(variance);
      
      // Adjust threshold based on device characteristics
      this.baselineAcceleration = avg;
      this.threshold = Math.max(1.5, stdDev * 2);
      this.isCalibrated = true;
      
      console.log('StepDetector calibrated:', { baseline: avg.toFixed(2), threshold: this.threshold.toFixed(2) });
    }
  }

  // Apply low-pass filter to reduce noise
  lowPassFilter(current, previous, alpha = 0.8) {
    return previous + alpha * (current - previous);
  }

  // Detect if motion pattern matches walking/running - more lenient
  isValidStepPattern() {
    if (this.accelerationHistory.length < 5) return true; 
    
    const recent = this.accelerationHistory.slice(-5);
    const variations = [];
    
    for (let i = 1; i < recent.length; i++) {
      variations.push(Math.abs(recent[i] - recent[i - 1]));
    }
    
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    
    return avgVariation > 0.3 && avgVariation < 10;
  }

  processAcceleration(x, y, z) {
    const now = Date.now();
    
    // Clear history if device was idle
    if (this.lastProcessTime > 0 && now - this.lastProcessTime > this.maxStepTimeout) {
      // console.log('Idle period detected, clearing acceleration history');
      this.accelerationHistory = [];
    }
    this.lastProcessTime = now;
    
    // Auto-calibrate on first samples
    if (!this.isCalibrated && this.calibrationCount < this.maxCalibrationSamples) {
      this.calibrate(x, y, z);
      return;
    }

    // Calculate magnitude
    const rawMagnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Remove gravity baseline
    const magnitude = Math.abs(rawMagnitude - this.baselineAcceleration);
    
    // Apply low-pass filter
    const filteredMagnitude = this.accelerationHistory.length > 0
      ? this.lowPassFilter(magnitude, this.accelerationHistory[this.accelerationHistory.length - 1])
      : magnitude;

    // Add to history
    this.accelerationHistory.push(filteredMagnitude);
    if (this.accelerationHistory.length > this.maxHistoryLength) {
      this.accelerationHistory.shift();
    }

    // Need at least 4 data points
    if (this.accelerationHistory.length < 4) return;

    // Get recent values for peak detection
    const len = this.accelerationHistory.length;
    const current = this.accelerationHistory[len - 1];
    const previous = this.accelerationHistory[len - 2];
    const beforePrevious = this.accelerationHistory[len - 3];
    const beforeBeforePrevious = this.accelerationHistory[len - 4];

    // Detect peak (step)
    const isPeak = previous > current && 
                   previous > beforePrevious && 
                   previous > beforeBeforePrevious &&
                   previous > this.threshold;

    if (isPeak) {
      const timeSinceLastStep = now - this.lastStepTime;
      
      const isFirstStep = this.lastStepTime === 0;
      const isAfterIdle = !this.isWalking;
      
      const isValidTiming = timeSinceLastStep > this.stepTimeout && 
                           (timeSinceLastStep < this.maxStepTimeout || isFirstStep || isAfterIdle);
      
      const isValidPattern = this.isValidStepPattern();
      
      if (isValidTiming && isValidPattern) {
        this.lastStepTime = now;
        this.consecutivePeaks++;
        this.isWalking = true;
        this.onStep(1); 
        // console.log(`Step detected! Mag: ${previous.toFixed(2)}`);
      }
    }

    // Reset walking state
    if (now - this.lastStepTime > this.maxStepTimeout && this.isWalking) {
      console.log('Walking state reset due to inactivity');
      this.isWalking = false;
      this.consecutivePeaks = 0;
    }
  }

  setActivityMode(mode) {
    switch (mode) {
      case 'walking':
        this.threshold = 1.5;
        this.stepTimeout = 400;
        this.maxStepTimeout = 2000;
        break;
      case 'running':
        this.threshold = 2.5;
        this.stepTimeout = 200;
        this.maxStepTimeout = 1000;
        break;
      case 'hiking':
        this.threshold = 2.0;
        this.stepTimeout = 500;
        this.maxStepTimeout = 3000;
        break;
      default:
        this.threshold = 1.8;
        this.stepTimeout = 250;
        this.maxStepTimeout = 2000;
    }
  }

  getStats() {
    return {
      isCalibrated: this.isCalibrated,
      threshold: this.threshold.toFixed(2),
      baseline: this.baselineAcceleration.toFixed(2),
      isWalking: this.isWalking,
      consecutivePeaks: this.consecutivePeaks,
      historyLength: this.accelerationHistory.length,
      isRunning: this.isRunning
    };
  }

  reset() {
    this.accelerationHistory = [];
    this.lastStepTime = 0;
    this.consecutivePeaks = 0;
    this.isWalking = false;
    this.lastProcessTime = 0;
  }

  fullReset() {
    this.reset();
    this.calibrationSamples = [];
    this.isCalibrated = false;
    this.calibrationCount = 0;
    this.baselineAcceleration = 9.81;
  }
}

export default StepDetector;