import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList, StoredMessage } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { getAiResponse, AiMessage } from '../services/aiService';
import Portrait from '../components/Portrait';
import { useAuth } from '../store/authStore';
import { supabase } from '../services/supabase';
import Icon from '../components/Icon';
import { Button, HeartMeter, IconButton, STAGE_LABELS } from '../components/ui';
import { color, font, radius, space, type } from '../theme';

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
  const session = useAuth((s) => s.session);
  const authReady = useAuth((s) => s.ready);
  // Sohbet modele gittiği için giriş ister; Supabase kurulu değilse eski davranış sürer.
  const needsLogin = !!supabase && authReady && !session;

  // Bu karakteri son oynanan olarak işaretle
  React.useEffect(() => {
    setLastPlayed(characterId);
    if (saved?.messages.length) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  React.useEffect(() => {
    if (authReady && !needsLogin && !messages.length && !isAiLoading) openConversation();
  }, [authReady, needsLogin]);

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
      setMessages([{ id: `ai-err-${Date.now()}`, text: 'Bağlanılamadı, sen yazarak başlayabilirsin.', isPlayer: false }]);
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
        text: 'Mesaj gitmedi, tekrar dene.',
        isPlayer: false,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Conversations'));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <IconButton icon="back" label="Geri" onPress={back} />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${character.name} profili`}
          onPress={() => navigation.navigate('CharacterProfile', { characterId: character.id })}
          style={styles.who}
        >
          <Portrait character={character} style={styles.headerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{character.name}</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.headerStage}>{STAGE_LABELS[character.stage]}</Text>
              <HeartMeter value={character.affection} size={12} />
            </View>
          </View>
        </Pressable>
        <IconButton icon="restart" label="Sohbeti baştan başlat" onPress={restartConversation} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.disclosure}>{character.name} kurgusal bir karakter; cevaplarını yapay zekâ yazar.</Text>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.row, msg.isPlayer && styles.rowPlayer]}>
            {!msg.isPlayer && <Portrait character={character} style={styles.smallAvatar} />}
            <View
              style={[
                styles.bubble,
                msg.isPlayer ? styles.bubblePlayer : styles.bubbleCharacter,
                isError(msg) && styles.bubbleError,
              ]}
            >
              <Text style={[styles.bubbleText, msg.isPlayer && styles.bubbleTextPlayer]}>{msg.text}</Text>
              {msg.isPlayer && !!msg.affectionChange && (
                <View style={styles.delta}>
                  <Icon name={msg.affectionChange > 0 ? 'heart' : 'heartOutline'} size={11} color={color.butterInk} />
                  <Text style={styles.deltaText}>
                    {msg.affectionChange > 0 ? `+${msg.affectionChange}` : msg.affectionChange}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {isAiLoading && (
          <View style={styles.row}>
            <Portrait character={character} style={styles.smallAvatar} />
            <View style={[styles.bubble, styles.bubbleCharacter]}>
              <ActivityIndicator size="small" color={color.creamDim} />
            </View>
          </View>
        )}
      </ScrollView>

      {affectionToast !== null && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Icon name={affectionToast > 0 ? 'heart' : 'heartOutline'} size={16} color={affectionToast > 0 ? color.red : color.creamDim} />
          <Text style={styles.toastText}>{affectionToast > 0 ? `+${affectionToast}` : affectionToast}</Text>
        </Animated.View>
      )}

      {needsLogin ? (
        <View style={styles.loginPrompt}>
          <Text style={type.bodyStrong}>{character.name} seni bekliyor.</Text>
          <Text style={[type.small, { textAlign: 'center' }]}>Yazmak için giriş yap ya da ücretsiz kayıt ol. O çoktan hazır.</Text>
          <View style={styles.loginButtons}>
            <Button label="Giriş yap" compact onPress={() => navigation.navigate('Auth', { mode: 'login' })} />
            <Button label="Kayıt ol" compact variant="ghost" onPress={() => navigation.navigate('Auth', { mode: 'signup' })} />
          </View>
        </View>
      ) : (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={messages.some((m) => m.isPlayer) ? 'Cevabını yaz…' : 'İlk adımı at…'}
            placeholderTextColor={color.creamFaint}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAiSend}
            returnKeyType="send"
            editable={!isAiLoading}
            maxLength={1000}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gönder"
            onPress={handleAiSend}
            disabled={isAiLoading || !inputText.trim()}
            style={({ pressed }) => [
              styles.send,
              (isAiLoading || !inputText.trim()) && { opacity: 0.4 },
              pressed && { transform: [{ translateY: 1 }] },
            ]}
          >
            <Icon name="send" size={20} color={color.cream} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: 48,
    paddingBottom: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, minWidth: 0 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: color.cream },
  headerName: { fontFamily: font.displayMedium, fontSize: 16, color: color.cream },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  headerStage: { fontFamily: font.bold, fontSize: 12, color: color.butter },
  messages: { flex: 1 },
  messagesContent: { padding: space.lg, gap: space.md },
  disclosure: { ...type.small, textAlign: 'center', marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, maxWidth: '85%' },
  rowPlayer: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  smallAvatar: { width: 30, height: 30, borderRadius: 15 },
  bubble: { flexShrink: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  bubbleCharacter: { backgroundColor: color.ink2, borderWidth: 1.5, borderColor: color.lineStrong, borderBottomLeftRadius: 6 },
  bubblePlayer: { backgroundColor: color.butter, borderBottomRightRadius: 6 },
  bubbleError: { borderColor: color.danger },
  bubbleText: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.cream },
  bubbleTextPlayer: { color: color.butterInk },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end', marginTop: 4 },
  deltaText: { fontFamily: font.bold, fontSize: 11, color: color.butterInk },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: color.cream,
  },
  toastText: { fontFamily: font.display, fontSize: 14, color: color.ink },
  loginPrompt: {
    padding: space.xl,
    gap: space.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  loginButtons: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    backgroundColor: color.ink2,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    color: color.cream,
    fontFamily: font.body,
    fontSize: 15,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
