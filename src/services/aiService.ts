import { Character } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STAGE_TONE: Record<string, string> = {
  stranger:     'Henüz yeni tanışıyorsunuz. Biraz mesafeli ve kibar ol ama ilgi çekici.',
  acquaintance: 'Birbirinizi az çok tanıyorsunuz. Daha rahat ve samimi konuş, ara sıra hafif flört edebilirsin.',
  friend:       'İyi arkadaşsınız. Sıcak, şakacı ve açık konuş. Flört belirginleşebilir.',
  crush:        'Karşılıklı çekimin farkındasınız. Açıkça flört et, ima dolu ve romantik konuş.',
  romantic:     'Romantik bir ilişkiniz var. Samimi, tutkulu ve yakın konuş. Duygularını belli et.',
  lover:        'Sevgililersiniz. Çok yakın, sevecen ve tutku dolu konuş. Sarılma, öpme gibi sözel ifadeler kullanabilirsin.',
};

function buildSystemPrompt(character: Character): string {
  const tone = STAGE_TONE[character.stage] ?? STAGE_TONE.stranger;

  return `Sen ${character.name} adlı bir karaktersin. Bir flört oyununda karşındaki kişiyle sohbet ediyorsun.

Senin hakkında:
- Yaşın: ${character.age}
- Mesleğin: ${character.occupation}
- Kişiliğin: ${character.personality}
- Hobilerin: ${character.hobbies.join(', ')}
- Biyografin: ${character.bio}

Şu anki ilişki durumu: "${character.stage}" — Sevgi puanı: ${character.affection}/100
Ton talimatı: ${tone}

Genel kurallar:
- Her zaman ${character.name} gibi konuş, rolden çıkma, yapay zeka olduğunu asla söyleme
- Türkçe cevap ver
- Kısa ve doğal cevaplar ver (1-4 cümle)
- Emojileri doğal kullan, aşırıya kaçma
- Oyuncunun adını bilmiyorsun, "sen" diye hitap et`;
}

export async function getAiResponse(
  character: Character,
  history: AiMessage[],
  userMessage: string,
  apiKey: string
): Promise<string> {
  const messages: AiMessage[] = [...history, { role: 'user', content: userMessage }];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: buildSystemPrompt(character),
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API hatası (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}
