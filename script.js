// Helpers
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);
let memory = 0;
let lastAns = 0;

// Tabs && theme
window.addEventListener('DOMContentLoaded', ()=>{
  $$('.tab').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.tab').forEach(b=>b.classList.remove('active'));
    $$('.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('#'+btn.dataset.tab).classList.add('active');
  }));
  $('#themeToggle').addEventListener('click', ()=>document.body.classList.toggle('light'));
  setupCalc();
  setupBases();
  setupUnits();
  setupGraph();
});

// Calculator
function setupCalc(){
  const expr = $('#expr');
  const result = $('#result');
  const hist = $('#history');
  const insert = (txt)=>{
    const s = expr.selectionStart ?? expr.value.length;
    expr.value = expr.value.slice(0,s) + txt + expr.value.slice(s);
    expr.focus();
    expr.selectionStart = expr.selectionEnd = s + txt.length;
  };
  document.querySelectorAll('[data-insert]').forEach(b=>b.addEventListener('click',()=>insert(b.dataset.insert)));
  document.querySelectorAll('[data-fn]').forEach(b=>b.addEventListener('click',()=>{
    const fn=b.dataset.fn;
    if(fn==='del'){ expr.value = expr.value.slice(0,-1); }
    else if(fn==='clr'){ expr.value=''; result.value=''; }
    else if(fn==='eq'){
      try{
        const v = evaluateExpression(expr.value);
        result.value = v;
        lastAns = v;
        pushHistory(expr.value, v);
      }catch(e){ result.value = 'Erro: '+e.message; }
    } else if(fn==='mc'){ memory=0; }
    else if(fn==='mr'){ insert(String(memory)); }
    else if(fn==='mplus'){ try{ memory += Number(evaluateExpression(expr.value||'0'))||0; }catch{} }
    else if(fn==='mminus'){ try{ memory -= Number(evaluateExpression(expr.value||'0'))||0; }catch{} }
    else if(fn==='ans'){ insert(String(lastAns)); }
  }));
  expr.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){ e.preventDefault(); document.querySelector('[data-fn="eq"]').click(); }
    if(e.key==='Escape'){ e.preventDefault(); document.querySelector('[data-fn="clr"]').click(); }
  });
  $('#clearAll').addEventListener('click',()=>{ expr.value=''; result.value=''; hist.innerHTML=''; memory=0; lastAns=0; });
  function pushHistory(e,v){
    const li=document.createElement('li');
    const left=document.createElement('span'); left.innerHTML = `<code>${escapeHtml(e)}</code>`;
    const right=document.createElement('strong'); right.textContent = String(v);
    li.append(left,right); li.addEventListener('click',()=>{ expr.value=e; result.value=v; });
    hist.prepend(li);
    while(hist.children.length>50) hist.removeChild(hist.lastChild);
  }
}
function escapeHtml(s){ return s.replace(/[&<>\"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// Expression evaluator (tokenize -> shunting-yard -> RPN eval)
const CONSTS = { pi: Math.PI, e: Math.E };
const FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  sqrt: Math.sqrt, ln: Math.log,
  log10: Math.log10 ? Math.log10 : (x)=>Math.log(x)/Math.log(10),
};
const PREC = { '+':1,'-':1,'*':2,'/':2,'%':3,'^':4,'!':5 };
const RIGHT_ASSOC = { '^': true };

function evaluateExpression(expr){
  const tokens = tokenize(expr);
  const rpn = toRPN(tokens);
  return evaluateRPN(rpn);
}
function tokenize(s){
  s = String(s||'').replace(/\s+/g,'');
  const tokens=[]; let i=0;
  while(i<s.length){
    const c=s[i];
    if(/[0-9.]/.test(c)){
      let j=i+1; while(j<s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({t:'num',v:parseFloat(s.slice(i,j))}); i=j; continue;
    }
    if(/[a-z]/i.test(c)){
      let j=i+1; while(j<s.length && /[a-z0-9]/i.test(s[j])) j++;
      const name=s.slice(i,j);
      if(CONSTS[name]!==undefined) tokens.push({t:'num',v:CONSTS[name]});
      else tokens.push({t:'id',v:name});
      i=j; continue;
    }
    if(c==='('||c===')'||c===','){ tokens.push({t:c}); i++; continue; }
    if('+−-*/^%!'.includes(c)) { tokens.push({t:'op',v:c}); i++; continue; }
    if(c==='×' || c==='÷'){ tokens.push({t:'op',v:(c==='×')?'*':'/'}); i++; continue; }
    throw new Error('Caractere inválido: '+c);
  }
  return tokens;
}
function toRPN(tokens){
  const out=[]; const st=[]; let prev=null;
  for(const tk of tokens){
    if(tk.t==='num'){ out.push(tk); }
    else if(tk.t==='id'){ st.push(tk); }
    else if(tk.t==='op'){
      let op=tk.v;
      if((op==='-'||op==='+'||op==='−') && (!prev || (prev.t!=='num' && prev.t!==')' && prev.t!=='!'))){
        out.push({t:'num',v:0}); op=(op==='−')?'-':op; st.push({t:'op',v:op});
      } else {
        while(st.length){
          const top=st[st.length-1];
          if(top.t==='op' && ((PREC[top.v]>PREC[op]) || (PREC[top.v]===PREC[op] && !RIGHT_ASSOC[op]))){
            out.push(st.pop());
          } else break;
        }
        st.push({t:'op',v:op});
      }
    }
    else if(tk.t==='('){ st.push(tk); }
    else if(tk.t===')'){
      while(st.length && st[st.length-1].t!=='('){ out.push(st.pop()); }
      if(!st.length) throw new Error('Parênteses desbalanceados');
      st.pop();
      if(st.length && st[st.length-1].t==='id'){ out.push(st.pop()); }
    }
    else if(tk.t===','){
      while(st.length && st[st.length-1].t!=='('){ out.push(st.pop()); }
      if(!st.length) throw new Error('Vírgula fora de função');
    }
    prev=tk;
  }
  while(st.length){
    const x=st.pop();
    if(x.t==='('||x.t===')') throw new Error('Parênteses desbalanceados');
    out.push(x);
  }
  return out;
}
function fact(n){ if(n<0||!Number.isFinite(n)) throw new Error('fatorial inválido'); let r=1; for(let i=2;i<=Math.floor(n);i++) r*=i; return r; }
function evaluateRPN(rpn){
  const st=[];
  for(const tk of rpn){
    if(tk.t==='num') st.push(tk.v);
    else if(tk.t==='id'){
      const a=st.pop(); const fn=FUNCS[tk.v]; if(!fn) throw new Error('função desconhecida: '+tk.v);
      st.push(fn(a));
    } else if(tk.t==='op'){
      if(tk.v==='!'){ st.push(fact(st.pop())); continue; }
      const b=st.pop(); const a=st.pop();
      switch(tk.v){
        case '+': st.push(a+b); break;
        case '-': case '−': st.push(a-b); break;
        case '*': st.push(a*b); break;
        case '/': st.push(a/b); break;
        case '^': st.push(Math.pow(a,b)); break;
        case '%': st.push(a*b/100); break;
        default: throw new Error('op inválido: '+tk.v);
      }
    }
  }
  if(st.length!==1) throw new Error('Expressão inválida');
  return st[0];
}

// Bases
function setupBases(){
  $('#convertBase').addEventListener('click',()=>{
    const v = $('#baseInput').value.trim();
    const from = parseInt($('#baseFrom').value,10);
    const to = parseInt($('#baseTo').value,10);
    try{
      const n = parseInt(v, from);
      if(isNaN(n)) throw new Error('Número inválido para a base de origem');
      $('#baseOutput').value = n.toString(to).toUpperCase();
    }catch(e){
      $('#baseOutput').value = 'Erro: '+e.message;
    }
  });
}

// Units (length, mass, temperature)
const units = {
  length: { m:1, km:1000, cm:0.01, mm:0.001 },
  mass: { kg:1, g:0.001, lb:0.45359237 },
  temp: { C:'C', F:'F', K:'K' }
};
function setupUnits(){
  const from = $('#unitFrom'), to = $('#unitTo');
  const options = [
    {g:'Comprimento', items:['m','km','cm','mm']},
    {g:'Massa', items:['kg','g','lb']},
    {g:'Temperatura', items:['C','F','K']},
  ];
  function fill(sel){
    sel.innerHTML = '';
    options.forEach(gr=>{
      const og = document.createElement('optgroup'); og.label = gr.g;
      gr.items.forEach(u=>{ const opt=document.createElement('option'); opt.value=u; opt.textContent=u; og.append(opt); });
      sel.append(og);
    });
    sel.value = sel === from ? 'm' : 'km';
  }
  fill(from); fill(to);
  $('#convertUnit').addEventListener('click',()=>{
    const value = parseFloat($('#unitValue').value);
    const uFrom = from.value, uTo = to.value;
    if(Number.isNaN(value)){ $('#unitResult').value='Informe um valor válido'; return; }
    try{
      $('#unitResult').value = String(convertUnit(value, uFrom, uTo));
    }catch(e){ $('#unitResult').value = 'Erro: '+e.message; }
  });
}
function convertUnit(val, a, b){
  // temperature
  const isTemp = (u)=>['C','F','K'].includes(u);
  if(isTemp(a) || isTemp(b)){
    if(!(isTemp(a)&&isTemp(b))) throw new Error('Conversão entre temperatura e outras unidades não é suportada');
    let C;
    if(a==='C') C = val;
    else if(a==='K') C = val - 273.15;
    else if(a==='F') C = (val - 32) * 5/9;
    if(b==='C') return C;
    if(b==='K') return C + 273.15;
    if(b==='F') return C * 9/5 + 32;
  }
  // length
  if(a in units.length && b in units.length){
    return val * units.length[a] / units.length[b];
  }
  // mass
  if(a in units.mass && b in units.mass){
    return val * units.mass[a] / units.mass[b];
  }
  throw new Error('Unidade não suportada');
}

// Graph
function setupGraph(){
  $('#plot').addEventListener('click',()=>{
    const ex = $('#graphExpr').value.trim();
    const xmin = parseFloat($('#xMin').value);
    const xmax = parseFloat($('#xMax').value);
    plotExpression(ex, xmin, xmax);
  });
}
function plotExpression(expr, xmin, xmax){
  const canvas = $('#canvas'); const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // axes
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#666';
  ctx.beginPath();
  const ox = mapX(0,xmin,xmax,canvas.width);
  const oy = mapY(0,-5,5,canvas.height);
  ctx.moveTo(0, oy); ctx.lineTo(canvas.width, oy);
  ctx.moveTo(ox, 0); ctx.lineTo(ox, canvas.height);
  ctx.stroke();

  // plot
  ctx.beginPath();
  let started=false;
  const samples = 1000;
  for(let i=0;i<=samples;i++){
    const x = xmin + (xmax-xmin)*i/samples;
    let y;
    try{
      y = evaluateExpression(expr.replace(/\bx\b/g, String(x)).replace(/\^/g,'^'));
    }catch{ y = NaN; }
    if(Number.isFinite(y)){
      const px = mapX(x, xmin, xmax, canvas.width);
      const py = mapY(y, -5, 5, canvas.height);
      if(!started){ ctx.moveTo(px, py); started=true; } else { ctx.lineTo(px, py); }
    }else{
      started=false;
      ctx.stroke();
      ctx.beginPath();
    }
  }
  ctx.stroke();
}
function mapX(x, xmin, xmax, w){ return (x - xmin) * w / (xmax - xmin); }
function mapY(y, ymin, ymax, h){ return h - (y - ymin) * h / (ymax - ymin); }
