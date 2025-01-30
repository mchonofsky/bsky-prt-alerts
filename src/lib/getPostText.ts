import type {PRTAlert} from './cta_types.js'
/*
ADD'L - Additional
BIS- Back In Service (Previously Cancelled Trip Restored)
DLY – Delay / Delayed
DTR – Detoured
FS- Farside Bus Stop
IB – Inbound Trip
NS- Nearside Bus Stop
OB – Outbound Trip
OS – Out of Service (Trip Cancelled)
SC- Scheduled Time of Arrival (No Tracking Available)
TT- TrueTime (Tracking Scheduled Bus Arrival Time)
*/
export default async function getPostText(alert_: PRTAlert) {
  // Generate the text for your post here. You can return a string or a promise that resolves to a string
  var text = `${alert_.dtl}`;
  let hyperlinks =  /<[^>]+>/g 
  text = text.replaceAll(hyperlinks,'')
  let ob = /O\/?B/g
  text = text.replaceAll(ob,"Outbound")
  let ib = /I\/?B/g
  text = text.replaceAll(ib,"Inbound")
  let os = /O\/?S/g
  text = text.replaceAll(os, "Out of Service")
  let ns = /NS/g;
  text = text.replaceAll(ns, "Nearside")
  let fs = /FS/g;
  text = text.replaceAll(fs, "Farside")
  let bis = /BIS/g;
  text = text.replaceAll(bis, "Back in Service")
  text = text.replaceAll("\n\n","\n")
  let w = / W /g;
  text = text.replaceAll(w," West ")
  text = text.replaceAll(" E ", " East ")
  let time = /([0-9]+(:[0-9][0-9])?)([AP])m?/gi
  text = text.replaceAll(time, (match, p1, p2, p3) => `${p1} ${p3.toLowerCase()}m`)
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
