/**
 * Builds a fresh test text every time, instead of picking one of a few fixed paragraphs.
 *
 * How it stays fresh and fair:
 * - Words come from large pools split into three tiers (everyday, common, uncommon). Each draw picks a tier by weight, so a text
 *   reads like real writing: mostly short everyday words, some longer ones.
 * - Each tier is a shuffled bag. A word cannot come back until the whole tier has been used, so there are no repeats close together.
 * - Neighbours are checked: no word twice in a row, no run of three words that start with the same letter, and no run of
 *   four very short or four very long words. That keeps the rhythm even from one test to the next.
 * - Words are grouped into sentences of 6 to 13 words with a capital letter and closing punctuation, so the finger work includes
 *   shift and punctuation the way normal typing does.
 * - The text is long enough that a fast typist cannot reach the end before the timer does.
 */

export type WordLanguage = 'english' | 'french';

const EN_EVERYDAY =
  'the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us';

const EN_COMMON =
  'great world school state family student group country problem hand part place case week company system program question government number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education foot boy age policy music market sense nation plan college interest death course someone experience behind reach local kill six remain effect yeah suggest class control raise care perhaps little late hard field else pass former sell major sometimes require along development themselves report role better economic effort decide rate strong possible heart drug leader light voice wife whole police mind finally pull return free military price less according decision explain son hope develop view relationship carry town road drive arm true federal break difference thank receive value international building action model season society tax director position player agree especially record pick wear paper special space ground form support event official whose matter everyone center couple site project hit base activity star table need court produce eat american teach oil half situation easy cost industry figure street image itself phone either data cover quite picture clear practice piece land recent describe product doctor wall patient worker news test movie certain north love personal open support simply third technology catch step baby computer type attention draw film republican tree source red nearly organization choose cause hair look point century evidence window difficult listen soon culture billion chance brother energy period summer realize hundred available plant likely opportunity term short letter condition choice single rule daughter administration south husband floor campaign material population economy medical hospital church close thousand risk current fire future wrong involve defense anyone increase security bank myself certainly west sport board seek per subject officer private rest behavior deal performance fight throw top quickly past goal bed order author fill represent focus foreign drop blood upon agency push nature color recently store reduce sound note fine near movement page enter share common poor natural race concern series significant similar hot language each usually response dead rise animal factor decade article shoot east save seven artist away scene stock career despite central eight thus treatment beyond happy exactly protect approach lie size dog fund serious occur media ready sign thought list individual simple quality pressure accept answer resource identify left meeting determine prepare disease whatever success argue cup particularly amount ability staff recognize indicate character growth loss degree wonder attack herself region television box training pretty trade election everybody physical lay general feeling standard bill message fail outside arrive analysis benefit sex forward lawyer present section environmental glass skill sister professor operation financial crime stage ok compare authority miss design sort act ten knowledge gun station blue state strategy clearly discuss indeed truth song example democratic check environment leg dark various rather laugh guess executive prove hang entire rock forget claim remove manager enjoy network legal religious cold final main science green memory card above seat cell establish nice trial expert spring firm radio visit management avoid imagine tonight huge ball finish themselves';

const EN_UNCOMMON =
  'lantern harbor velvet compass meadow thunder crystal horizon whisper canyon marble orchard ember glacier anchor lighthouse tapestry quartz saddle ribbon basalt cobalt falcon willow thistle voyage cipher monsoon pavilion mosaic nectar prairie pebble quiver raven solstice tundra umbra vellum walnut yonder zephyr alchemy beacon cascade dynamo eclipse fjord garnet hollow isthmus jasmine kindle lagoon mirage nebula obsidian parchment quill reservoir sapphire timber unveil vortex wander xenon yearn zenith archive bramble citadel drizzle enigma fable galaxy harvest ignite juniper kernel labyrinth mantle nimbus oracle plume quarry riddle summit talon umber vapor wharf yield zealous amber blossom copper dusk elm flint grove haven inlet jade knoll lichen moss notch onyx pine quest reef spruce trellis upland vine wisp yarrow zinc almanac burrow cinder dale ferry gable hearth ivory jetty kettle lodge mortar nook outpost pylon relic sundial turret vista warren apricot bridle clover dune estuary forge granite heron ink jigsaw kiln lyric maple nutmeg opal parlor quilt rapids stitch thorn urchin valley weave yacht zodiac algorithm bandwidth cache domain engine firewall gradient hash interface kernel latency module network packet queue router socket token uplink vector widget pixel syntax buffer cursor daemon fiber ledger mining nonce protocol relay shard stack tensor validator wallet block chain signature entropy consensus node';

const FR_EVERYDAY =
  'le de un être et à il avoir ne je son que se qui ce dans en du elle au pour pas que vous par sur faire plus dire me on mon lui nous comme mais pouvoir avec tout y aller voir en bien où sans tu ou leur homme si deux mari moi vouloir te femme venir quand grand celui si notre devoir là jour prendre même votre rien petit encore aussi quelque dont tout mer après ainsi';

