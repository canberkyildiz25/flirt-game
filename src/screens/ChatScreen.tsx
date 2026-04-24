import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList, Dialogue, DialogueOption } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');

type Route = RouteProp<RootStackParamList, 'Chat'>;
type Nav = StackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatMessage {
  id: string;
  text: string;
  isPlayer: boolean;
  affectionChange?: number;
}

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { characterId } = route.params;

  const character = useGameStore((s) => s.characters.find((c) => c.id === characterId));
  const addAffection = useGameStore((s) => s.addAffection);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(
    character?.dialogues[0] || null
  );
  const [showOptions, setShowOptions] = useState(true);
  const [affectionToast, setAffectionToast] = useState<number | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  if (!character) return null;

  const allDialogues = character.dialogues;

  function showToast(amount: number) {
    setAffectionToast(amount);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setAffectionToast(null));
  }

  function handleOptionPress(option: DialogueOption) {
    if (!currentDialogue) return;

    const playerMsg: ChatMessage = {
      id: `p-${Date.now()}`,
      text: option.text,
      isPlayer: true,
      affectionChange: option.affectionChange,
    };

    const responseMsg: ChatMessage = {
      id: `r-${Date.now() + 1}`,
      text: option.response,
      isPlayer: false,
    };

    setMessages((prev) => [...prev, playerMsg, responseMsg]);
    setShowOptions(false);
    addAffection(characterId, option.affectionChange);
    showToast(option.affectionChange);

    setTimeout(() => {
      if (option.nextDialogueId) {
        const next = allDialogues.find((d) => d.id === option.nextDialogueId);
        if (next) {
          const charMsg: ChatMessage = {
            id: `c-${Date.now() + 2}`,
            text: next.message,
            isPlayer: false,
          };
          setMessages((prev) => [...prev, charMsg]);
          setCurrentDialogue(next);
          setShowOptions(true);
        }
      } else {
        setCurrentDialogue(null);
        setShowOptions(false);
      }
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 800);

    scrollRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <LinearGradient colors={['#0a0015', '#1a0030']} style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a0030', '#0a0015']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Image source={{ uri: character.avatar }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{character.name}</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: character.color }]} />
            <Text style={styles.onlineText}>Çevrimiçi</Text>
          </View>
        </View>
        <View style={styles.affectionBadge}>
          <Text style={styles.affectionEmoji}>💝</Text>
          <Text style={[styles.affectionBadgeText, { color: character.color }]}>
            {character.affection}
          </Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Initial message */}
        {messages.length === 0 && currentDialogue && (
          <View style={styles.bubbleRow}>
            <Image source={{ uri: character.avatar }} style={styles.smallAvatar} />
            <View style={[styles.bubble, styles.characterBubble, { borderColor: character.color + '44' }]}>
              <Text style={styles.bubbleText}>{currentDialogue.message}</Text>
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubbleRow,
              msg.isPlayer && styles.playerRow,
            ]}
          >
            {!msg.isPlayer && (
              <Image source={{ uri: character.avatar }} style={styles.smallAvatar} />
            )}
            <View
              style={[
                styles.bubble,
                msg.isPlayer
                  ? [styles.playerBubble, { backgroundColor: character.color }]
                  : [styles.characterBubble, { borderColor: character.color + '44' }],
              ]}
            >
              <Text style={styles.bubbleText}>{msg.text}</Text>
              {msg.isPlayer && msg.affectionChange !== undefined && msg.affectionChange !== 0 && (
                <Text style={styles.affectionHint}>
                  {msg.affectionChange > 0 ? `+${msg.affectionChange} 💕` : `${msg.affectionChange} 💔`}
                </Text>
              )}
            </View>
          </View>
        ))}

        {!currentDialogue && messages.length > 0 && (
          <View style={styles.endMessage}>
            <Text style={styles.endText}>Konuşma bitti. İlişki durumun: </Text>
            <Text style={[styles.endStage, { color: character.color }]}>
              {character.affection >= 80 ? 'Romantik' :
               character.affection >= 60 ? 'Crush' :
               character.affection >= 40 ? 'Arkadaş' :
               character.affection >= 20 ? 'Tanıdık' : 'Yabancı'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Affection Toast */}
      {affectionToast !== null && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={[
            styles.toastText,
            { color: affectionToast > 0 ? '#ff69b4' : '#ff4444' }
          ]}>
            {affectionToast > 0 ? `+${affectionToast} 💕` : `${affectionToast} 💔`}
          </Text>
        </Animated.View>
      )}

      {/* Options */}
      {showOptions && currentDialogue && (
        <View style={styles.optionsContainer}>
          {currentDialogue.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                style={styles.optionGradient}
              >
                <Text style={styles.optionText}>{option.text}</Text>
                <View style={[
                  styles.optionHint,
                  { backgroundColor: option.affectionChange > 0 ? '#ff69b422' : option.affectionChange < 0 ? '#ff444422' : '#ffffff11' }
                ]}>
                  <Text style={{ fontSize: 10, color: option.affectionChange > 0 ? '#ff69b4' : option.affectionChange < 0 ? '#ff4444' : '#888' }}>
                    {option.affectionChange > 0 ? `+${option.affectionChange}` : option.affectionChange < 0 ? `${option.affectionChange}` : '±0'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!showOptions && !currentDialogue && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => navigation.navigate('CharacterProfile', { characterId })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[character.color + 'aa', character.color + '66']}
              style={styles.optionGradient}
            >
              <Text style={styles.optionText}>Profile Dön 👤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  affectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  affectionEmoji: {
    fontSize: 14,
  },
  affectionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: width * 0.85,
  },
  playerRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubble: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    maxWidth: width * 0.7,
  },
  characterBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  playerBubble: {
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  affectionHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'right',
  },
  endMessage: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  endText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  endStage: {
    fontSize: 18,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastText: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionsContainer: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  optionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  optionText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  optionHint: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
});
