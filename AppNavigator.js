import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import Home from './src/screens/Home';
import SearchResult from './src/screens/SearchResult';
import Filter from './src/screens/Filter';
import ListingDetails from './src/screens/ListingDetails';
import Checkout from './src/screens/Checkout';
import Chats from './src/screens/Chats';
import ChatRoom from './src/screens/ChatRoom';
import TenantFinder from './src/screens/TenantFinder';
import ListNewProperty from './src/screens/ListNewProperty';
import ListedProperties from './src/screens/ListedProperties';
import UserDashboard from './src/screens/UserDashboard';
import UserProfile from './src/screens/UserProfile';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="SearchResult" component={SearchResult} />
      <Stack.Screen name="Filter" component={Filter} />
      <Stack.Screen name="ListingDetails" component={ListingDetails} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="ChatRoom" component={ChatRoom} />
      <Stack.Screen name="TenantFinder" component={TenantFinder} />
      <Stack.Screen name="ListNewProperty" component={ListNewProperty} />
      <Stack.Screen name="ListedProperties" component={ListedProperties} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Homescreen':
              iconName = 'home';
              break;
            case 'Chats':
              iconName = 'chat';
              break;
            case 'UserDashboard':
              iconName = 'dashboard';
              break;
            case 'UserProfile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00ADEF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Chats" component={Chats} />
      <Tab.Screen name="UserDashboard" component={UserDashboard} />
      <Tab.Screen name="UserProfile" component={UserProfile} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Register' }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
