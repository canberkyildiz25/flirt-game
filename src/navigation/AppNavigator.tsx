import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import CharactersScreen from '../screens/CharactersScreen';
import CharacterProfileScreen from '../screens/CharacterProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import AuthScreen from '../screens/AuthScreen';
import CreateCharacterScreen from '../screens/CreateCharacterScreen';
import { navigationRef } from './ref';

const Stack = createStackNavigator<RootStackParamList>();

// Tek sütunluk ekranlar geniş pencerede ortada okunaklı genişlikte durur.
function centered(Screen: React.ComponentType) {
  return function Centered() {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0015' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
          <Screen />
        </View>
      </View>
    );
  };
}

const Home = centered(HomeScreen);
const Profile = centered(CharacterProfileScreen);
const Chat = centered(ChatScreen);
const Auth = centered(AuthScreen);
const Create = centered(CreateCharacterScreen);

interface Props {
  onRouteChange: (route?: keyof RootStackParamList) => void;
}

export default function AppNavigator({ onRouteChange }: Props) {
  const report = () => onRouteChange(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList);

  return (
    <NavigationContainer ref={navigationRef} onReady={report} onStateChange={report}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0a0015' },
        }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Characters" component={CharactersScreen} />
        <Stack.Screen name="Conversations" component={ConversationsScreen} />
        <Stack.Screen name="CharacterProfile" component={Profile} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Auth" component={Auth} />
        <Stack.Screen name="Create" component={Create} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
