import puppeteer from 'puppeteer';
import fs from 'node:fs';

const browser = await puppeteer.launch({
  headless: 'new'
});

const page = await browser.newPage();
await page.goto('https://wiki.guildwars2.com/wiki/Crafting_material/by_tier');

await page.waitForSelector('table.recipe')
let elements = await page.$$eval('tbody > tr', (els) => {
  const urlFront = 'https://wiki.guildwars2.com';
  return els.map(el => {
    const itemUrl = el.children[2].firstChild.getAttribute('href');
    return {
      tier: el.firstChild.textContent,
      url: urlFront + itemUrl
    }
  })
});

const length = elements.length;
let n = 1;
const tiersByLevel = {};
const tiersByItem = {};
console.time();
for (const element of elements) {
  await page.goto(element.url)
  await page.waitForSelector('.infobox.crafting')
  const tier = element.tier;
  if (!tiersByLevel[tier]) tiersByLevel[tier] = []
  const els = await page.$('.infobox.crafting > div > dl:nth-child(2) > dd > a')
  const val = await els.evaluate(el => el.textContent)
  const multipleIds = val.split(', ');
  // Some link values have multiple ids for the same item
  if (multipleIds.length > 1) {
    console.log("Found a link with multiple item ids: ", multipleIds);
    multipleIds.forEach(id => {
      tiersByLevel[tier].push(id * 1);
      tiersByItem[id] = tier * 1;
    });
  }
  else {
    // convert to number
    tiersByLevel[tier].push(val * 1);
    tiersByItem[val] = tier * 1;
  }
  // print out progress
  if (process.argv[2] !== '--silent')
    process.stdout.write(n++ + '/' + length + '\r')
};

await browser.close();

console.log("Scraping took: ");
console.timeEnd();

console.log('Writing to file...');
fs.writeFileSync('./tiers_by_level.json', JSON.stringify(tiersByLevel));
fs.writeFileSync('./tiers_by_item.json', JSON.stringify(tiersByItem));
console.log('Done');
