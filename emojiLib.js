const EMOJI_CSV_PATH = "./emoji.csv"

var emojiMap

async function loadEmojiLib() {
    readCSVFile(EMOJI_CSV_PATH).then(data => {
        emojiMap = parseCSVData(data);  
    });
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
  
  function getEmojiDescription(emojiCode, emojiMap) {
    return emojiMap.get(emojiCode) || 'Unknown Emoji';
  }