import type {CTAAlert} from './cta_types.js'
import moment from 'moment-timezone';

export default function getDeltaT(alert_: CTAAlert) {
  return Date.now() - 1000*moment.tz(alert_.EventStart, 'America/Chicago').unix();
}
