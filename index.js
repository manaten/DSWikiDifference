const axios = require('axios');
const lodash = require('lodash');
const dateFormat = require('dateformat');

const JA_BASE_URL = 'https://dont-starve.fandom.com/ja';
const EN_BASE_URL = 'https://dontstarve.fandom.com';
const WAIT_MSEC = 200;

const HEADER = `
この記事は、[https://github.com/manaten/DSWikiDifference プログラム] を用いて日本語版Wikiと英語版Wikiのページ一覧を比較し、英語版にしかないページの一覧をリストにしたものです。

----\n\n`;

const wait = (msec = WAIT_MSEC) => new Promise(resolve => setTimeout(resolve, msec));

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
    await wait();
  }
};

const getEntryAsSimpleJson = async (id, baseUrl = EN_BASE_URL) => {
  const { data } = await axios.get(`${baseUrl}/api/v1/Articles/AsSimpleJson?id=${id}`);
  return data;
};

const isImportantPage = (title) =>
  !/^Don't Starve Wiki/.test(title)
  && !/^Guides/.test(title)
  && !/quotes$/.test(title);

const main = async () => {
  console.log(HEADER);

  console.log(`ページ更新時刻: '''${dateFormat(new Date(), "yyyy年mm月dd日 HH時MM分ss秒")}'''`);
  console.log('\n');
  
  const jaData = await listAllEntries(JA_BASE_URL);
  console.log(`更新日現在、日本語版wikiには'''${jaData.length}'''のページがあり、`);
  
  const enData = await listAllEntries(EN_BASE_URL);
  console.log(`英語版wikiには'''${enData.length}'''のページがあります。`);
  
  console.log('\n');
  const diff = lodash.differenceBy(enData, jaData, item => item.title);

  const result = [];
  for (const item of diff) {
    const entryData = await getEntryAsSimpleJson(item.id);
    
    let isRedirect = false;
    let redirectTo = '';

    try {
      isRedirect = /^redirect/i.test(entryData.sections[0].content[0].elements[0].text);
      redirectTo = isRedirect ? entryData.sections[0].content[0].elements[0].text.replace(/^redirect\s*/i, '') : '';
    } catch(e) {
      console.error(e, item, JSON.stringify(entryData, null, 2));
    }
    result.push({ ...item, isRedirect, redirectTo });
    
    await wait();
  }

  
  console.log('==通常のページ==');
  console.log(result.filter(i => !i.isRedirect).filter(i => isImportantPage(i.title)).map(item => `* [[${item.title}]] ({{en|${item.title}|英語}})`).join('\n'));
  
  console.log('\n');
  console.log('===重要でなさそうなページ(独断と偏見)===');
  console.log(result.filter(i => !i.isRedirect).filter(i => !isImportantPage(i.title)).map(item => `* [[${item.title}]] ({{en|${item.title}|英語}})`).join('\n'));
  
  // console.log('\n');
  // console.log('==リダイレクトページ==');
  // console.log(result.filter(i => i.isRedirect).map(item => `* [[${item.title}]] ({{en|${item.title}|英語}}) => [[${item.redirectTo}]] ({{en|${item.redirectTo}|英語}})`).join('\n'));
};
main().catch(e => console.error(e));