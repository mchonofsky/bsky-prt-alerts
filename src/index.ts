import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";

const argv = process.argv.map(x => parseInt(x)).filter(x =>!Number.isNaN(x))
let dryRun = true;

if (argv.length == 0) {
  console.log('setting dry run true')
  dryRun = true;
}

const texts = await Bot.run(getPostText, { parameter: argv[0], dryRun: dryRun });

if (dryRun) {
  texts.map((text: string) => console.log(`[${new Date().toISOString()}] Posted: "${text}"`));
}
