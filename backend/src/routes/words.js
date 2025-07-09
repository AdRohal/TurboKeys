const express = require('express');
const router = express.Router();

// Word lists for different languages and difficulties
const wordLists = {
  english: {
    easy: [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
      'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'big', 'end',
      'far', 'got', 'own', 'run', 'top', 'try', 'ask', 'came', 'each', 'feel',
      'find', 'give', 'good', 'hand', 'high', 'keep', 'kind', 'last', 'left',
      'life', 'live', 'look', 'made', 'make', 'most', 'move', 'must', 'name',
      'need', 'next', 'open', 'over', 'part', 'play', 'right', 'said', 'same',
      'seem', 'show', 'side', 'take', 'tell', 'turn', 'want', 'well', 'went',
      'were', 'what', 'when', 'will', 'work', 'year', 'your', 'after', 'again',
      'air', 'away', 'back', 'been', 'before', 'being', 'below', 'between'
    ],
    medium: [
      'about', 'above', 'across', 'after', 'again', 'against', 'almost', 'alone',
      'along', 'already', 'also', 'although', 'always', 'among', 'another', 'answer',
      'around', 'because', 'become', 'before', 'began', 'begin', 'being', 'believe',
      'between', 'both', 'bring', 'build', 'business', 'called', 'change', 'children',
      'close', 'come', 'company', 'complete', 'could', 'country', 'course', 'create',
      'decided', 'develop', 'difference', 'different', 'does', 'done', 'down',
      'during', 'early', 'education', 'enough', 'every', 'example', 'experience',
      'family', 'few', 'follow', 'found', 'friends', 'from', 'general', 'government',
      'great', 'group', 'grow', 'happen', 'have', 'health', 'help', 'here',
      'history', 'home', 'house', 'however', 'human', 'important', 'increase',
      'information', 'instead', 'interest', 'into', 'itself', 'just', 'know',
      'large', 'later', 'learn', 'leave', 'level', 'line', 'little', 'local',
      'long', 'make', 'market', 'member', 'might', 'money', 'month', 'more',
      'morning', 'much', 'music', 'national', 'natural', 'never', 'night',
      'nothing', 'number', 'office', 'often', 'once', 'only', 'order', 'other',
      'others', 'outside', 'over', 'own', 'part', 'party', 'people', 'person',
      'place', 'plan', 'point', 'political', 'possible', 'power', 'present',
      'president', 'probably', 'problem', 'program', 'provide', 'public', 'quite',
      'rather', 'real', 'really', 'reason', 'receive', 'remember', 'report',
      'result', 'return', 'right', 'room', 'same', 'school', 'second', 'section',
      'seem', 'serious', 'service', 'several', 'should', 'since', 'small',
      'social', 'some', 'someone', 'something', 'sometimes', 'sort', 'speak',
      'special', 'start', 'state', 'still', 'story', 'student', 'study', 'such',
      'system', 'take', 'than', 'that', 'their', 'them', 'then', 'there',
      'these', 'they', 'thing', 'think', 'this', 'those', 'though', 'three',
      'through', 'time', 'today', 'together', 'toward', 'town', 'true', 'turn',
      'under', 'understand', 'until', 'upon', 'used', 'using', 'very', 'want',
      'water', 'week', 'well', 'what', 'when', 'where', 'which', 'while',
      'white', 'whole', 'within', 'without', 'woman', 'word', 'work', 'world',
      'would', 'write', 'year', 'years', 'young'
    ],
    hard: [
      'absolutely', 'academic', 'acceptable', 'accidentally', 'accommodate', 'accompanied',
      'accomplish', 'according', 'accumulate', 'achievement', 'acknowledge', 'acquisition',
      'address', 'adequate', 'administration', 'advantage', 'adventure', 'advertisement',
      'afternoon', 'aggressive', 'agreement', 'algorithm', 'alternative', 'although',
      'amazing', 'ambulance', 'analysis', 'anniversary', 'announcement', 'answer',
      'anticipate', 'anxiety', 'anywhere', 'apparent', 'appearance', 'application',
      'appreciate', 'appropriate', 'approximately', 'architecture', 'argument', 'arrangement',
      'article', 'artificial', 'assignment', 'assistance', 'associate', 'assumption',
      'atmosphere', 'attach', 'attempt', 'attention', 'attitude', 'attraction',
      'attribute', 'audience', 'authority', 'automatic', 'available', 'average',
      'background', 'balance', 'beautiful', 'because', 'beginning', 'behavior',
      'believe', 'benefit', 'bicycle', 'biology', 'birthday', 'boundary',
      'breakfast', 'brilliant', 'broadcast', 'budget', 'building', 'business',
      'calculate', 'calendar', 'campaign', 'capacity', 'capital', 'captain',
      'carefully', 'category', 'celebrate', 'celebrity', 'ceremony', 'certainly',
      'certificate', 'challenge', 'champion', 'character', 'characteristic', 'chemistry',
      'childhood', 'chocolate', 'choice', 'Christmas', 'cigarette', 'circumstance',
      'citizen', 'classroom', 'climate', 'clothes', 'collection', 'college',
      'combination', 'comfortable', 'command', 'comment', 'commercial', 'commission',
      'commitment', 'committee', 'communicate', 'community', 'company', 'compare',
      'competition', 'complete', 'complex', 'computer', 'concentrate', 'concept',
      'concern', 'condition', 'conference', 'confidence', 'conflict', 'confusion',
      'congress', 'connection', 'consequence', 'consider', 'consistent', 'constant',
      'constitute', 'construction', 'contain', 'content', 'contest', 'context',
      'continue', 'contract', 'control', 'conversation', 'convert', 'convince',
      'copyright', 'correct', 'council', 'counter', 'country', 'couple',
      'courage', 'course', 'coverage', 'creative', 'creature', 'crisis',
      'criteria', 'critical', 'culture', 'curious', 'current', 'customer',
      'cycle', 'damage', 'dangerous', 'database', 'daughter', 'decision',
      'declare', 'decrease', 'definition', 'degree', 'deliver', 'democracy',
      'demonstrate', 'department', 'depend', 'describe', 'description', 'design',
      'desktop', 'despite', 'destroy', 'detail', 'determine', 'develop',
      'development', 'device', 'dialogue', 'difference', 'different', 'difficult',
      'digital', 'dimension', 'dinner', 'direction', 'director', 'disappear',
      'discipline', 'discover', 'discussion', 'disease', 'display', 'distance',
      'distribute', 'district', 'document', 'domestic', 'dominant', 'download',
      'dramatic', 'drawing', 'driver', 'during', 'dynamic', 'economy',
      'education', 'effect', 'effective', 'efficiency', 'effort', 'eight',
      'either', 'election', 'electric', 'electronic', 'element', 'eliminate',
      'emergency', 'emotion', 'emphasis', 'employee', 'enable', 'encounter',
      'encourage', 'energy', 'engine', 'engineer', 'enhance', 'enough',
      'ensure', 'enterprise', 'entertainment', 'entire', 'environment', 'episode',
      'equipment', 'especially', 'establish', 'estimate', 'ethnic', 'evaluate',
      'evening', 'event', 'eventually', 'every', 'evidence', 'exactly',
      'examine', 'example', 'excellent', 'except', 'exchange', 'exciting',
      'executive', 'exercise', 'exist', 'existence', 'expand', 'expect',
      'expensive', 'experience', 'experiment', 'expert', 'explain', 'explanation',
      'explore', 'explosion', 'express', 'expression', 'extend', 'extension',
      'external', 'extreme', 'facility', 'factor', 'failure', 'famous',
      'fantasy', 'fashion', 'father', 'feature', 'federal', 'feeling',
      'female', 'festival', 'fiction', 'field', 'fifteen', 'figure',
      'finally', 'finance', 'financial', 'finger', 'finish', 'flight',
      'flower', 'focus', 'follow', 'football', 'foreign', 'forest',
      'forget', 'formal', 'format', 'former', 'formula', 'fortune',
      'forward', 'foundation', 'fourth', 'frame', 'framework', 'freedom',
      'frequency', 'fresh', 'friend', 'friendly', 'function', 'fundamental',
      'furniture', 'future', 'garden', 'gender', 'general', 'generate',
      'generation', 'global', 'golden', 'government', 'graduate', 'graphics',
      'ground', 'growth', 'guarantee', 'guard', 'guidance', 'handle',
      'hardware', 'health', 'healthy', 'hearing', 'height', 'helpful',
      'heritage', 'highlight', 'highly', 'history', 'holiday', 'homeless',
      'honest', 'hospital', 'hotel', 'however', 'hundred', 'husband',
      'identity', 'illegal', 'illness', 'image', 'imagine', 'immediate',
      'impact', 'implement', 'important', 'improve', 'include', 'income',
      'increase', 'indeed', 'independent', 'indicate', 'individual', 'industry',
      'influence', 'information', 'initial', 'initiative', 'injury', 'innocent',
      'input', 'insert', 'inside', 'insight', 'inspire', 'install',
      'instance', 'instead', 'institute', 'instruction', 'instrument', 'insurance',
      'intelligent', 'intend', 'intense', 'intention', 'interact', 'interest',
      'interface', 'internal', 'international', 'internet', 'interpret', 'interview',
      'introduce', 'investigation', 'investment', 'involve', 'island', 'issue',
      'itself', 'jacket', 'journey', 'judge', 'judgment', 'juice',
      'junior', 'justice', 'justify', 'keyboard', 'kitchen', 'knowledge',
      'landscape', 'language', 'laptop', 'latter', 'launch', 'lawyer',
      'leader', 'leadership', 'leading', 'league', 'learning', 'leather',
      'leave', 'legal', 'length', 'lesson', 'letter', 'level',
      'library', 'license', 'limit', 'limited', 'listen', 'literature',
      'little', 'living', 'local', 'location', 'machine', 'magazine',
      'magic', 'maintain', 'major', 'majority', 'maker', 'manage',
      'management', 'manager', 'manner', 'manufacturing', 'margin', 'market',
      'marketing', 'marriage', 'material', 'matter', 'maximum', 'maybe',
      'meaning', 'measure', 'mechanism', 'media', 'medical', 'medicine',
      'medium', 'meeting', 'member', 'membership', 'memory', 'mention',
      'message', 'method', 'middle', 'military', 'million', 'minimum',
      'minister', 'minor', 'minute', 'miracle', 'mirror', 'mission',
      'mistake', 'mixture', 'mobile', 'mode', 'model', 'moderate',
      'modern', 'modify', 'module', 'moment', 'money', 'monitor',
      'month', 'moral', 'morning', 'mortgage', 'mother', 'motion',
      'motivation', 'motor', 'mountain', 'mouse', 'mouth', 'movement',
      'movie', 'multiple', 'muscle', 'museum', 'music', 'musical',
      'mystery', 'narrative', 'nation', 'national', 'native', 'natural',
      'nature', 'navigate', 'nearby', 'nearly', 'necessary', 'neck',
      'negative', 'neighbor', 'network', 'neutral', 'never', 'newly',
      'night', 'nobody', 'noise', 'normal', 'north', 'notable',
      'nothing', 'notice', 'notion', 'novel', 'nowhere', 'nuclear',
      'number', 'numerous', 'object', 'objective', 'observe', 'obtain',
      'obvious', 'occasion', 'occur', 'ocean', 'offer', 'office',
      'officer', 'official', 'often', 'ongoing', 'online', 'operate',
      'operation', 'operator', 'opinion', 'opportunity', 'oppose', 'opposite',
      'option', 'orange', 'order', 'ordinary', 'organic', 'organization',
      'organize', 'origin', 'original', 'other', 'otherwise', 'outcome',
      'output', 'outside', 'overall', 'overcome', 'overlap', 'overview',
      'owner', 'package', 'packet', 'painting', 'panel', 'paper',
      'parent', 'parking', 'particular', 'partly', 'partner', 'party',
      'passage', 'passion', 'passive', 'password', 'patch', 'patent',
      'patient', 'pattern', 'payment', 'peace', 'penalty', 'people',
      'pepper', 'perceive', 'perfect', 'perform', 'performance', 'perhaps',
      'period', 'permanent', 'permission', 'permit', 'person', 'personal',
      'personality', 'perspective', 'phase', 'phenomenon', 'philosophy', 'phone',
      'photo', 'photograph', 'phrase', 'physical', 'picture', 'piece',
      'place', 'planet', 'planning', 'plant', 'plastic', 'platform',
      'player', 'please', 'pleasure', 'plenty', 'pocket', 'poetry',
      'point', 'police', 'policy', 'political', 'politics', 'pollution',
      'popular', 'population', 'portfolio', 'portion', 'position', 'positive',
      'possess', 'possible', 'possibly', 'potential', 'poverty', 'power',
      'powerful', 'practical', 'practice', 'precise', 'predict', 'prefer',
      'preference', 'pregnancy', 'premium', 'prepare', 'presence', 'present',
      'preserve', 'president', 'pressure', 'pretty', 'prevent', 'previous',
      'price', 'primary', 'prime', 'principal', 'principle', 'print',
      'prior', 'priority', 'prison', 'privacy', 'private', 'probably',
      'problem', 'procedure', 'proceed', 'process', 'produce', 'product',
      'production', 'profession', 'professional', 'professor', 'profile', 'profit',
      'program', 'project', 'promise', 'promote', 'proper', 'property',
      'proposal', 'propose', 'prospect', 'protect', 'protection', 'protein',
      'protest', 'proud', 'prove', 'provide', 'provider', 'province',
      'provision', 'psychology', 'public', 'publication', 'publish', 'purchase',
      'purpose', 'pursue', 'quality', 'quantity', 'quarter', 'question',
      'quick', 'quickly', 'quiet', 'quite', 'quote', 'radio',
      'railway', 'raise', 'random', 'range', 'rapid', 'rarely',
      'rather', 'rating', 'ratio', 'reach', 'react', 'reaction',
      'reader', 'reading', 'ready', 'reality', 'realize', 'really',
      'reason', 'reasonable', 'receive', 'recent', 'recently', 'recognize',
      'recommend', 'record', 'recover', 'recovery', 'reduce', 'reduction',
      'refer', 'reference', 'reflect', 'reflection', 'reform', 'refuse',
      'regard', 'region', 'regional', 'register', 'regular', 'regulation',
      'reject', 'relate', 'relation', 'relationship', 'relative', 'release',
      'relevant', 'reliable', 'relief', 'religion', 'religious', 'reluctant',
      'remain', 'remember', 'remind', 'remote', 'remove', 'repair',
      'repeat', 'replace', 'reply', 'report', 'represent', 'representative',
      'reputation', 'request', 'require', 'requirement', 'rescue', 'research',
      'reserve', 'resident', 'resolve', 'resource', 'respect', 'respond',
      'response', 'responsibility', 'responsible', 'restaurant', 'restore', 'restrict',
      'result', 'retail', 'retain', 'retire', 'return', 'reveal',
      'revenue', 'review', 'revolution', 'reward', 'rhythm', 'rich',
      'right', 'rigid', 'river', 'robot', 'rocket', 'romantic',
      'round', 'route', 'routine', 'royal', 'rubber', 'rural',
      'sacred', 'safety', 'salary', 'sample', 'satisfy', 'sauce',
      'scale', 'scandal', 'scenario', 'scene', 'schedule', 'scheme',
      'scholar', 'scholarship', 'school', 'science', 'scientific', 'scope',
      'score', 'screen', 'script', 'search', 'season', 'second',
      'secondary', 'secret', 'secretary', 'section', 'sector', 'secure',
      'security', 'select', 'selection', 'self', 'senate', 'senior',
      'sense', 'sensitive', 'sentence', 'separate', 'sequence', 'series',
      'serious', 'seriously', 'serve', 'service', 'session', 'setting',
      'settle', 'settlement', 'setup', 'several', 'severe', 'shadow',
      'shake', 'shape', 'share', 'sharp', 'shell', 'shelter',
      'shift', 'shine', 'shirt', 'shock', 'shoot', 'shopping',
      'shore', 'short', 'should', 'shoulder', 'shout', 'show',
      'shower', 'sight', 'signal', 'significant', 'silence', 'silent',
      'silver', 'similar', 'simple', 'simply', 'since', 'single',
      'sister', 'situation', 'sixth', 'skill', 'skin', 'sleep',
      'slice', 'slide', 'slight', 'slightly', 'smart', 'smile',
      'smoke', 'smooth', 'snake', 'snow', 'soap', 'social',
      'society', 'software', 'soil', 'solar', 'solid', 'solution',
      'solve', 'somebody', 'somehow', 'someone', 'something', 'sometimes',
      'somewhat', 'somewhere', 'sorry', 'sort', 'sound', 'source',
      'south', 'southern', 'space', 'spare', 'speak', 'speaker',
      'special', 'specialist', 'species', 'specific', 'specify', 'speech',
      'speed', 'spend', 'spent', 'spirit', 'spiritual', 'split',
      'sport', 'spread', 'spring', 'square', 'stable', 'staff',
      'stage', 'stake', 'stand', 'standard', 'standing', 'start',
      'state', 'statement', 'station', 'status', 'stay', 'steady',
      'steal', 'steel', 'step', 'stick', 'still', 'stock',
      'stomach', 'stone', 'stop', 'storage', 'store', 'storm',
      'story', 'straight', 'strange', 'stranger', 'strategy', 'stream',
      'street', 'strength', 'stress', 'stretch', 'strike', 'string',
      'strip', 'stroke', 'strong', 'structure', 'struggle', 'student',
      'studio', 'study', 'stuff', 'stupid', 'style', 'subject',
      'submit', 'subsequent', 'substance', 'substantial', 'substitute', 'succeed',
      'success', 'successful', 'such', 'sudden', 'suffer', 'sufficient',
      'sugar', 'suggest', 'suggestion', 'suit', 'suitable', 'summary',
      'summer', 'summit', 'super', 'superior', 'supply', 'support',
      'suppose', 'sure', 'surely', 'surface', 'surgery', 'surprise',
      'surprised', 'surround', 'survey', 'survival', 'survive', 'suspect',
      'sustain', 'sweet', 'swimming', 'swing', 'switch', 'symbol',
      'sympathy', 'symptom', 'system', 'table', 'tackle', 'take',
      'talent', 'talk', 'tank', 'tape', 'target', 'task',
      'taste', 'teach', 'teacher', 'teaching', 'team', 'tear',
      'technical', 'technique', 'technology', 'telephone', 'television', 'tell',
      'temperature', 'temple', 'temporary', 'tennis', 'tension', 'term',
      'terminal', 'terrible', 'territory', 'terror', 'test', 'text',
      'than', 'thank', 'thanks', 'that', 'their', 'them',
      'theme', 'themselves', 'then', 'theory', 'therapy', 'there',
      'therefore', 'these', 'they', 'thick', 'thin', 'thing',
      'think', 'thinking', 'third', 'this', 'thorough', 'those',
      'though', 'thought', 'thousand', 'threat', 'threaten', 'three',
      'through', 'throughout', 'throw', 'thumb', 'thunder', 'thus',
      'ticket', 'tide', 'tight', 'time', 'tiny', 'tired',
      'tissue', 'title', 'tobacco', 'today', 'together', 'toilet',
      'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool',
      'tooth', 'topic', 'total', 'touch', 'tough', 'tour',
      'tourist', 'tournament', 'toward', 'tower', 'town', 'track',
      'trade', 'tradition', 'traditional', 'traffic', 'train', 'training',
      'transfer', 'transform', 'transition', 'translate', 'transport', 'travel',
      'treat', 'treatment', 'treaty', 'tree', 'tremendous', 'trend',
      'trial', 'tribe', 'trick', 'trip', 'troops', 'trouble',
      'truck', 'true', 'truly', 'trust', 'truth', 'trying',
      'tune', 'tunnel', 'turn', 'twelve', 'twenty', 'twice',
      'twin', 'twist', 'type', 'typical', 'ultimate', 'unable',
      'uncle', 'under', 'undergo', 'understand', 'understanding', 'unemployed',
      'unexpected', 'unfortunately', 'uniform', 'union', 'unique', 'unit',
      'united', 'universe', 'university', 'unknown', 'unless', 'unlike',
      'unlikely', 'until', 'unusual', 'update', 'upgrade', 'upon',
      'upper', 'urban', 'urge', 'urgent', 'usage', 'used',
      'useful', 'user', 'usual', 'usually', 'utility', 'vacation',
      'valley', 'valuable', 'value', 'variable', 'variation', 'variety',
      'various', 'vast', 'vegetable', 'vehicle', 'venture', 'version',
      'versus', 'very', 'vessel', 'veteran', 'victim', 'video',
      'view', 'village', 'violate', 'violence', 'violent', 'virtual',
      'virus', 'visible', 'vision', 'visit', 'visitor', 'visual',
      'vital', 'voice', 'volume', 'volunteer', 'vote', 'wage',
      'wait', 'wake', 'walk', 'wall', 'want', 'warm',
      'warn', 'warning', 'wash', 'waste', 'watch', 'water',
      'wave', 'weak', 'wealth', 'weapon', 'wear', 'weather',
      'wedding', 'week', 'weekend', 'weekly', 'weight', 'welcome',
      'well', 'west', 'western', 'what', 'whatever', 'wheel',
      'when', 'whenever', 'where', 'whereas', 'wherever', 'whether',
      'which', 'while', 'white', 'whole', 'whom', 'whose',
      'wide', 'widely', 'wife', 'wild', 'will', 'willing',
      'wind', 'window', 'wine', 'wing', 'winner', 'winter',
      'wire', 'wise', 'wish', 'with', 'within', 'without',
      'witness', 'woman', 'women', 'wonderful', 'wood', 'wooden',
      'word', 'work', 'worker', 'working', 'workplace', 'world',
      'worldwide', 'worry', 'worse', 'worst', 'worth', 'would',
      'write', 'writer', 'writing', 'wrong', 'yard', 'yeah',
      'year', 'yellow', 'yesterday', 'young', 'your', 'yourself',
      'youth', 'zone'
    ]
  },
  french: {
    easy: [
      'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'prendre', 'venir', 'vouloir',
      'pouvoir', 'devoir', 'croire', 'trouver', 'donner', 'parler', 'aimer', 'passer', 'mettre', 'regarder',
      'temps', 'personne', 'année', 'main', 'jour', 'moment', 'pays', 'monde', 'place', 'nombre',
      'eau', 'terre', 'air', 'feu', 'homme', 'femme', 'enfant', 'ami', 'famille', 'maison',
      'ville', 'route', 'voiture', 'train', 'avion', 'bateau', 'travail', 'école', 'livre', 'papier',
      'chien', 'chat', 'cheval', 'animal', 'arbre', 'fleur', 'jardin', 'forêt', 'mer', 'montagne'
    ],
    medium: [
      'suivre', 'connaître', 'paraître', 'partir', 'sortir', 'tenir', 'ouvrir', 'porter', 'vivre', 'écrire',
      'lire', 'comprendre', 'entendre', 'apprendre', 'répondre', 'attendre', 'perdre', 'rendre', 'descendre', 'monter',
      'gouvernement', 'président', 'ministre', 'député', 'sénateur', 'élection', 'vote', 'citoyen', 'démocratie', 'république',
      'économie', 'entreprise', 'industrie', 'commerce', 'marché', 'banque', 'argent', 'prix', 'coût', 'budget',
      'éducation', 'université', 'professeur', 'étudiant', 'classe', 'cours', 'examen', 'diplôme', 'formation', 'apprentissage',
      'médecin', 'infirmier', 'hôpital', 'clinique', 'patient', 'maladie', 'traitement', 'médicament', 'santé', 'guérison',
      'culture', 'art', 'musique', 'peinture', 'théâtre', 'cinéma', 'littérature', 'poésie', 'roman', 'histoire',
      'science', 'recherche', 'expérience', 'laboratoire', 'découverte', 'invention', 'technologie', 'innovation', 'progrès', 'développement',
      'environnement', 'nature', 'écologie', 'pollution', 'recyclage', 'énergie', 'ressource', 'climat', 'température', 'saison',
      'communication', 'information', 'médias', 'journalisme', 'presse', 'télévision', 'radio', 'internet', 'ordinateur', 'téléphone'
    ],
    hard: [
      'révolutionnaire', 'extraordinaire', 'incompréhensible', 'incontournable', 'indispensable', 'irremplaçable', 'caractéristique', 'particulièrement', 'exceptionnellement', 'considérablement',
      'administration', 'bureaucratie', 'réglementation', 'procédure', 'formalité', 'autorisation', 'permission', 'interdiction', 'obligation', 'responsabilité',
      'développement', 'amélioration', 'transformation', 'modernisation', 'optimisation', 'perfectionnement', 'renforcement', 'consolidation', 'stabilisation', 'diversification',
      'établissement', 'organisation', 'institution', 'association', 'coopération', 'collaboration', 'coordination', 'participation', 'contribution', 'représentation',
      'personnalité', 'individualité', 'originalité', 'créativité', 'imagination', 'inspiration', 'motivation', 'détermination', 'persévérance', 'concentration',
      'manifestation', 'démonstration', 'présentation', 'exposition', 'publication', 'diffusion', 'transmission', 'communication', 'expression', 'articulation',
      'compréhension', 'interprétation', 'explication', 'clarification', 'précision', 'exactitude', 'vérification', 'confirmation', 'validation', 'authentification',
      'transformation', 'évolution', 'progression', 'advancement', 'amélioration', 'perfectionnement', 'enrichissement', 'approfondissement', 'élargissement', 'extension',
      'investigation', 'exploration', 'examination', 'observation', 'analyse', 'évaluation', 'appreciation', 'estimation', 'calculation', 'mesure',
      'construction', 'reconstruction', 'déconstruction', 'destruction', 'production', 'reproduction', 'création', 'fabrication', 'élaboration', 'préparation'
    ]
  }
};

