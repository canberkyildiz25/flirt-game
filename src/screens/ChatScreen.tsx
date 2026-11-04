import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList, StoredMessage } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { getAiResponse, AiMessage } from '../services/aiService';
import Portrait from '../components/Portrait';

const OPENING_CUE = '(Oyuncu sohbeti az önce açtı. İlk mesajı karakter olarak sen yaz.)';

type Route = RouteProp<RootStackParamList, 'Chat'>;
type Nav = StackNavigationProp<RootStackParamList, 'Chat'>;

type ChatMessage = StoredMessage;

// Hata mesajları kaydedilmez; bir sonraki açılışta görünmesinler.
const isError = (m: ChatMessage) => m.id.startsWith('ai-err');

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { characterId } = route.params;

  const character = useGameStore((s) => s.characters.find((c) => c.id === characterId));
  const addAffection = useGameStore((s) => s.addAffection);
  const earnCoins = useGameStore((s) => s.earnCoins);
  const setLastPlayed = useGameStore((s) => s.setLastPlayed);
  const saved = useGameStore((s) => s.conversations[characterId]);
  const saveConversation = useGameStore((s) => s.saveConversation);
  const clearConversation = useGameStore((s) => s.clearConversation);

  // Bu karakteri son oynanan olarak işaretle
  React.useEffect(() => {
    setLastPlayed(characterId);
    if (saved?.messages.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    } else {
      openConversation();
    }
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(saved?.messages ?? []);
  const [affectionToast, setAffectionToast] = useState<number | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<AiMessage[]>(saved?.history ?? []);

  React.useEffect(() => {
    const kept = messages.filter((m) => !isError(m));
    if (kept.length) saveConversation(characterId, { messages: kept, history: aiHistory });
  }, [messages, aiHistory]);

  if (!character) return null;

  function showToast(amount: number) {
    setAffectionToast(amount);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setAffectionToast(null));
  }

  function restartConversation() {
    if (isAiLoading) return;
    clearConversation(characterId);
    setMessages([]);
    setAiHistory([]);
    openConversation();
  }

  // İlk mesajı da model yazar; bu yönlendirme ekranda görünmez.
  async function openConversation() {
    if (!character) return;
    setIsAiLoading(true);
    try {
      const { text } = await getAiResponse(character, [], OPENING_CUE);
      setMessages([{ id: `ai-r-${Date.now()}`, text, isPlayer: false }]);
      setAiHistory([
        { role: 'user', content: OPENING_CUE },
        { role: 'assistant', content: text },
      ]);
    } catch (e) {
      setMessages([{ id: `ai-err-${Date.now()}`, text: '⚠️ Bağlanılamadı, sen yazarak başlayabilirsin.', isPlayer: false }]);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleAiSend() {
    const text = inputText.trim();
    if (!text || isAiLoading || !character) return;

    const playerMsg: ChatMessage = {
      id: `ai-p-${Date.now()}`,
      text,
      isPlayer: true,
    };
    setMessages((prev) => [...prev, playerMsg]);
    setInputText('');
    setIsAiLoading(true);
    scrollRef.current?.scrollToEnd({ animated: true });

    const newHistory: AiMessage[] = [...aiHistory, { role: 'user', content: text }];

    try {
      const { text: aiText, affectionChange } = await getAiResponse(character, aiHistory, text);
      const aiMsg: ChatMessage = {
        id: `ai-r-${Date.now()}`,
        text: aiText,
        isPlayer: false,
      };
      // Oyuncunun balonunda mesajın nasıl karşılandığı görünsün.
      setMessages((prev) => [
        ...prev.map((m) => (m.id === playerMsg.id ? { ...m, affectionChange } : m)),
        aiMsg,
      ]);
      setAiHistory([...newHistory, { role: 'assistant', content: aiText }]);
      addAffection(characterId, affectionChange);
      if (affectionChange !== 0) showToast(affectionChange);
      earnCoins(3);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        text: '⚠️ Bir hata oluştu, tekrar dene.',
        isPlayer: false,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0a0015', '#1a0030']} style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#1a0030', '#0a0015']} style={styles.header}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Conversations'))}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Portrait character={character} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{character.name}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: character.color }]} />
              <Text style={styles.onlineText}>
                Yapay zekâ ile sohbet
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={restartConversation}
            accessibilityRole="button"
            accessibilityLabel="Sohbeti baştan başlat"
            style={styles.restartBtn}
          >
            <Text style={styles.restartText}>Baştan başla</Text>
          </TouchableOpacity>
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
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubbleRow, msg.isPlayer && styles.playerRow]}
            >
              {!msg.isPlayer && (
                <Portrait character={character} style={styles.smallAvatar} />
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

          {isAiLoading && (
            <View style={styles.bubbleRow}>
              <Portrait character={character} style={styles.smallAvatar} />
              <View style={[styles.bubble, styles.characterBubble, { borderColor: character.color + '44' }]}>
                <ActivityIndicator size="small" color={character.color} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Affection Toast */}
        {affectionToast !== null && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={[
              styles.toastText,
              { color: affectionToast > 0 ? '#ff69b4' : '#ff4444' },
            ]}>
              {affectionToast > 0 ? `+${affectionToast} 💕` : `${affectionToast} 💔`}
            </Text>
          </Animated.View>
        )}

        {/* AI Free Chat Input */}
        {(
          <View style={styles.aiInputContainer}>
            <TextInput
              style={[styles.aiInput, { borderColor: character.color + '66' }]}
              placeholder={`${character.name}'e bir şey yaz...`}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAiSend}
              returnKeyType="send"
              multiline={false}
              editable={!isAiLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: character.color }]}
              onPress={handleAiSend}
              disabled={isAiLoading || !inputText.trim()}
              activeOpacity={0.8}
            >
              {isAiLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendIcon}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
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
  restartBtn: {
    paddingHorizontal: 10,
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  restartText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
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
    maxWidth: '85%',
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
    flexShrink: 1,
    padding: 12,
    borderRadius: 16,
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
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  aiInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 2,
  },
});
