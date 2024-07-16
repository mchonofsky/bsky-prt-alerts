import type {CTAAlert} from './cta_types.js'

export default async function getPostText(alert_: CTAAlert) {
  // Generate the text for your post here. You can return a string or a promise that resolves to a string
  var text = `${alert_.ShortDescription}`;
  const emojis = 
    {
      red: "🟥",
      brown: "🟫",
      blue: "🟦",
      green: "🟩",
      purple: "🟪",
      orange: "🟧",
      pink: "🩷 ",
      yellow: "🟨",
      bus: "🚍"
    }
  
  text = text.trim();
  Object.keys(emojis).forEach((key) => {
    var re = new RegExp(`(${key} line)`, "i");
    var k2 = key.charAt(0).toUpperCase + key.substring(1);
    var re_comma = new RegExp(`(${k2},)`);
    const emoji = emojis[key as keyof typeof emojis];
    text = text.replace(re, `${emoji} $1`)
    text = text.replace(re_comma, `${emoji} $1`)
  })
  if ( text.includes("buses") || text.includes("bus stop") ) {
    text = `${emojis.bus} ${text}`;
  }
  if (text.length > 300) {
    text = text.slice(0, 250) + '... ' + alert_.AlertURL['#cdata-section']
  }
  
  return text;
}
