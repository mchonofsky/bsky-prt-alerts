import type {PRTAlert} from './cta_types.js'
import moment from 'moment-timezone';

export default function getDeltaT(alert_: PRTAlert) {
  return Date.now() - 1000*moment.tz(
    moment(alert_.mod,'YYYYMMDD HH:mm:ss', true),
     'America/New_York').unix();
}
