import { readFileSync, writeFileSync } from 'fs';

const chapters = JSON.parse(readFileSync('src/data/chapters.json', 'utf-8'));
const letters = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const LETTER_NUM = { 'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'כ':11,'ל':12,'מ':13,'נ':14,'ס':15,'ע':16,'פ':17,'צ':18,'ק':19,'ר':20,'ש':21,'ת':22 };
const MAX_PRIORITY = 4;

async function fetchChapter(masechet, perek) {
  const [heRes, enRes, bartRes] = await Promise.all([
    fetch(`https://www.sefaria.org/api/v3/texts/${masechet}.${perek}`),
    fetch(`https://www.sefaria.org/api/v3/texts/${masechet}.${perek}?version=english`),
    fetch(`https://www.sefaria.org/api/v3/texts/Bartenura_on_${masechet}.${perek}`),
  ]);

  const heData = await heRes.json();
  const enData = await enRes.json();
  const bartData = await bartRes.json();

  const heVersion = heData.versions?.find(v => v.language === 'he');
  const enVersion = enData.versions?.find(v => v.language === 'en');
  const bartVersion = bartData.versions?.find(v => v.language === 'he');

  return {
    he: (heVersion?.text || []).map(t => t.replace(/<[^>]*>/g, '')),
    en: enVersion?.text || [],
    bartenura: bartVersion?.text || [],
  };
}

// Deduplicate: same masechet+perek might appear for different letters
const cache = new Map();

async function fetchCached(masechet, perek) {
  const key = `${masechet}.${perek}`;
  if (cache.has(key)) return cache.get(key);
  console.log(`  Fetching ${key}...`);
  const result = await fetchChapter(masechet, perek);
  cache.set(key, result);
  // Rate limit: small delay between requests
  await new Promise(r => setTimeout(r, 300));
  return result;
}

for (const letter of letters) {
  const entries = chapters
    .filter(e => e.letter === letter && e.priority && e.priority <= MAX_PRIORITY)
    .sort((a, b) => a.priority - b.priority);

  for (const entry of entries) {
    const p = entry.priority;
    console.log(`${letter}-${p}: ${entry.name} (${entry.masechet} ${entry.perek})`);

    const texts = await fetchCached(entry.masechet, entry.perek);

    const output = {
      letter,
      priority: p,
      name: entry.name,
      masechet: entry.masechet,
      perek: entry.perek,
      heRef: entry.name,
      seder: entry.seder,
      mishnayot: texts.he,
      english: texts.en,
      bartenura: texts.bartenura,
    };

    writeFileSync(
      `src/data/letters/${LETTER_NUM[letter]}-${p}.json`,
      JSON.stringify(output, null, 2) + '\n'
    );
  }
}

console.log(`\nDone! Fetched ${cache.size} unique chapters, wrote ${letters.reduce((sum, l) => sum + chapters.filter(e => e.letter === l && e.priority && e.priority <= MAX_PRIORITY).length, 0)} files.`);
