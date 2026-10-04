import { useRef, useState } from 'react';
import { Share, useWindowDimensions, type View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentRound } from '@/features/matches/queries';
import { useMyStats } from '@/features/profile/queries';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { ProfileShareCard, profileShareAccent, ShareCardFrame } from '@/features/share/share-card';
import { shareViewAsImage } from '@/features/share/share-image';
import { ShareScreenLayout, shareCardWidth } from '@/features/share/share-screen-layout';
import { profileShareText } from '@/features/share/share-text';
import { WEBSITE_URL } from '@/lib/invite';

/** Sezon özetini (Türkiye sırası, puan, tam skor...) görsel ya da metin olarak paylaşma. */
export default function ProfileCardScreen() {
  const { width, height } = useWindowDimensions();
  const { data: profile } = useMyProfile();
  const { data: stats } = useMyStats();
  const { data: current } = useCurrentRound();
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardWidth = shareCardWidth(width, height);
  const ready = profile !== undefined && stats !== undefined;
  const accent = stats ? profileShareAccent(stats) : undefined;

  const shareImage = async () => {
    setError(null);
    setIsSharing(true);
    try {
      await shareViewAsImage(cardRef, 'Profilini paylaş');
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Paylaşılamadı. Tekrar dene.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareText = () => {
    if (stats) Share.share({ message: profileShareText(stats, current?.seasonName, WEBSITE_URL) });
  };

  return (
    <ShareScreenLayout
      hint="Sezon özetini Instagram hikâyende ya da WhatsApp'ta paylaşabilirsin."
      accent={accent}
      error={error}
      isSharing={isSharing}
      canShare={ready}
      onShareImage={shareImage}
      onShareText={shareText}>
      {ready ? (
        <ShareCardFrame width={cardWidth} accent={accent} ref={cardRef}>
          <ProfileShareCard
            username={profile.username}
            displayName={profile.display_name}
            seasonLabel={current?.seasonName}
            stats={stats}
          />
        </ShareCardFrame>
      ) : (
        <Skeleton width={cardWidth} height={(cardWidth * 16) / 9} radius={0} />
      )}
    </ShareScreenLayout>
  );
}
