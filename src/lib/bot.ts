import axios from "axios";
import { bskyAccount, bskyService } from "./config.js";
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
    const { service, dryRun, parameter} = botOptions
      ? Object.assign({}, this.defaultOptions, botOptions)
      : this.defaultOptions;
    const bot = new Bot(service);
    await bot.login(bskyAccount);
    let alerts = (await axios.get<CTAData>('http://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&activeonly=TRUE')).data.CTAAlerts.Alert
    let headFilt = alerts.map((x: CTAAlert)=>x.Headline + x.ShortDescription)
    alerts = alerts.filter ( (a: CTAAlert, i: number) => i ==0 || ! (headFilt.slice(0, i - 1).includes(a.Headline + a.ShortDescription)))
    alerts = alerts.filter( (a: CTAAlert) => parseInt(a.AlertId) > parameter);
    
    console.log("remaining", alerts.length)
    
    let nextParameter = alerts.map((a: CTAAlert) => parseInt(a.AlertId)).reduce((a: number, r: number) => r > a ? r : a, 0);
    
    let posts = await Promise.all(alerts.map( async (alert_: CTAAlert) => {
      const text = await getPostText(alert_);
      return text;
    }))
    
    if ( false ) { //!dryRun) {
      const promises = posts.map(async (text: string) => bot.post(text));
      await Promise.all(promises);
    }
    console.log(`>>>${nextParameter}<<<`);
    return posts;
  }
}
