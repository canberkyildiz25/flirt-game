import { Character } from '../types';
import { supabase } from './supabase';

// Web'de aynı origin; mobilde yayındaki adres EXPO_PUBLIC_API_URL ile verilir.
const API_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/chat`;

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiReply {
  text: string;
  affectionChange: number;
}

export async function getAiResponse(
  character: Character,
  history: AiMessage[],
  userMessage: string
): Promise<AiReply> {
  const auth = (await supabase?.auth.getSession())?.data;
  const token = auth?.session?.access_token;
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      characterId: character.id,
      stage: character.stage,
      affection: character.affection,
      history,
      message: userMessage,
    }),
  });

  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    const text =
      body.error === 'daily_limit'
        ? 'Bugünlük mesaj hakkın doldu. Yarın kaldığımız yerden devam ederiz.'
        : 'Biraz yavaşlayalım, bir dakika sonra yine yaz.';
    return { text, affectionChange: 0 };
  }
  if (response.status === 401) return { text: 'Sohbet etmek için giriş yapman gerekiyor.', affectionChange: 0 };
  if (!response.ok) throw new Error(`AI API hatası (${response.status})`);

  const data = await response.json();
  return {
    text: data.reply ?? 'Buna cevap veremem, başka bir şeyden konuşalım.',
    affectionChange: data.affectionChange ?? 0,
  };
}
