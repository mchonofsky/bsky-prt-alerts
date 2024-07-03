import axios from "axios";
import admin from 'firebase-admin';

import { bskyAccount, bskyService, firebaseServiceAccount } from "./config.js";
import type {
  CTAData, CTAAlert
} from "./cta_types.js"
import getDeltaT from "./getDeltaT.js";
import moment from 'moment-timezone';

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

async function addData(parameter: number, headline: string, shortText: string, eventStart: string) {
  try {
    const docRef = await db.collection('alerts').doc(String(parameter)).set({
      id: parameter,
      headline: headline,
      shortText: shortText,
      eventStart: admin.firestore.Timestamp.fromDate( new Date(
        moment.tz(eventStart, "America/Chicago").format()
      )),
      created: admin.firestore.Timestamp.now(),
    });
    console.log('Document written with ID: ', parameter);
  } catch (e) {
    console.error('Error adding document: ', e);
  }
}

async function getMax() {
  const alertsRef = db.collection('alerts');
  try {
    const docRef = (await alertsRef.orderBy("id", "desc").limit(1).get()).docs[0];
    console.log('Document written with ID: ', docRef.id);
    return parseInt(docRef.id);
  } catch (e) {
    console.error('Error getting document: ', e);
    return 999999999;
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
    getPostText: (a: CTAAlert) => Promise<string>,
    botOptions?: Partial<BotOptions>
  ) {
    const parameter = await getMax();
    console.log('parameter returned is', parameter)
    const { service, dryRun /*, parameter */} = botOptions
      ? Object.assign({}, this.defaultOptions, botOptions)
      : this.defaultOptions;
    const bot = new Bot(service);
    await bot.login(bskyAccount);
    let alerts = (
      await axios.get<CTAData>(
        'http://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&accessibility=FALSE&activeonly=TRUE')
    ).data.CTAAlerts.Alert;
    
    // sort ascending by id 
    
    alerts.sort((a,b) => parseInt(a.AlertId) - parseInt(b.AlertId));
    
    alerts.map(a => console.log(a.AlertId, a.EventStart))
    console.log("Total alerts:", alerts.length);
    
    //headfilt is a list that matches alerts that has the headline and short description fields
    //concatenated
    let headFilt = alerts.map((x: CTAAlert)=>x.Headline + x.ShortDescription)
    
    // keep the 0th element or keep if there's no duplicate in the preceeding list
    alerts = alerts.filter ( (a: CTAAlert, i: number) => i ==0 || ! (headFilt.slice(0, i - 1).includes(a.Headline + a.ShortDescription)))
    let duplicate_alerts = 
      alerts.filter ( (a: CTAAlert, i: number) => 
        i != 0 && (headFilt.slice(0, i - 1).includes(a.Headline + a.ShortDescription))
      );

    console.log("Alerts remaining after filtering for duplicate headlines:", alerts.length)
    
    alerts = alerts.filter((a: CTAAlert) => parseInt(a.AlertId) > parameter)
    duplicate_alerts = duplicate_alerts.filter((a: CTAAlert) => parseInt(a.AlertId) > parameter)
    console.log("Alerts remaining after filtering on new ID:", alerts.length)
    console.log("Duplicate alerts remaining after filtering on new ID:", duplicate_alerts.length)
    
    // log new ones
    alerts.map(a => addData(parseInt(a.AlertId), a.Headline, a.ShortDescription, a.EventStart));
    duplicate_alerts.map(a => addData(parseInt(a.AlertId), a.Headline, a.ShortDescription, a.EventStart));
    
    alerts = alerts.filter ((a: CTAAlert) => (! a.Headline.toLowerCase().includes('elevator'))) 
    console.log("Alerts remaining after filtering on 'elevator':", alerts.length)
    let DELTA_T = 3600 /* seconds */ * 1000 /* msec */ * 1 /* hours */;
    let discarded_alerts = alerts.filter ((a: CTAAlert) => getDeltaT(a) >= DELTA_T)
    discarded_alerts.map((a: CTAAlert) => (
      console.log(`[${a.AlertId}] discarded / ${a.EventStart}: ${a.Headline + a.ShortDescription} / start ${Date.parse(a.EventStart)} / now ${Date.now()} / delta ${getDeltaT(a) } (${Math.round(getDeltaT(a)*100 / 3600 / 1000)/100} hours)`)
    ));
    alerts = alerts.filter ((a: CTAAlert) => getDeltaT(a) < DELTA_T)
    console.log("Alerts remaining after filtering on last hour:", alerts.length)
    
    
    let posts = await Promise.all(alerts.map( async (alert_: CTAAlert) => {
      const text = await getPostText(alert_);
      return text;
    }))
    
    if ( !dryRun ) {
      const promises = posts.map(async (text: string) => bot.post(text));
      await Promise.all(promises);
    }
    return posts;
  }
}
