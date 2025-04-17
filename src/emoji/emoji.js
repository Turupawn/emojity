if (isTypeScript()) {
  const EmojiMart = require('emoji-mart');
  const twemoji = require('twemoji');
}
const EMOJI_CSV_PATH = "./csv/emojis.csv"
const OPCODE_CSV_PATH = "./csv/opcodes.csv"

var emojiMap
var opcodeMap

// Emoji picker
var cursorPosition = 0

const pickerOptions = { onEmojiSelect: onEmojiClicked }
const picker = new EmojiMart.Picker(pickerOptions)

document.getElementById("emoji_picker").appendChild(picker)

function onEmojiClicked(e) {
  var textarea = document.getElementById('_code');
  var newText = e.native;

  var currentValue = textarea.value;
  var newValue = currentValue.substring(0, cursorPosition) + newText + currentValue.substring(cursorPosition);
  
  textarea.value = newValue;
  cursorPosition += e.native.length
}

document.getElementById('_code').addEventListener('input', function(event) {
  cursorPosition = this.selectionStart;
});

document.getElementById('_code').addEventListener('click', function(event) {
  cursorPosition = this.selectionStart;
});

// End emoji Picker

async function loadEmojiLib() {
  readCSVFile(EMOJI_CSV_PATH).then(data => {
      emojiMap = parseCSVData(data);
  });
}

async function loadOpcodeLib() {
  readCSVFile(OPCODE_CSV_PATH).then(data => {
    opcodeMap = parseCSVData(data);
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
  case '1f5fa':
    return '🗺️'
  case '2716':
    return '✖️'
  case '2b06':
    return '⬆️'
  case '2b07':
    return '⬇️'
  case '1f9ee':
    return '🧮'
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
  return (emojiMap.get(emojiCode) || 'Unknown Emoji').replace(/-/g, "_");
}

if (isTypeScript()) {
  //export { loadEmojiLib, getEmojiDescription, toEmoji, onEmojiClicked };
}