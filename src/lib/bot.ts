import axios from "axios";
import admin from 'firebase-admin';
import { bskyAccount, bskyService, firebaseServiceAccount } from "./config.js";
import type {
  CTAData, CTAAlert
} from "./cta_types.js"

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

async function addData(parameter: number) {
  try {
    const docRef = await db.collection('alerts').doc(String(parameter)).set({
      id: parameter,
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
    let alerts = (await axios.get<CTAData>('http://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&accessibility=FALSE&activeonly=TRUE')).data.CTAAlerts.Alert
    let headFilt = alerts.map((x: CTAAlert)=>x.Headline + x.ShortDescription)
    let nextParameter = alerts.map((a: CTAAlert) => parseInt(a.AlertId)).reduce((a: number, r: number) => r > a ? r : a, 0);
    alerts = alerts.filter ( (a: CTAAlert, i: number) => i ==0 || ! (headFilt.slice(0, i - 1).includes(a.Headline + a.ShortDescription)))
    console.log("Alerts remaining after filtering for duplicate headlines:", alerts.length)
    alerts = alerts.filter( (a: CTAAlert) => parseInt(a.AlertId) > parameter);
    console.log("Alerts remaining after filtering on new ID:", alerts.length)
    alerts = alerts.filter ((a: CTAAlert) => (! a.Headline.toLowerCase().includes('elevator'))) 
    console.log("Alerts remaining after filtering on 'elevator':", alerts.length)
    alerts = alerts.filter ((a: CTAAlert) => (Date.parse(a.EventStart) > Date.now() - 36000000))
    console.log("Alerts remaining after filtering on last ten hours:", alerts.length)
    
    
    let posts = await Promise.all(alerts.map( async (alert_: CTAAlert) => {
      const text = await getPostText(alert_);
      return text;
    }))
    
    if ( !dryRun ) {
      const promises = posts.map(async (text: string) => bot.post(text));
      await Promise.all(promises);
    }
    addData(nextParameter);
    return posts;
  }
}
