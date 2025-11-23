import { Text, View } from 'react-native';

// 1. Reusable Layout Component (Background & Padding)
const ScreenLayout = ({ title, children }) => (
  <View className="flex-1 bg-black pt-12 px-4">
    <Text className="text-emerald-400 text-3xl font-bold mb-6">{title}</Text>
    <View className="flex-1 items-center justify-center bg-zinc-900/50 rounded-xl mb-4 border border-zinc-800">
      {children || <Text className="text-zinc-500">Content coming soon...</Text>}
    </View>
  </View>
);

// 2. The 5 Individual Screens
export const TrackerScreen = () => <ScreenLayout title="Tracker" />;
export const ActivityScreen = () => <ScreenLayout title="Activity" />;
export const StatsScreen = () => <ScreenLayout title="Stats" />;
export const ExercisesScreen = () => <ScreenLayout title="Exercises" />;
export const ProfileScreen = () => <ScreenLayout title="Profile" />;