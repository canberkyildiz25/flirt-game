import { Character, RelationshipStage } from '../types';

const STAGE_ORDER: RelationshipStage[] = [
  'stranger', 'acquaintance', 'friend', 'crush', 'romantic', 'lover',
];

export function getStageAvatar(character: Character): string {
  if (!character.stageAvatars) return character.avatar;
  const { stageAvatars, stage } = character;

  // Mevcut stage'in avatarı varsa kullan
  if (stageAvatars[stage]) return stageAvatars[stage]!;

  // Yoksa en yakın önceki stage'in avatarını bul
  const idx = STAGE_ORDER.indexOf(stage);
  for (let i = idx - 1; i >= 0; i--) {
    const s = STAGE_ORDER[i];
    if (stageAvatars[s]) return stageAvatars[s]!;
  }

  return character.avatar;
}
