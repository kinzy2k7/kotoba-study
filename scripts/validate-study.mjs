import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=f=>JSON.parse(fs.readFileSync(`public/data/${f}.json`,'utf8'));
const vocab=read('vocab'),base=read('vocab-base'),kanji=read('kanji'),grammar=read('grammar');
for(const words of [vocab,base]){
 assert.equal(new Set(words.map(w=>w.lesson)).size,50);
 assert.equal(new Set(words.map(w=>w.id)).size,words.length,'Duplicate vocabulary identity');
 for(const w of words){assert(w.jp&&w.kana&&w.meaning);assert(w.lesson>=1&&w.lesson<=50);}
}
assert.equal(kanji.length,512);assert.equal(new Set(kanji.map(w=>w.jp)).size,512);
for(let n=1;n<=32;n++)assert.equal(kanji.filter(w=>w.lesson===n).length,16);
assert.equal(new Set(grammar.map(g=>g.lesson)).size,50);
assert.equal(new Set(grammar.map(g=>g.id)).size,grammar.length);
for(const g of grammar){
 assert(g.title&&g.pattern&&g.explanation&&g.pitfall);
 assert.equal(new Set(g.quiz.options).size,4);assert.equal(g.quiz.options.length,4);
 assert(Number.isInteger(g.quiz.answer)&&g.quiz.answer>=0&&g.quiz.answer<4);
 for(const e of g.examples){assert.equal(e.tokens.join('').replace(/\s/g,''),e.jp.replace(/\s/g,''));assert(e.kana&&e.vi);assert(!/[A-Za-z]/.test(e.kana),'Unexpected Latin text in kana: '+g.id);}
}
assert(vocab.some(w=>w.lesson===7&&w.jp==='スマホ（スマートフォン）')||vocab.some(w=>w.lesson===7&&w.jp.startsWith('スマホ')));
assert(vocab.some(w=>w.lesson===14&&w.jp==='避難します'));
assert(!vocab.some(w=>w.lesson===2&&w.jp==='CD'));
assert(!vocab.some(w=>w.lesson===41&&w.jp==='管理人'));
assert(vocab.some(w=>w.lesson===26&&w.jp==='管理人'));
assert.equal(grammar.find(g=>g.id==='g7-31').examples[0].kana,'ははにはなをあげました。');
console.log(`Validated ${vocab.length} updated vocabulary entries, ${base.length} base entries, ${kanji.length} Kanji items, ${grammar.length} grammar points across 50 lessons.`);
