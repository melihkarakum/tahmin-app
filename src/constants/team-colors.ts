// Logo yoksa ya da yüklenemezse gösterilen takım rozetleri için kulüp renkleri. Değerler yaklaşık renklerdir.
// Listede olmayan takım için adından türetilen sabit bir renk kullanılır.

type TeamColors = { primary: string; secondary: string };

const CLUB_COLORS: Record<string, TeamColors> = {
  galatasaray: { primary: '#A90432', secondary: '#FDB912' },
  fenerbahce: { primary: '#002D72', secondary: '#FFED00' },
  besiktas: { primary: '#111111', secondary: '#FFFFFF' },
  trabzonspor: { primary: '#7A1E3A', secondary: '#6CABDD' },
  basaksehir: { primary: '#E56B1F', secondary: '#1F2A44' },
  samsunspor: { primary: '#D7141A', secondary: '#FFFFFF' },
  goztepe: { primary: '#F2C500', secondary: '#C8102E' },
  konyaspor: { primary: '#00843D', secondary: '#FFFFFF' },
  kasimpasa: { primary: '#1B3C8C', secondary: '#FFFFFF' },
  alanyaspor: { primary: '#F18A00', secondary: '#00843D' },
  antalyaspor: { primary: '#D7141A', secondary: '#FFFFFF' },
  rizespor: { primary: '#00843D', secondary: '#0057B8' },
  'gaziantep fk': { primary: '#C8102E', secondary: '#111111' },
  kayserispor: { primary: '#F7C600', secondary: '#C8102E' },
  eyupspor: { primary: '#5B2A86', secondary: '#F7C600' },
  sivasspor: { primary: '#D7141A', secondary: '#FFFFFF' },
  hatayspor: { primary: '#7B2B3B', secondary: '#FFFFFF' },
  'adana demirspor': { primary: '#0A2240', secondary: '#4FB3E8' },
  'bodrum fk': { primary: '#0E7C3A', secondary: '#FFFFFF' },
  kocaelispor: { primary: '#0E7C3A', secondary: '#111111' },
  genclerbirligi: { primary: '#C8102E', secondary: '#111111' },
  'fatih karagumruk': { primary: '#C8102E', secondary: '#111111' },
};

const FALLBACK_PALETTE = ['#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#CA8A04', '#4D7C0F'];

function normalize(name: string): string {
  return name
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .trim();
}

export function getTeamColors(name: string): TeamColors {
  const known = CLUB_COLORS[normalize(name)];
  if (known) return known;

  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return { primary: FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length], secondary: '#FFFFFF' };
}

/** Rozet üzerindeki yazının rengi: açık renk zeminde koyu, koyu zeminde beyaz. */
export function readableTextColor(background: string): string {
  const hex = background.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B0E11' : '#FFFFFF';
}
