(function(){
'use strict';
var API = 'https://aisq-intake.mohgoat452.workers.dev';
var TOKEN = (location.hash||'').replace(/^#/,'').replace(/[^A-Za-z0-9_-]/g,'');
var $0 = function(id){return document.getElementById(id)};
function fatal(m){var b=$0('boot');if(b){b.textContent=m;b.className='fail';}}
if(!TOKEN){fatal('هذا الرابط غير مكتمل. افتح الرابط الكامل الذي وصلك.');return;}
fetch(API+'/api/form',{headers:{'X-Client-Token':TOKEN},cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(function(f){var b=$0('boot');if(b)b.hidden=true;start(f.questions,!!f.closed);}).catch(function(e){fatal('تعذر فتح النموذج. الرابط غير صحيح أو أُغلق النموذج.');});
function start(S,SERVER_CLOSED){
// Filled in at deploy time with the private write-only submit URL.
var ENDPOINT = '';
// Set true after the backend is removed: disables submit and says the form is closed.
var CLOSED = SERVER_CLOSED;
var TOTAL = S.reduce(function(a,s){return a+s.items.length},0);
var KEY = 'aisq.answers.v2.'+TOKEN.slice(0,8);
var ans = {}; try { ans = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e) {}
var sidKey = 'aisq.sid.v2.'+TOKEN.slice(0,8), sid;
try { sid = localStorage.getItem(sidKey); } catch(e) {}
if (!sid || !/^[A-Za-z0-9]{16,40}$/.test(sid)) {
  sid = ''; var abc = 'abcdefghijklmnopqrstuvwxyz0123456789', r = new Uint32Array(24); (window.crypto||{getRandomValues:function(a){for(var i=0;i<a.length;i++)a[i]=Math.random()*4e9;}}).getRandomValues(r);
  for (var i=0;i<24;i++) sid += abc[r[i]%36];
  try { localStorage.setItem(sidKey, sid); } catch(e) {}
}
var cur = 0;
var $ = function(id){return document.getElementById(id)};
function done(n){var a=ans[n];return !!a && ((a.c&&a.c.length>0)||(a.t&&a.t.trim().length>0));}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ans));}catch(e){}}
function answered(){var c=0;S.forEach(function(s){s.items.forEach(function(q){if(done(q.n))c++;});});return c;}
function exportText(){
  var lines=['إجابات مؤيد على أسئلة نظام AI Sales Agent','تمت الإجابة على '+answered()+' من '+TOTAL,''],missing=[];
  var who=$('who').value.trim(); if(who) lines.splice(1,0,'الاسم: '+who);
  S.forEach(function(s){var part=[];s.items.forEach(function(q){var a=ans[q.n];if(!done(q.n)){missing.push(q.n);return;}
    part.push(q.n+'. '+q.q);part.push('الجواب: '+[a.c,(a.t||'').trim()].filter(Boolean).join(' | '));part.push('');});
    if(part.length){lines.push('== '+s.title+' ==');Array.prototype.push.apply(lines,part);}});
  if(missing.length)lines.push('أسئلة بلا إجابة: '+missing.join(', '));
  return lines.join('\n');
}
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;}
function refresh(){
  $('count').textContent='أجبت على '+answered()+' من '+TOTAL;
  var tabs=$('tabs');tabs.innerHTML='';
  S.forEach(function(s,i){var b=el('button','tab'+(i===cur?' on':''));b.type='button';
    var d=s.items.filter(function(q){return done(q.n)}).length;
    b.appendChild(el('span',null,(i+1)+'. '+s.title));b.appendChild(el('small',null,d+'/'+s.items.length));
    b.onclick=function(){cur=i;render();window.scrollTo(0,0);};tabs.appendChild(b);});
  $('export').value=exportText();
  $('send').disabled=answered()===0;
}
function render(){
  var s=S[cur],box=$('sec');box.innerHTML='';
  box.appendChild(el('p','secs','القسم '+(cur+1)+' من '+S.length));box.appendChild(el('h2','sech',s.title));box.appendChild(el('p','lead',s.intro));
  s.items.forEach(function(q){
    var w=el('div','q'+(done(q.n)?' done':''));var h=el('div','qh');h.appendChild(el('span','num',String(q.n)));h.appendChild(el('span',null,q.q));w.appendChild(h);
    if(q.hint)w.appendChild(el('p','hint',q.hint));
    if(q.opts){var o=el('div','opts');q.opts.forEach(function(v){var b=el('button','opt'+((ans[q.n]||{}).c===v?' on':''),v);b.type='button';
      b.onclick=function(){var a=ans[q.n]=ans[q.n]||{};a.c=a.c===v?'':v;save();render();};o.appendChild(b);});w.appendChild(o);}
    var t=el('textarea','area');t.rows=q.opts?2:3;t.dir='auto';t.setAttribute('aria-label','جواب السؤال '+q.n);t.placeholder=q.opts?'تفاصيل إضافية (اختياري)':'اكتب إجابتك';t.value=(ans[q.n]||{}).t||'';
    t.oninput=function(){var a=ans[q.n]=ans[q.n]||{};a.t=t.value;save();w.className='q'+(done(q.n)?' done':'');refresh();};
    w.appendChild(t);box.appendChild(w);});
  $('prev').disabled=cur===0;$('next').disabled=cur===S.length-1;refresh();
}
$('prev').onclick=function(){cur=Math.max(0,cur-1);render();window.scrollTo(0,0);};
$('next').onclick=function(){cur=Math.min(S.length-1,cur+1);render();window.scrollTo(0,0);};
$('who').oninput=refresh;
function status(m,c){var e=$('status');e.textContent=m;e.className=c||'';}
$('copy').onclick=function(){var t=exportText();
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){status('تم النسخ','ok');},function(){$('export').select();status('تعذر النسخ تلقائيًا، حدد النص أدناه وانسخه يدويًا.','fail');});};
$('send').onclick=function(){
  if(CLOSED){status('تم إغلاق النموذج ولم يعد يستقبل إجابات. انسخ إجاباتك وأرسلها لمحمد على واتساب إن أردت.','fail');return;}
    var b=$('send');b.disabled=true;status('جارٍ الإرسال...');
  fetch(API+'/api/answers',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','X-Client-Token':TOKEN},body:JSON.stringify({kind:'ai-sales-agent-answers',sid:sid,website:$('website').value,respondent:$('who').value.trim()||null,submittedAt:new Date().toISOString(),answered:answered(),total:TOTAL,text:exportText()})})
  .then(function(r){if(!r.ok)throw new Error(r.status===404?'النموذج غير متاح':r.status===410?'النموذج مغلق':r.status===429?'محاولات كثيرة، انتظر قليلًا':r.status===507?'المخزن ممتلئ':'HTTP '+r.status);return r.json();})
  .then(function(){status('وصلت إجاباتك ('+answered()+' من '+TOTAL+'). يمكنك إضافة المزيد وإعادة الإرسال.','ok');b.disabled=false;})
  .catch(function(e){status('لم يصل الإرسال ('+(e.message||e)+'). انسخ الإجابات وأرسلها لمحمد على واتساب.','fail');b.disabled=false;});
};
render();
}
})();
