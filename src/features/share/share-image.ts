import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { PixelRatio, Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// Instagram hikâyesi boyutu (9:16).
const STORY_WIDTH_PX = 1080;
const STORY_HEIGHT_PX = 1920;

/**
 * Kartı 1080x1920 PNG olarak yakalar ve telefonun paylaşma penceresini açar
 * (Instagram hikâye/DM, WhatsApp, Mesajlar, Fotoğraflara kaydet...).
 */
export async function shareViewAsImage(view: RefObject<View | null>, dialogTitle: string): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Görsel paylaşma telefonda çalışır.');
  if (!view.current) throw new Error('Kart henüz hazır değil.');

  // Yakalama boyutu mantıksal piksel ister; ekranın piksel yoğunluğuna bölünür.
  const ratio = PixelRatio.get();
  const uri = await captureRef(view, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: STORY_WIDTH_PX / ratio,
    height: STORY_HEIGHT_PX / ratio,
  });

  if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda paylaşma desteklenmiyor.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
}
