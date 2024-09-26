const cheerio = require('cheerio');
const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

let url; 
fetch('http://localhost:5000/summary')
.then(response => {
  if (!response.ok) {
    throw new Error('네트워크 응답에 문제가 있습니다.');
  }
  return response.json();
})
.then(data => {
  url = data ;
  crawlPTags(url);
  // 데이터를 화면에 표시하거나 필요한 작업 수행
})
.catch(error => {
  console.error('에러 발생:', error);
});


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB에 연결되었습니다.'))
  .catch(err => console.error('MongoDB 연결 에러:', err));

app.get('/', (req, res) => {
    res.send('안녕하세요! REST API가 작동 중입니다.');
});

app.get('/gettext',(req, res) => {
    res.send(crawlPTags(url));
})

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작되었습니다.`);
  });
  
  
/**
 * DOM 노드를 재귀적으로 탐색하여 <p> 태그를 수집하는 함수
 * @param {CheerioElement} node - 현재 노드
 * @param {CheerioStatic} $ - Cheerio 인스턴스
 * @param {Array} pTags - 수집된 <p> 태그를 저장할 배열
 */
function collectPTags(node, $, pTags) {
    if (node.type === 'tag') {
        if (node.name === 'p') {
            pTags.push($(node).text());
        }

        // 자식 노드가 있는 경우 재귀적으로 탐색
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                collectPTags(child, $, pTags);
            });
        }
    }
}

const newsText = [];

/**
 * 주어진 URL에서 HTML을 가져와 모든 <p> 태그를 수집하는 함수
 * @param {string} url - 크롤링할 URL
 */
async function crawlPTags(url) {
    try {
        // HTML 가져오기
        const { data: html } = await axios.get(url);

        // Cheerio를 사용하여 HTML 로드
        const $ = cheerio.load(html);

        const pTags = [];

        // DOM의 루트 노드부터 시작하여 재귀적으로 탐색
        $.root()
            .children()
            .each((i, elem) => {
                collectPTags(elem, $, pTags);
            });

       pTags.forEach((text, index) => {
            newsText.push(text);
        });

        const allText = newsText.join(" ");
        //console.log(allText);
        return allText;
    } catch (error) {
        console.error('크롤링 오류:', error.message);
    }
}

// 예제 URL (원하는 URL로 변경 가능)
