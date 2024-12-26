import Bot from "./lib/bot.js";
import getPostText from "./lib/getPostText.js";

const argv = process.argv.map(x => parseInt(x)).filter(x =>!Number.isNaN(x))
let dryRun = false;

if (argv.length == 0) {
  console.log('setting dry run is true')
  // this is if the cache doesn't exist
  dryRun = true;
}

const texts = await Bot.run(getPostText, { parameter: argv[0], dryRun: dryRun });

if (dryRun) {
  console.log("\nthis is a dry run. not posting. would have posted the above\n\n");
} else {
  console.log("\nactually posted!\n\n");
}

// texts.map((text: string) => console.log(`[${new Date().toISOString()}] Posted: "${text}"`));
