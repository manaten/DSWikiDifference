const axios = require('axios');
const lodash = require('lodash');
const dateFormat = require('dateformat');

const JA_BASE_URL = 'https://dont-starve.fandom.com/ja';
const EN_BASE_URL = 'https://dontstarve.fandom.com';
const WAIT_MSEC = 200;

const wait = (msec) => new Promise(resolve => setTimeout(resolve, msec));

const listAllEntries = async (baseUrl) => {
  const result = [];
  let offset = '';
  while (true) {
    const { data } = await axios.get(`${baseUrl}/api/v1/Articles/List?limit=200&offset=${encodeURIComponent(offset)}`);
    offset = data.offset;
    result.push(...data.items);
    if (!offset) {
      return result;
    }
    await wait(WAIT_MSEC);
  }
};

const main = async () => {

  console.log(`ページ更新時刻: ${dateFormat(new Date(), "yyyy年mm月dd日 HH時MM分ss秒")}`);
  console.log('\n');
  
  const jaData = await listAllEntries(JA_BASE_URL);
  console.log(`日本語版wikiには${jaData.length}のページがあります。`);
  
  const enData = await listAllEntries(EN_BASE_URL);
  console.log(`英語版wikiには${enData.length}のページがあります。`);
  
  console.log('\n');
  const diff = lodash.differenceBy(enData, jaData, item => item.title);
  console.log(diff.map(item => `* [[${item.title}]] ({{en|${item.title}|英語}})`).join('\n'));
};
main().catch(e => console.error(e));