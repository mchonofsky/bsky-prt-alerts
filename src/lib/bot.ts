import axios from "axios";
import admin from 'firebase-admin';

import { bskyAccount, bskyService, firebaseServiceAccount } from "./config.js";
import { bus_routes, rail_routes, PRTRoute } from "./routes.js";

import type {
  PRTData, PRTAlert
} from "./cta_types.js"
import getDeltaT from "./getDeltaT.js";
import moment from 'moment-timezone';

import crypto from "crypto"

import type {
  AtpAgentLoginOpts,
  AtpAgentOpts,
  AppBskyFeedPost,
} from "@atproto/api";
import atproto from "@atproto/api";
const { BskyAgent, RichText } = atproto;

admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount)
});
const db = admin.firestore();

async function getHash(): Promise<string> {
    const alertsRef = db.collection('prt-alerts-fulltext-hash');
    try {
      const doc = (await 
          alertsRef.doc('hash').get()
      )
      if (doc == undefined || doc.data() == undefined) return '';
      let data = doc.data()
      // // console.log('Document retrieved with ID: ', doc.id);
      // // console.log('data is', data)
      return (data || {hash: ''} ).hash
    } catch (e) {
      console.error('Error getting document: ', e);
      return '';
    }
}

async function putHash(hash: string): Promise<string> {
    const alertsRef = db.collection('prt-alerts-fulltext-hash');
    try {
      const doc = (await 
          alertsRef.doc('hash').set({hash: hash})
      )
      return 'ok'
    } catch (e) {
      console.error('Error setting document: ', e);
      return 'not ok';
    }
}

type BotOptions = {
  service: string | URL;
  parameter: number; 
  dryRun: boolean;
};

export default class Bot {
  #agent;

  static defaultOptions: BotOptions = {
    service: bskyService,
    parameter: 999,
    dryRun: false,
  } as const;

  constructor(service: AtpAgentOpts["service"]) {
    this.#agent = new BskyAgent({ service });
  }

  login(loginOpts: AtpAgentLoginOpts) {
    return this.#agent.login(loginOpts);
  }

  async post(
    text:
      | string
      | (Partial<AppBskyFeedPost.Record> &
          Omit<AppBskyFeedPost.Record, "createdAt">)
  ) {
    if (typeof text === "string") {
      const richText = new RichText({ text });
      await richText.detectFacets(this.#agent);
      const record = {
        text: richText.text,
        facets: richText.facets,
      };
      return this.#agent.post(record);
    } else {
      return this.#agent.post(text);
    }
  }

  static async run(
    getPostText: (a: PRTAlert) => Promise<string>,
    botOptions?: Partial<BotOptions>
  ) {
    const hashvals = await getHash(); 
    const { service, dryRun /*, parameter */} = botOptions
      ? Object.assign({}, this.defaultOptions, botOptions)
      : this.defaultOptions;
    const bot = new Bot(service);
    await bot.login(bskyAccount);
    let bus_routes_string = bus_routes.map( (x: PRTRoute ) => x.rt).join(',')
    let rail_routes_string = rail_routes.map( (x: PRTRoute ) => x.rt).join(',')
    console.log(
        'https://realtime.portauthority.org/bustime/api/v3/getservicebulletins?rtpidatafeed=Port%20Authority%20Bus&rt=' + bus_routes_string + '&key=CyxnsDPzRyje9ZFccXqQS5agS&format=json')
    console.log(rail_routes_string)
    let bus_alerts = (
      await 
        axios.get<PRTData>(
        'https://realtime.portauthority.org/bustime/api/v3/getservicebulletins?rtpidatafeed=Port%20Authority%20Bus&rt=' + bus_routes_string + '&key=CyxnsDPzRyje9ZFccXqQS5agS&format=json')
    ).data['bustime-response'].sb;

    let rail_alerts = (
      await 
        axios.get<PRTData>(
        'https://realtime.portauthority.org/bustime/api/v3/getservicebulletins?rtpidatafeed=Light%20Rail&rt=' + rail_routes_string + '&key=CyxnsDPzRyje9ZFccXqQS5agS&format=json')
    ).data['bustime-response'].sb;

    let alerts = bus_alerts.concat(rail_alerts);

    const regex = /this string should never exist/i ;
    
    // artificial debugging, shows what failed
    // console.log('\n\nregex match, excluded\n')
    var alert_texts: Array<{id: string, text: string}> = []
    // sort ascending by id 
    
    // console.log("Total alerts:", alerts.length);

    // log new ones
    // // console.log("logging alerts not seen yet")
    // alerts.map(a => addData(parseInt(a.AlertId), a.Headline, a.ShortDescription, a.EventStart, a.Agency));
    // duplicate_alerts.map(a => addData(parseInt(a.AlertId), a.Headline, a.ShortDescription, a.EventStart, a.Agency));
    
    alerts = alerts.filter ((a: PRTAlert) => (! a.dtl.toLowerCase().includes('elevator'))) 
    // console.log("Alerts remaining after filtering on 'elevator':", alerts.length)
    
    
    let DELTA_T = 3600 /* seconds */ * 1000 /* msec */ * 100 /* hours */;
    
    // let discarded_alerts = alerts.filter ((a: PRTAlert) => getDeltaT(a) >= DELTA_T)
    // await Promise.all(discarded_alerts.map(async (a: PRTAlert) => (
    //   console.log(`[${a.AlertId}] discarded / ${a.EventStart}: ${await getPostText(a)} / start ${Date.parse(a.EventStart)} / now ${Date.now()} / delta ${getDeltaT(a) } (${Math.round(getDeltaT(a)*100 / 3600 / 1000)/100} hours)`)
    // )));
    console.log(`this many alerts: ${alerts.length}`)
    alerts = alerts.filter ((a: PRTAlert) => getDeltaT(a) < DELTA_T)
    console.log(`after filtering on time: ${alerts.length}`)
    // console.log("Alerts remaining after filtering on last hour:", alerts.length)
    
    
    let posts = await Promise.all(alerts.map( async (alert_: PRTAlert) => {
      const text = await getPostText(alert_);
      return text;
    }))

    console.log(`posts: ${posts.length}`)
    posts.map( x => 
      console.log(`\n\nPOST TEXT: >${x}`)
    )
    // filter posts to only new posts
    var hashset = new Set();
    var old_hash_list = hashvals.split(',')
    old_hash_list.map( v => hashset.add(v))
    
    // for post in posts
    // check if post in hashset
    var new_posts = posts.filter(x => (dryRun || (! hashset.has(crypto.createHash('sha256').update(x).digest('base64') ))))
    
    var new_posts_digest = (
        old_hash_list.concat(
            new_posts.map( x => crypto.createHash('sha256').update(x).digest('base64') )
        ).slice(-1000)
    ).join(',')


    // console.log('POSTING')
    
    if ( !dryRun ) {
      const promises = new_posts.map(async (text: string) => bot.post(text));
      await Promise.all(promises);
      console.log('result of set value:', await putHash(new_posts_digest) )
    }
    return new_posts;
  }
}
