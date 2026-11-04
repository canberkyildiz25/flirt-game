import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui';
import { color, font, space, type } from '../theme';

export default function AgeGateScreen() {
  const confirmAdult = useGameStore((s) => s.confirmAdult);
  const [declined, setDeclined] = useState(false);

  return (
    <View style={styles.root}>
      <Text style={styles.logo}>FlirtGame</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>18+</Text>
      </View>
      {declined ? (
        <Text style={type.body}>Bu oyun yetişkinlere göre. Başka zaman görüşürüz.</Text>
      ) : (
        <>
          <Text style={styles.title}>Kartlar masada. Önce bir soru.</Text>
          <Text style={[type.body, styles.body]}>
            Karakterlerin hepsi kurgusal ve 18 yaşından büyük. Sohbetlere yapay zekâ cevap verir. Devam etmek için 18 yaşından büyük olmalısın.
          </Text>
          <Button label="18 yaşından büyüğüm" onPress={confirmAdult} />
          <Button label="Değilim" variant="ghost" onPress={() => setDeclined(true)} style={{ marginTop: space.md }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ink, padding: space.xl, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { fontFamily: font.display, fontSize: 18, color: color.red, marginBottom: space.xxl },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: color.cream,
    transform: [{ rotate: '-4deg' }],
    marginBottom: space.xl,
  },
  badgeText: { fontFamily: font.display, fontSize: 40, color: color.butter },
  title: { ...type.title, marginBottom: space.md },
  body: { marginBottom: space.xxl },
});
