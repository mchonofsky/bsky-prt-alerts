import type {CTAAlert} from './cta_types.js'

export default async function getPostText(alert_: CTAAlert) {
  // Generate the text for your post here. You can return a string or a promise that resolves to a string
  var text = `${alert_.Headline}: ${alert_.ShortDescription}`;
  if (text.length > 300) {
    text = text.slice(0, 250) + '... ' + alert_.AlertURL['#cdata-section']
  }
  return text;
}
