import puppeteer from 'puppeteer';
import fs from 'node:fs';

const browser = await puppeteer.launch({
  headless: "new"
});

const page = await browser.newPage();
await page.goto('https://wiki.guildwars2.com/wiki/Crafting_material/by_tier');

await page.waitForSelector('table.recipe');

// Get necessary data from "Crafting materials page"
let itemsData = await page.$$eval('tbody > tr', (itemsBox) => {
  const urlFront = 'https://wiki.guildwars2.com';
  return itemsBox.map(itemElement => {
    const itemUrl = itemElement.children[2].firstChild.getAttribute('href');
    /**
     * Convert material type names:
     * Advanced Crafting Materials -> advanced
     * Basic Crafting Materials -> basic
     * Intermediate Crafting Materials -> intermediate
     * Gemstones and Jewels -> gemstones
     * Ascended Materials -> ascended
     */
    const type = itemElement.lastChild.textContent.split(' ')[0].toLowerCase();
    return {
      tier: itemElement.firstChild.textContent,
      type,
      url: urlFront + itemUrl
    }
  })
});

const itemsAmount = itemsData.length;
let itemsDone = 1;
const materialsInfo = {};
const materialsByTier = {};
console.time();
for (const itemData of itemsData) {
  // Visit each individual item url and get it's Id
  await page.goto(itemData.url);
  await page.waitForSelector('.infobox.crafting')
  const tier = itemData.tier;
  const type = itemData.type;
  if (!materialsByTier[tier]) materialsByTier[tier] = []
  const itemIdElement = await page.$('.infobox.crafting > div > dl:last-child > dd > a')
  const itemId = await itemIdElement.evaluate(el => el.textContent)
  // Check if item is associated with multiple ids
  const multipleIds = itemId.split(', ');
  if (multipleIds.length > 1) {
    console.log("Found a link with multiple item ids: ", multipleIds);
    multipleIds.forEach(singleId => {
      materialsInfo[singleId] = { type: type, tier: tier * 1 };
      materialsByTier[tier].push(singleId * 1);
    });
  }
  else {
    // convert itemId to number
    materialsInfo[itemId] = { type: type, tier: tier * 1 };
    materialsByTier[tier].push(itemId * 1);
  }
  // print out progress
  if (process.argv[2] !== '--silent')
    process.stdout.write(itemsDone++ + '/' + itemsAmount + '\r')
}

await browser.close();

console.log("Scraping took: ");
console.timeEnd();
console.log("Total items: ", itemsAmount);

console.log('Writing to file...');
fs.writeFileSync('./output/materials_info.json', JSON.stringify(materialsInfo));
fs.writeFileSync('./output/materials_by_tier.json', JSON.stringify(materialsByTier));
console.log('Done');
