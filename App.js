import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// FIX: Standard import (Works with version 0.460.0)
import { Activity, Dumbbell, Footprints, TrendingUp, User } from 'lucide-react-native';

// Import your screens
import {
    ActivityScreen,
    ExercisesScreen,
    ProfileScreen,
    StatsScreen,
    TrackerScreen
} from './src/pages/Screens';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { 
              backgroundColor: '#18181b', // zinc-900
              borderTopColor: '#27272a', // zinc-800
              borderTopWidth: 1,
              height: 65,
              paddingTop: 10,
              paddingBottom: 10
            },
            tabBarActiveTintColor: '#10b981', // emerald-500
            tabBarInactiveTintColor: '#71717a', // zinc-500
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '500',
              marginTop: 4
            }
          }}
        >
          <Tab.Screen 
            name="Tracker" 
            component={TrackerScreen} 
            options={{
              tabBarLabel: 'Tracker',
              tabBarIcon: ({ color, size }) => <Footprints color={color} size={24} />,
            }}
          />

          <Tab.Screen 
            name="Activity" 
            component={ActivityScreen} 
            options={{
              tabBarLabel: 'Activity',
              tabBarIcon: ({ color, size }) => <Activity color={color} size={24} />,
            }}
          />

          <Tab.Screen 
            name="Stats" 
            component={StatsScreen} 
            options={{
              tabBarLabel: 'Stats',
              tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={24} />,
            }}
          />

          <Tab.Screen 
            name="Exercises" 
            component={ExercisesScreen} 
            options={{
              tabBarLabel: 'Exercises',
              tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={24} />,
            }}
          />

          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color, size }) => <User color={color} size={24} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}