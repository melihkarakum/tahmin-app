import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Share, useWindowDimensions, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { predictionOutcome } from '@/features/profile/prediction-filters';
import { usePredictionHistory } from '@/features/profile/queries';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { PredictionShareCard, ShareCardFrame, shareAccent } from '@/features/share/share-card';
import { shareViewAsImage } from '@/features/share/share-image';
import { ShareScreenLayout, shareCardWidth } from '@/features/share/share-screen-layout';
import { predictionShareText } from '@/features/share/share-text';
import { WEBSITE_URL } from '@/lib/invite';

/** Bir tahmini Instagram hikâyesi / WhatsApp / mesaj için görsel ya da metin olarak paylaşma. */
export default function PredictionShareScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { width, height } = useWindowDimensions();
  const historyQuery = usePredictionHistory();
  const { data: profile } = useMyProfile();
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const item = historyQuery.data?.find((entry) => entry.matchId === Number(matchId));
  const accent = item ? shareAccent(predictionOutcome(item)) : undefined;
  const cardWidth = shareCardWidth(width, height);
  const cardHeight = (cardWidth * 16) / 9;

  const shareImage = async () => {
    setError(null);
    setIsSharing(true);
    try {
      await shareViewAsImage(cardRef, 'Tahminini paylaş');
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Paylaşılamadı. Tekrar dene.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareText = () => {
    if (item) Share.share({ message: predictionShareText(item, WEBSITE_URL) });
  };

  return (
    <ShareScreenLayout
      hint="Instagram hikâyende, WhatsApp'ta ya da mesajla paylaşabilirsin."
      accent={accent}
      error={error}
      isSharing={isSharing}
      canShare={item !== undefined && profile !== undefined}
      onShareImage={shareImage}
      onShareText={shareText}>
      {item && profile ? (
        <ShareCardFrame width={cardWidth} accent={accent} ref={cardRef}>
          <PredictionShareCard item={item} username={profile.username} displayName={profile.display_name} />
        </ShareCardFrame>
      ) : historyQuery.isLoading ? (
        <Skeleton width={cardWidth} height={cardHeight} radius={0} />
      ) : (
        <View style={{ width: cardWidth, height: cardHeight }} className="items-center justify-center p-6">
          <Text className="text-center text-sm text-muted">Bu tahmin bulunamadı.</Text>
        </View>
      )}
    </ShareScreenLayout>
  );
}
