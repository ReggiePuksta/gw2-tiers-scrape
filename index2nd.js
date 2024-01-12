import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new'
});

const page = await browser.newPage();
await page.goto('https://wiki.guildwars2.com/wiki/Crafting_material/by_tier');

await page.waitForSelector('table.recipe')
let elements = await page.$$('tbody > tr')
const obj = {}
const length = elements.length;
let n = 1;
for (const element of elements) {
  //   // const elementText = await page.evaluate(element => element.textContent, element)
  const tier = await element.evaluate(el => el.firstChild.textContent)
  let itemLink = await element.$('td:nth-child(3) > a');
  // const val1 = await itemLink.evaluate(el => el.textContent)
  if (!obj[tier]) obj[tier] = [];
  await itemLink.click();
  await page.waitForSelector('.infobox.crafting')
  const els = await page.$('.infobox.crafting > div > dl:nth-child(2) > dd > a')
  const val = await els.evaluate(el => el.textContent)

  obj[tier].push(val)
  await page.goBack();
  elements = await page.$$('tbody > tr')
  // print out progress for --verbose option
  if (process.argv[2] === '--verbose')
    process.stdout.write(n++ + '/' + length + '\r')
}
console.log(JSON.stringify(obj))