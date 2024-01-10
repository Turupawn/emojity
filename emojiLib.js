const EMOJI_CSV_PATH = "./emoji.csv"

var emojiMap

async function loadEmojiLib() {
    readCSVFile(EMOJI_CSV_PATH).then(data => {
        emojiMap = parseCSVData(data);  
    });
}

/*
function convertToEmoji(unicodeCodePoints) {
  return unicodeCodePoints.map(codePoint => String.fromCodePoint(...codePoint.split('-').map(hex => parseInt(hex, 16))));
}*/

function toEmoji(unicodeCodePoint)
{
  switch (unicodeCodePoint) {
  case '30-20e3':
    return '0️⃣'
  case '31-20e3':
    return '1️⃣'
  case '32-20e3':
    return '2️⃣'
  case '33-20e3':
    return '3️⃣'
  case '34-20e3':
    return '4️⃣'
  case '35-20e3':
    return '5️⃣'
  case '36-20e3':
    return '6️⃣'
  case '37-20e3':
    return '7️⃣'
  case '38-20e3':
    return '8️⃣'
  case '39-20e3':
    return '9️⃣'
  case '40-20e3':
    return '🔟'
  case '21a9':
    return '↩️'
  case '23-20e3':
    return '#️⃣'
  case '262f':
    return '☯️'
  }
  
  return String.fromCodePoint(unicodeCodePoint.split('-').map(hex => parseInt(hex, 16)))
}

async function readCSVFile(fileName) {
    const response = await fetch(fileName);
    const text = await response.text();
    return text;
  }
  
  function parseCSVData(csvData) {
    const lines = csvData.trim().split('\n');
    const emojiMap = new Map();
  
    lines.forEach(line => {
      const [emojiCode, description] = line.split(',"');
      emojiMap.set(emojiCode, description.slice(0, -1)); // Remove the trailing quote
    });
  
    return emojiMap;
  }
  
  function getEmojiDescription(emojiCode) {
    return emojiMap.get(emojiCode) || 'Unknown Emoji';
  }