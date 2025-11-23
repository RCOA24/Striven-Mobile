import {
    Check,
    Flame,
    Footprints,
    MapPin,
    Pause,
    Play,
    RotateCcw,
    Target,
    Timer
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import LicenseModal from '../components/LicenseModal';
import StepDetector from '../utils/StepDetector';

// --- NEW IMPORTS FOR BACKGROUND ---
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

// Define a task name
const LOCATION_TASK_NAME = 'background-location-task';

// Define the task (It doesn't need to do anything, just existing keeps the app alive)
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) return;
  // We don't actually need to process the location here, 
  // just having this running keeps the JS thread alive for the StepDetector.
});

// --- 1. Step Counter Ring (Unchanged) ---
const StepCounter = ({ steps, goal }) => {
    const percentage = Math.min((steps / goal) * 100, 100);
    const size = 280;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
    return (
      <View className="items-center justify-center py-8">
        <View style={{ width: size, height: size, position: 'relative' }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#34D399" stopOpacity="1" />
                <Stop offset="1" stopColor="#10B981" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#27272a"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#grad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Footprints size={32} color="#10B981" style={{marginBottom: 8}} />
            <Text className="text-5xl font-bold text-white">{steps.toLocaleString()}</Text>
            <Text className="text-zinc-400 text-sm font-bold uppercase mt-1">steps</Text>
          </View>
        </View>
      </View>
    );
  };

// --- 2. Metric Card (Unchanged) ---
const MetricCard = ({ icon: Icon, label, value, bgColor }) => (
  <View className="flex-1 bg-zinc-900 p-4 rounded-3xl border border-zinc-800 mx-1 justify-between min-h-[120px]">
    <View className={`self-start p-2 rounded-full ${bgColor} bg-opacity-20`}>
      <Icon size={20} color="white" />
    </View>
    <View>
      <Text className="text-xl font-bold text-white">{value}</Text>
      <Text className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{label}</Text>
    </View>
  </View>
);

// --- 3. Control Button (Unchanged) ---
const ControlButton = ({ onClick, children, variant = 'primary', icon: Icon, disabled, isMain }) => {
    let bgClass = "bg-emerald-500";
    let textClass = "text-black";
  
    if (variant === 'secondary') { bgClass = "bg-zinc-800"; textClass = "text-white"; }
    if (variant === 'danger') { bgClass = "bg-red-500/20"; textClass = "text-red-500"; }
    if (variant === 'success') { bgClass = "bg-blue-500"; textClass = "text-white"; }
  
    return (
      <TouchableOpacity
        onPress={onClick}
        disabled={disabled}
        className={`${bgClass} ${isMain ? 'py-4' : 'py-4 flex-1'} rounded-full flex-row items-center justify-center space-x-2 ${disabled ? 'opacity-50' : ''}`}
      >
        {Icon && <Icon size={isMain ? 24 : 20} color={variant === 'primary' ? 'black' : variant === 'danger' ? '#ef4444' : 'white'} />}
        <Text className={`${textClass} font-bold ${isMain ? 'text-lg' : 'text-sm'} ml-2`}>{children}</Text>
      </TouchableOpacity>
    );
  };

// --- 4. Main Dashboard Component ---
const TrackerScreen = ({ navigation }) => {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const detectorRef = useRef(null);
  const dailyGoal = 10000;

  // Setup Permissions and Detector
  useEffect(() => {
    const setup = async () => {
        // 1. Request Permissions
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (fgStatus !== 'granted' || bgStatus !== 'granted') {
            Alert.alert("Permissions needed", "Background location is required to keep the step counter running when the screen is off.");
        }
    };

    setup();

    detectorRef.current = new StepDetector((stepCount) => {
      setSteps((prev) => prev + stepCount);
    });

    return () => {
      stopBackgroundUpdates(); // Cleanup on unmount
      if (detectorRef.current) detectorRef.current.stop();
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setSeconds((sec) => sec + 1);
      }, 1000);
    } else if (!isTracking && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused, seconds]);

  // --- Helper Functions for Background ---

  const startBackgroundUpdates = async () => {
    // Start Location Updates -> This keeps the App Awake in Background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!hasStarted) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50, // Update every 50 meters
            deferredUpdatesInterval: 1000, // Minimum time between updates
            foregroundService: {
                notificationTitle: "Striven is tracking",
                notificationBody: "Step counting active in background",
                notificationColor: "#10B981",
            },
        });
    }
  };

  const stopBackgroundUpdates = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  // --- Logic Handlers ---

  const handleStart = async () => {
    try {
      // Start the standard Step Detector
      await detectorRef.current.start();
      
      // Start the Background Service to keep the thread alive
      await startBackgroundUpdates();

      setIsTracking(true);
      setIsPaused(false);
    } catch (error) {
      Alert.alert("Error", "Could not start tracking: " + error.message);
    }
  };

  const handlePause = async () => {
    detectorRef.current.stop();
    await stopBackgroundUpdates(); // Stop background service to save battery
    setIsPaused(true);
  };

  const handleResume = async () => {
    await detectorRef.current.start();
    await startBackgroundUpdates();
    setIsPaused(false);
  };

  const handleFinish = async () => {
    detectorRef.current.stop();
    await stopBackgroundUpdates();
    
    setIsTracking(false);
    setIsPaused(false);
    Alert.alert("Great Job!", `You completed ${steps} steps.`);
  };

  const handleReset = async () => {
    detectorRef.current.stop();
    await stopBackgroundUpdates();
    detectorRef.current.fullReset();
    
    setSteps(0);
    setSeconds(0);
    setIsTracking(false);
    setIsPaused(false);
  };

  // --- Calculations (Unchanged) ---
  const distanceKm = ((steps * 0.762) / 1000).toFixed(2);
  const caloriesBurned = (steps * 0.04).toFixed(0);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-bold text-white">Striven</Text>
            <View className="w-8 h-8 bg-zinc-800 rounded-full items-center justify-center">
              <View className={`w-2 h-2 rounded-full ${isTracking && !isPaused ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
            </View>
          </View>

          <StepCounter steps={steps} goal={dailyGoal} />

          <View className="flex-row justify-between mb-6">
            <MetricCard icon={MapPin} label="Distance" value={`${distanceKm}km`} bgColor="bg-cyan-500" />
            <MetricCard icon={Flame} label="Kcal" value={caloriesBurned} bgColor="bg-rose-500" />
            <MetricCard icon={Timer} label="Time" value={formatTime(seconds)} bgColor="bg-orange-500" />
          </View>

          <View className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mb-6">
            <View className="flex-row justify-between mb-3">
              <View className="flex-row items-center space-x-2">
                <Target size={18} color="#10b981" />
                <Text className="text-zinc-400 font-bold text-sm ml-2">Daily Goal</Text>
              </View>
              <Text className="text-white font-bold">
                {Math.min((steps / dailyGoal) * 100, 100).toFixed(0)}%
              </Text>
            </View>
            <View className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <View 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${Math.min((steps / dailyGoal) * 100, 100)}%` }} 
              />
            </View>
          </View>

          <View className="space-y-3 mb-6">
            {!isTracking ? (
              <ControlButton onClick={handleStart} isMain icon={Play} variant="primary">
                Start Workout
              </ControlButton>
            ) : (
              <View>
                {isPaused ? (
                  <ControlButton onClick={handleResume} isMain icon={Play} variant="primary">
                    Resume
                  </ControlButton>
                ) : (
                  <ControlButton onClick={handlePause} isMain icon={Pause} variant="secondary">
                    Pause
                  </ControlButton>
                )}
                <View className="flex-row space-x-3 mt-3">
                  <ControlButton onClick={handleFinish} variant="success" icon={Check}>
                    Finish
                  </ControlButton>
                  <ControlButton onClick={handleReset} variant="danger" icon={RotateCcw}>
                    Reset
                  </ControlButton>
                </View>
              </View>
            )}
          </View>

          <View className="items-center mt-4">
            <TouchableOpacity onPress={() => setShowLicense(true)} className="bg-zinc-900/50 px-6 py-4 rounded-xl items-center w-full border border-zinc-800">
               <Text className="text-white font-bold mb-1">Striven Mobile</Text>
               <Text className="text-emerald-500 text-xs mb-2">License & Credits</Text>
               <Text className="text-zinc-600 text-[10px]">Privacy-First Fitness Tracker</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <LicenseModal isOpen={showLicense} onClose={() => setShowLicense(false)} />
    </SafeAreaView>
  );
};

export default TrackerScreen;