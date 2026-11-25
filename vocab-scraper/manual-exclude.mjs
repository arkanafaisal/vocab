/**
 * Konfigurasi kata non-vocab yang akan dihapus pada tahap pembersihan manual.
 * Tambahkan kata baru ke dalam array ini (case-insensitive).
 */
export const MANUAL_EXCLUDE_WORDS = [
  'grey', 'martha', 'lucas', 'jona',

  // Stopwords
  'about', 'after', 'all', 'also', 'and', 'any', 'are', 'because', 'been',
  'before', 'being', 'but', 'can', 'could', 'do', 'down', 'each', 'even',
  'every', 'for', 'from', 'has', 'have', 'her', 'here', 'him', 'his', 'how',
  'into', 'its', 'just', 'more', 'not', 'now', 'only', 'onto', 'other', 'out',
  'she', 'some', 'such', 'that', 'the', 'their', 'them', 'there', 'these',
  'they', 'this', 'though', 'through', 'till', 'too', 'very', 'was', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whose', 'why', 'will',
  'with', 'would', 'yet', 'you', 'your', 'yourself',

  // Dasar (A1)
  'able', 'age', 'almost', 'already', 'alright', 'anybody', 'anywhere',
  'around', 'ask', 'back', 'bad', 'beautiful', 'became', 'best', 'big',
  'blue', 'body', 'boy', 'brown', 'call', 'chair', 'check', 'children',
  'city', 'color', 'come', 'day', 'ear', 'easy', 'everyone', 'eye', 'face',
  'family', 'feel', 'few', 'fire', 'get', 'give', 'go', 'god', 'going',
  'good', 'great', 'grow', 'hair', 'hand', 'hard', 'head', 'hear', 'hello',
  'help', 'high', 'hold', 'home', 'hurt', 'kid', 'know', 'lady', 'last',
  'late', 'later', 'leave', 'life', 'light', 'like', 'little', 'live', 'long',
  'look', 'lose', 'lot', 'loud', 'make', 'man', 'minute', 'miss', 'mom',
  'month', 'mother', 'name', 'new', 'next', 'none', 'okay', 'old', 'older',
  'one', 'orange', 'outside', 'parent', 'people', 'person', 'pink', 'place',
  'purple', 'quick', 'ready', 'run', 'say', 'school', 'see', 'short', 'sir',
  'sit', 'skin', 'small', 'smile', 'soft', 'someone', 'son', 'soon', 'stand',
  'start', 'still', 'story', 'student', 'table', 'take', 'talk', 'thank',
  'thirty', 'time', 'today', 'town', 'try', 'turn', 'used', 'voice', 'wait',
  'walk', 'want', 'well', 'woman', 'work', 'world', 'wow', 'year', 'yes',
  'young',
  
  'alway', 'anyth', 'ongo', 'qilin', 'rep', 'tens', 'themselve',
  'downstair', 'inclin', 'upstair', 'noth', 'trie', 'gent', 'someth',
  'huuu', 'ceil', 'lightn', 'crie', 'saie', 'staie', ''
];

/**
 * Mengubah daftar pengecualian menjadi Set huruf kecil.
 * @returns {Set<string>}
 */
export function getExcludeWordSet() {
  return new Set(MANUAL_EXCLUDE_WORDS.map((word) => word.trim().toLowerCase()).filter(Boolean));
}