const FR_COMMON =
  'monde vie temps main chose père mère enfant ami ville pays travail question voix tête côté eau nuit école maison famille histoire raison groupe force idée lieu cause moment projet service société parole forme coeur esprit chemin livre règle droit état rue ligne partie air fond table porte garçon fille jardin souvenir regard cheval lumière silence saison marché musique soleil rivière montagne village campagne voyage bateau cuisine fenêtre histoire problème réponse exemple semaine matin soir année heure minute besoin espoir peur joie colère chance liberté nature mémoire avenir passé présent histoire effort résultat langue pensée paix guerre travail ouvrir fermer écrire lire parler penser croire savoir comprendre trouver donner porter laisser montrer attendre devenir tenir sentir suivre mettre rester sortir entrer jouer courir marcher chanter dormir manger boire choisir changer apprendre oublier gagner perdre commencer finir arriver partir revenir demander répondre appeler connaître reconnaître construire découvrir imaginer préparer protéger traverser observer expliquer rencontrer rassembler partager améliorer réussir essayer décider remarquer permettre ensemble toujours jamais souvent parfois bientôt demain hier longtemps autour devant derrière entre pendant depuis contre vers chez beaucoup peu trop assez presque seulement déjà enfin alors donc pourtant cependant';

const FR_UNCOMMON =
  'lanterne horizon murmure velours falaise orage cristal rivage sentier verger brume écume clairière flambeau rempart pavillon sillage tempête mirage vallon bruyère cascade citadelle crépuscule émeraude fontaine givre hirondelle jasmin labyrinthe marais nénuphar orchidée plume quartz ruisseau sablier tonnerre vestige violon vitrail zénith alchimie balcon cerisier dentelle étoile fougère gorge hameau île jonquille lavande moulin nacre ombrage paysage quai rosée sapin tournesol vignoble écureuil papillon coquelicot châtaignier mésange grenier cheminée escalier horloge miroir tableau tapisserie bibliothèque aventure mystère découverte merveille patience courage sagesse harmonie silhouette éclat reflet frisson cadence algorithme réseau serveur clavier écran donnée signal jeton registre protocole bloc chaîne noeud portefeuille cryptage';

function split(s: string): string[] {
  return Array.from(new Set(s.split(/\s+/).filter(Boolean)));
}

const POOLS: Record<WordLanguage, { everyday: string[]; common: string[]; uncommon: string[] }> = {
  english: { everyday: split(EN_EVERYDAY), common: split(EN_COMMON), uncommon: split(EN_UNCOMMON) },
  french: { everyday: split(FR_EVERYDAY), common: split(FR_COMMON), uncommon: split(FR_UNCOMMON) },
};

type Rand = () => number;

/** Real randomness from the browser when it has it, so two tests never share a seed. */
const defaultRand: Rand = () => {
  const c = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (c?.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
  return Math.random();
};

function shuffled<T>(list: T[], rand: Rand): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Bag {
  private queue: string[] = [];
  constructor(private source: string[], private rand: Rand) {}
  next(): string {
    if (this.queue.length === 0) this.queue = shuffled(this.source, this.rand);
    return this.queue.pop() as string;
  }
}

/** How many words a test of this length needs, with room for a very fast typist. */
export function wordsNeeded(durationSeconds: number): number {
  return Math.max(60, Math.ceil((durationSeconds / 60) * 220));
}

const ENDINGS = ['.', '.', '.', '.', '.', '?', '!'];

export function generateTypingText(language: WordLanguage, durationSeconds: number, rand: Rand = defaultRand): string {
  const pool = POOLS[language] ?? POOLS.english;
  const bags = {
    everyday: new Bag(pool.everyday, rand),
    common: new Bag(pool.common, rand),
    uncommon: new Bag(pool.uncommon, rand),
  };
  const target = wordsNeeded(durationSeconds);

  const pickTier = () => {
    const r = rand();
    return r < 0.5 ? bags.everyday : r < 0.88 ? bags.common : bags.uncommon;
  };

  const words: string[] = [];
  const recent = new Set<string>();

  const acceptable = (w: string): boolean => {
    if (recent.has(w)) return false;
    const n = words.length;
    if (n >= 1 && words[n - 1].toLowerCase() === w.toLowerCase()) return false;
    if (n >= 2 && words[n - 1][0] === w[0] && words[n - 2][0] === w[0]) return false;
    if (n >= 4) {
      const last = words.slice(-4);
      if (last.every((x) => x.length <= 3) && w.length <= 3) return false;
      if (last.every((x) => x.length >= 8) && w.length >= 8) return false;
    }
    return true;
  };

  while (words.length < target) {
    let w = pickTier().next();
    for (let tries = 0; tries < 12 && !acceptable(w); tries++) w = pickTier().next();
    words.push(w);
    recent.add(w);
    if (recent.size > 60) recent.delete(recent.values().next().value as string);
  }

  // sentences of 6 to 13 words: a capital, an occasional comma, and a closing mark
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    const len = 6 + Math.floor(rand() * 8);
    const chunk = words.slice(i, i + len);
    i += len;
    if (chunk.length < 4 && out.length) {
      out[out.length - 1] = out[out.length - 1].replace(/[.?!]$/, '') + ' ' + chunk.join(' ') + '.';
      break;
    }
    chunk[0] = chunk[0].charAt(0).toUpperCase() + chunk[0].slice(1);
    if (chunk.length >= 8 && rand() < 0.45) {
      const at = 3 + Math.floor(rand() * (chunk.length - 5));
      chunk[at] = chunk[at] + ',';
    }
    const end = ENDINGS[Math.floor(rand() * ENDINGS.length)];
    chunk[chunk.length - 1] = chunk[chunk.length - 1] + end;
    out.push(chunk.join(' '));
  }
  return out.join(' ');
}