// Common programming words for code typing tests
const programmingWords = [
  'function', 'variable', 'constant', 'array', 'object', 'string', 'number', 'boolean',
  'return', 'import', 'export', 'class', 'interface', 'implements', 'extends', 'public',
  'private', 'protected', 'static', 'async', 'await', 'promise', 'callback', 'closure',
  'prototype', 'constructor', 'method', 'property', 'parameter', 'argument', 'scope',
  'hoisting', 'binding', 'context', 'execution', 'memory', 'garbage', 'collection',
  'algorithm', 'complexity', 'iteration', 'recursion', 'optimization', 'performance',
  'debugging', 'testing', 'refactoring', 'deployment', 'version', 'control', 'repository',
  'branch', 'merge', 'commit', 'pull', 'push', 'clone', 'fork', 'issue', 'release'
];

// Get word list for typing test
router.get('/list', (req, res) => {
  try {
    const { 
      language = 'english', 
      difficulty = 'medium', 
      count = 50,
      type = 'normal'
    } = req.query;

    let words = [];

    if (type === 'programming') {
      words = programmingWords;
    } else if (wordLists[language] && wordLists[language][difficulty]) {
      words = wordLists[language][difficulty];
    } else {
      words = wordLists.english.medium; // fallback
    }

    // Shuffle and get requested count
    const shuffled = words.sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, parseInt(count));

    res.json({
      words: selectedWords,
      language,
      difficulty,
      type,
      count: selectedWords.length
    });

  } catch (error) {
    console.error('Get word list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available languages and difficulties
router.get('/languages', (req, res) => {
  try {
    const languages = Object.keys(wordLists).map(lang => ({
      code: lang,
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      difficulties: Object.keys(wordLists[lang])
    }));

    res.json({ 
      languages,
      types: ['normal', 'programming']
    });

  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate custom text for typing test
router.post('/generate', (req, res) => {
  try {
    const { 
      language = 'english', 
      difficulty = 'medium', 
      wordCount = 50,
      type = 'normal',
      customWords = []
    } = req.body;

    let sourceWords = [];

    if (customWords.length > 0) {
      sourceWords = customWords;
    } else if (type === 'programming') {
      sourceWords = programmingWords;
    } else if (wordLists[language] && wordLists[language][difficulty]) {
      sourceWords = wordLists[language][difficulty];
    } else {
      sourceWords = wordLists.english.medium;
    }

    // Generate text with some repetition for realistic typing
    const text = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * sourceWords.length);
      text.push(sourceWords[randomIndex]);
    }

    res.json({
      text: text.join(' '),
      words: text,
      language,
      difficulty,
      type,
      wordCount: text.length
    });

  } catch (error) {
    console.error('Generate text error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
