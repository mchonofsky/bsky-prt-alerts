import type {PRTAlert} from './cta_types.js'

export default async function getPostText(alert_: PRTAlert) {
  // Generate the text for your post here. You can return a string or a promise that resolves to a string
  var text = `${alert_.dtl}`;
  let hyperlinks =  /<[^>]+>/g 
  text = text.replaceAll(hyperlinks,'')
  for ( var i = 0; i < 128; i++) {
    text = text.replaceAll( `&#${i};`, String.fromCharCode(i) )
  }
  text = text.replaceAll(`  +`, ' ')
  const emojis = 
    {
      red: "🟥",
      brown: "🟫",
      BLUE: "🟦",
      green: "🟩",
      purple: "🟪",
      orange: "🟧",
      PINK: "🩷",
      yellow: "🟨",
      SLVR: "🩶",
      bus: "🚍"
    }
  
  text = text.trim();
  
  Object.keys(emojis).forEach((key) => {
    var re = new RegExp(`(${key}())`, "i");
    const emoji = emojis[key as keyof typeof emojis];
    text = text.replace(re, `${emoji} $1`) // was ` $1`
  })
  text = text.replaceAll(/(s)lvr/gi, '$1ilver')
  text = text.replaceAll('Btw','between')
  text = text.replaceAll(/^([0-9]+)\n/g, '🚌 Bus Route $1\n')
  if ( text.includes("buses") || text.includes("bus stop") ) {
    text = `${emojis.bus} ${text}`;
  }

  if (text.length > 300) {
    text = text.slice(0, 250) + '... ' 
  }


  return text;
}
