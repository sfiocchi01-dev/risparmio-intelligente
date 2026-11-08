import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allocate, apply, emptyState, total, MAX, parseMoney, validate, backup, readBackup} from '../src/core.js';
const goals=(a=0,b=0)=>[{id:'a',name:'Auto',target:200000,balance:a},{id:'b',name:'Vacanze',target:100000,balance:b}];
const state=(g=goals(),free=0,priority=null)=>({...emptyState(),goals:g,free,priority});

test('cinque esempi approvati',()=>{
  assert.deepEqual(allocate(30000,goals()),{shares:{a:20000,b:10000},free:0});
  assert.deepEqual(allocate(30000,goals(100000,10000)),{shares:{a:0,b:30000},free:0});
  assert.deepEqual(allocate(70000,goals(100000,10000)),{shares:{a:20000,b:50000},free:0});
  assert.deepEqual(allocate(30000,goals(190000),'a'),{shares:{a:10000,b:20000},free:0});
  assert.deepEqual(allocate(15000,goals(195000,95000)),{shares:{a:5000,b:5000},free:5000});
});
test('priorità resta dopo completamento e prelievo',()=>{
  let s=state(goals(200000,0),0,'a');
  s=apply(s,{type:'withdraw',id:'a',amount:100});
  s=apply(s,{type:'deposit',amount:100});
  assert.equal(s.goals[0].balance,200000);assert.equal(s.goals[1].balance,0);assert.equal(s.priority,'a');
});
test('parità stabili e indipendenti dall’ordine',()=>{
  const g=[{id:'b',name:'B',target:100,balance:0},{id:'a',name:'A',target:100,balance:0}];
  assert.equal(allocate(1,g).shares.a,1);
  assert.deepEqual(allocate(1,g),allocate(1,g.toReversed()));
});
test('vuoti, pieni e zero',()=>{
  assert.equal(allocate(100,[]).free,100);
  assert.equal(allocate(100,goals(200000,100000)).free,100);
  assert.deepEqual(allocate(0,goals()).shares,{a:0,b:0});
});
test('1000 categorie con importi massimi',()=>{
  const g=Array.from({length:1000},(_,i)=>({id:`g-${i}`,name:'Goal',target:MAX,balance:0}));
  const result=allocate(MAX,g);
  assert.equal(Object.values(result.shares).reduce((a,b)=>a+b,0),MAX);
});
test('1000 scenari generati: conservazione, limiti, ordine',()=>{
  let seed=42n;
  const next=n=>{seed=(seed*6364136223846793005n+1n)%2n**64n;return Number((seed>>1n)%BigInt(n));};
  for(let i=0;i<1000;i++){
    const g=Array.from({length:1+next(12)},(_,j)=>{const target=next(1000000)+1;return {id:`g-${j}`,name:'Goal',target,balance:next(target+1)};});
    const amount=next(5000000),priority=next(2)?null:g[0].id;
    const r=allocate(amount,g,priority);
    assert.equal(Object.values(r.shares).reduce((a,b)=>a+b,0)+r.free,amount);
    for(const item of g) assert.ok(r.shares[item.id]>=0 && r.shares[item.id]<=item.target-item.balance);
    assert.deepEqual(allocate(amount,g.toReversed(),priority),r);
  }
});
test('importi italiani senza floating point',()=>{
  for(const [s,n] of [['12,34',1234],['12.3',1230],['0,01',1],[' 12 ',1200],['10000000000',MAX]]) assert.equal(parseMoney(s),n);
  for(const s of ['','-1','1e3','1.234,50','1.234','1.','NaN','10000000000.01']) assert.equal(parseMoney(s),null);
});
test('creazione e modifica mantengono saldo iniziale e storico',()=>{
  let s=apply(emptyState(),{type:'create',id:'a',name:'Auto',target:10000,balance:5000});
  assert.equal(total(s),5000);
  s=apply(s,{type:'edit',id:'a',name:'Nuova auto',target:3000});
  assert.equal(s.free,2000);assert.equal(s.goals[0].balance,3000);assert.equal(total(s),5000);
  assert.ok(s.movements[1].text.includes('Auto'));
});
test('versamento e assegnazione esplicita',()=>{
  let s=apply(emptyState(),{type:'deposit',amount:30000});
  assert.equal(s.free,30000);
  s=apply(s,{type:'create',id:'a',name:'Auto',target:100000});
  assert.equal(s.free,30000);assert.equal(s.goals[0].balance,0);
  s=apply(s,{type:'assign',amount:30000});
  assert.equal(s.free,0);assert.equal(s.goals[0].balance,30000);assert.equal(total(s),30000);
});
test('trasferimento conserva il totale',()=>{
  const s=state(goals(10000,0));
  const next=apply(s,{type:'transfer',id:'a',to:'b',amount:1234});
  assert.equal(total(next),total(s));assert.equal(next.goals[1].balance,1234);assert.equal(s.goals[0].balance,10000);
  assert.throws(()=>apply(s,{type:'transfer',id:'a',to:'a',amount:1}));
  assert.throws(()=>apply(s,{type:'transfer',id:'a',to:'b',amount:10001}));
});
test('prelievi parziali e totali dal saldo libero',()=>{
  const s=state(goals(100,100),500);
  const next=apply(s,{type:'withdrawFree',amount:200});
  assert.equal(next.free,300);assert.equal(total(next),total(s)-200);assert.deepEqual(next.goals,s.goals);
  assert.equal(apply(next,{type:'withdrawFree',amount:300}).free,0);
  for(const amount of [0,-1,501]) assert.throws(()=>apply(s,{type:'withdrawFree',amount}));
});
test('eliminazione redistribuisce senza priorità, senza toccare saldo libero esistente',()=>{
  const g=[{id:'delete',name:'Eliminata',target:30000,balance:30000},...goals()];
  const next=apply(state(g,123,'b'),{type:'delete',id:'delete',mode:'redistribute'});
  assert.deepEqual(next.goals.map(g=>g.balance),[20000,10000]);assert.equal(next.free,123);assert.equal(next.priority,'b');
});
test('ultima categoria, eccedenze, cancellazione della priorità',()=>{
  const g=[{id:'delete',name:'Eliminata',target:30000,balance:30000}];
  const next=apply(state(g,123,'delete'),{type:'delete',id:'delete',mode:'redistribute'});
  assert.equal(next.free,30123);assert.equal(next.priority,null);assert.equal(next.goals.length,0);
  const full=apply(state([...g,...goals(200000,100000)]),{type:'delete',id:'delete',mode:'redistribute'});
  assert.equal(full.free,30000);
});
test('eliminazione con prelievo riduce totale e conserva storico',()=>{
  const s=state(goals(60000,10000));
  const next=apply(s,{type:'delete',id:'a',mode:'withdraw'});
  assert.equal(total(next),10000);assert.ok(next.movements[0].text.includes('Auto'));
});
test('rifiuta operazioni non valide senza mutazioni',()=>{
  const s=state();const before=structuredClone(s);
  for(const command of [{type:'deposit',amount:-1},{type:'withdraw',id:'a',amount:1},{type:'delete',id:'missing',mode:'withdraw'},{type:'delete',id:'a',mode:'invalid'},{type:'priority',id:'missing'}]) assert.throws(()=>apply(s,command));
  assert.deepEqual(s,before);
  assert.throws(()=>apply(state(goals(MAX/2,0)),{type:'deposit',amount:MAX}));
});
test('backup roundtrip e timestamp conservato',()=>{
  const date='2026-11-08T12:00:00.000Z';
  const s=apply(emptyState(),{type:'deposit',amount:123},{now:date,id:'movement-1'});
  const restored=readBackup(backup(s));assert.deepEqual(restored,s);assert.equal(restored.movements[0].date,date);
});
test('backup malformati, duplicati, versioni e valori fuori limite',()=>{
  for(const content of ['not-json','{}','{"app":"other"}',JSON.stringify({app:'risparmio-intelligente',state:{...emptyState(),schema:2}})]) assert.throws(()=>readBackup(content));
  assert.throws(()=>validate({...state(),goals:[goals()[0],goals()[0]]}));
  assert.throws(()=>validate({...emptyState(),free:-1}));
  assert.throws(()=>validate({...emptyState(),priority:'missing'}));
  assert.throws(()=>validate({...state(),goals:[{...goals()[0],balance:999999}]}));
  assert.throws(()=>readBackup(' '.repeat(20000001)));
});
test('testi importati restano testo, campi sconosciuti esclusi',()=>{
  const s=state([{id:'a',name:'<img src=x onerror=alert(1)>',target:100,balance:0}]);
  const parsed=JSON.parse(backup(s));parsed.state.untrusted={html:'x'};
  const result=readBackup(JSON.stringify(parsed));
  assert.equal(result.goals[0].name,s.goals[0].name);assert.equal(result.untrusted,undefined);
});
