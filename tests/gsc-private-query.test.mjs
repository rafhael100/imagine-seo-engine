import test from 'node:test';
import assert from 'node:assert/strict';
import {isSensitiveGscQuery as privateQuery}
  from '../src/gsc-private-query.mjs';

test('F89 detects compatibility-width and invisible-format identity patterns',()=>{
  for(const q of [
    'pessoa@example.com','pessoa＠example.com',
    '１２３．４５６．７８９－０９',
    '１２．３４５．６７８／０００１－９０',
    'CPF\u200b 12345678909',
    'cnpj\u2060: 12345678000190',
    '123.\u202e456.789-09',
    '+５５ (１１) ９８７６５－４３２１'
  ])assert.equal(privateQuery(q),true,'syntactic redaction expected');
});
test('F89 preserves nonprivate reviewed search themes and does not coerce values',()=>{
  for(const q of [
    'criação de sites profissionais',
    'landing page para imobiliária',
    'SEO e Google Ads',
    'anúncios Meta Ads 2026'
  ])assert.equal(privateQuery(q),false,'ordinary topic must remain reviewable');
  for(const value of [null,undefined,false,0,{},[],Symbol('private')])
    assert.equal(privateQuery(value),false);
});
test('F89 never returns query text, a report or an authorization',()=>{
  for(const q of ['pessoa＠exemplo.com','123.\u200b456.789-09']){
    const outcome=privateQuery(q);
    assert.equal(typeof outcome,'boolean');
    assert.equal(outcome,true);
  }
});
