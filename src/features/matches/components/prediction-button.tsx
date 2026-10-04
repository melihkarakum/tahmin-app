import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

/**
 * new    : henüz tahmin yok      -> "Tahmini Kaydet"
 * dirty  : skor değiştirildi     -> "Tahmini Güncelle"
 * saving : kaydediliyor
 * saved  : kayıtlı tahminle aynı -> "Kaydedildi · 14:32"
 * error  : kaydedilemedi         -> kısa hata, dokununca tekrar dener
 */
export type PredictionButtonState = 'new' | 'dirty' | 'saving' | 'saved' | 'error';

type PredictionButtonProps = {
  state: PredictionButtonState;
  /** Kayıt saati ("14:32"). */
  savedTime?: string;
  errorText?: string;
  onPress: () => void;
};

const useNativeDriver = Platform.OS !== 'web';

/**
 * Maç kartındaki tahmin düğmesi. Her durumda aynı boyuttadır; durum değişince kart büyüyüp
 * küçülmez, ekrandaki öğeler kaymaz. Basınca küçülür; kaydedilince yeşil dolgu söner ve onay
 * işareti zıplayarak çıkar; hata olursa düğme sallanır. Animasyonlar yalnızca transform/opaklık.
 */
export function PredictionButton({ state, savedTime, errorText, onPress }: PredictionButtonProps) {
  const [anim] = useState(() => ({
    press: new Animated.Value(1),
    pop: new Animated.Value(1),
    // 1: yeşil dolgu gizli (kaydedildi / hata), 0: görünür.
    calm: new Animated.Value(state === 'saved' || state === 'error' ? 1 : 0),
    check: new Animated.Value(state === 'saved' ? 1 : 0),
    shake: new Animated.Value(0),
  }));
  const previous = useRef(state);

  useEffect(() => {
    const prev = previous.current;
    previous.current = state;
    if (prev === state) return;

    const calm = state === 'saved' || state === 'error';
    Animated.timing(anim.calm, { toValue: calm ? 1 : 0, duration: 220, useNativeDriver }).start();

    if (state === 'saved') {
      if (prev === 'saving') {
        anim.check.setValue(0);
        Animated.parallel([
          Animated.spring(anim.check, { toValue: 1, friction: 4, tension: 160, useNativeDriver }),
          Animated.sequence([
            Animated.timing(anim.pop, { toValue: 1.04, duration: 110, useNativeDriver }),
            Animated.spring(anim.pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver }),
          ]),
        ]).start();
      } else {
        anim.check.setValue(1);
      }
    }

    if (state === 'error' && prev === 'saving') {
      anim.shake.setValue(0);
      Animated.sequence(
        [-8, 8, -6, 6, -3, 0].map((toValue) =>
          Animated.timing(anim.shake, { toValue, duration: 45, useNativeDriver }),
        ),
      ).start();
    }
  }, [state, anim]);

  const interactive = state !== 'saving' && state !== 'saved';
  const pressIn = () => {
    Animated.spring(anim.press, { toValue: 0.96, speed: 50, bounciness: 0, useNativeDriver }).start();
  };
  const pressOut = () => {
    Animated.spring(anim.press, { toValue: 1, speed: 24, bounciness: 8, useNativeDriver }).start();
  };

  const accessibilityLabel = {
    new: 'Tahmini kaydet',
    dirty: 'Tahmini güncelle',
    saving: 'Kaydediliyor',
    saved: savedTime ? `Tahmin kaydedildi, ${savedTime}` : 'Tahmin kaydedildi',
    error: `${errorText ?? 'Kaydedilemedi'}. Tekrar denemek için dokun`,
  }[state];

  return (
    <Animated.View
      style={{ transform: [{ translateX: anim.shake }, { scale: Animated.multiply(anim.press, anim.pop) }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={interactive ? pressIn : undefined}
        onPressOut={interactive ? pressOut : undefined}
        disabled={!interactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !interactive, busy: state === 'saving' }}>
        <View
          className={
            state === 'error'
              ? 'h-[52px] overflow-hidden rounded-2xl border border-danger bg-surface'
              : 'h-[52px] overflow-hidden rounded-2xl border border-primary/40 bg-primary-soft'
          }>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.primary, opacity: Animated.subtract(1, anim.calm), pointerEvents: 'none' },
            ]}
          />
          <View className="flex-1 flex-row items-center justify-center gap-2 px-4">
            {state === 'saving' ? (
              <>
                <ActivityIndicator size="small" color={colors.onPrimary} />
                <Text className="text-base font-bold text-on-primary">Kaydediliyor</Text>
              </>
            ) : state === 'saved' ? (
              <>
                <Animated.View style={{ transform: [{ scale: anim.check }] }}>
                  <Icon name="check" size={18} color={colors.primary} />
                </Animated.View>
                <Text className="text-base font-bold text-primary">Kaydedildi</Text>
                {savedTime ? (
                  <Text className="text-sm font-semibold text-primary/70">· {savedTime}</Text>
                ) : null}
              </>
            ) : state === 'error' ? (
              <>
                <Icon name="warning" size={15} color={colors.danger} />
                <Text className="shrink text-sm font-bold text-danger" numberOfLines={1}>
                  {errorText ?? 'Kaydedilemedi'} · Tekrar dene
                </Text>
              </>
            ) : (
              <Text className="text-base font-bold text-on-primary">
                {state === 'dirty' ? 'Tahmini Güncelle' : 'Tahmini Kaydet'}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
