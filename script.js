'use strict';
/* ===== DADOS DO JOGO (fácil de modificar) ===== */
const ORCAMENTO = 20;      // R$ fictício, valor didático
const LIMITE_UNID = 3;     // máximo de unidades de cada alimento
const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

// Ações de higienização. "why" explica o que a ação faz quando é a correta.
const ACOES = {
  agua:      {t:'Abrir a torneira e dar uma passada na água, esfregando de leve', why:'A água corrente com fricção leve solta a sujeira da superfície antes do molho.'},
  sanitizar: {t:'Deixar de molho em hipoclorito de sódio próprio para alimentos (diluição e tempo do rótulo)', why:'Todo alimento consumido cru passa pelo produto próprio para alimentos, que ajuda a eliminar microrganismos. Siga a diluição e o tempo de contato do rótulo (em geral, cerca de 15 minutos).'},
  enxague:   {t:'Enxaguar muito bem em água corrente', why:'O enxágue abundante retira o produto do alimento, conforme indicado no rótulo.'},
  remover:   {t:'Retirar as partes impróprias para o consumo', why:'Só depois de higienizar, retiram-se as partes que não serão consumidas (estragadas, talos, cascas quando for o caso).'},
  proximo:   {t:'Passar para o próximo alimento', why:'Cada alimento é higienizado por completo antes de passar ao próximo.'},
  detergente:{t:'Lavar com detergente de louça',                why:'Detergente de louça não é produto próprio para alimentos e pode deixar resíduos.'},
  sem_lavar: {t:'Só descascar, sem lavar antes',                why:'Sem lavar antes, a sujeira e os microrganismos da casca passam para as mãos, a faca e a parte comestível.'}
};
const SEQUENCIA = ['agua','sanitizar','enxague','remover','proximo']; // mesma ordem para todos os alimentos

const ALIMENTOS = {
  pepino: {nome:'Pepino', preco:4, cor:'#3b9a52', steps:SEQUENCIA,
    acoes:['remover','agua','proximo','sanitizar','enxague','detergente'],
    dica:'Costuma ser comido cru, às vezes com casca.', hints:{}},
  laranja: {nome:'Laranja', preco:3, cor:'#ee8a1f', steps:SEQUENCIA,
    acoes:['remover','agua','proximo','sanitizar','enxague','sem_lavar'],
    dica:'A casca normalmente é descartada, mas as mãos e a faca encostam nela.', hints:{}},
  couve: {nome:'Couve', preco:5, cor:'#1f7a3d', steps:SEQUENCIA,
    acoes:['remover','agua','proximo','sanitizar','enxague','detergente'],
    dica:'Folhas sobrepostas retêm terra: ao lavar, abra bem as folhas.', hints:{}}
};

/* ===== ESTADO ===== */
let S;
function novoEstado(){
  S = {cesta:{pepino:0,laranja:0,couve:0}, gasto:0, comprados:[], foods:{}, sel:null, pontos:0};
}
const $ = id => document.getElementById(id);
const total = () => Object.keys(S.cesta).reduce((s,k)=>s+S.cesta[k]*ALIMENTOS[k].preco,0);

/* ===== ILUSTRAÇÕES SVG ===== */
function arte(id){
  const c = ALIMENTOS[id].cor;
  if(id==='pepino') return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="34" width="84" height="32" rx="16" fill="${c}" transform="rotate(-25 50 50)"/><g stroke="#a5d6a7" stroke-width="3" stroke-linecap="round" transform="rotate(-25 50 50)"><path d="M28 46v8M44 44v12M60 44v12M74 47v6"/></g></svg>`;
  if(id==='laranja') return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="56" r="34" fill="${c}"/><path d="M50 22c8-12 22-8 24-6-4 10-14 12-24 6z" fill="#2f8f4a"/><circle cx="38" cy="46" r="3" fill="#f7b45d"/><circle cx="58" cy="64" r="3" fill="#f7b45d"/></svg>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 92C14 78 8 40 26 22c10-8 18 0 24 4 6-4 14-12 24-4 18 18 12 56-24 70z" fill="${c}"/><path d="M50 92V30M50 60L30 44M50 52l20-14M50 74L34 62M50 70l16-10" stroke="#a5d6a7" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}

/* ===== NAVEGAÇÃO ===== */
function mostrar(n){
  [1,2,3].forEach(i=>{ $('s'+i).hidden = i!==n; $('nav'+i).classList.toggle('on', i===n); });
  window.scrollTo(0,0);
}
function cabecalho(){
  $('hdrSaldo').textContent = fmt(ORCAMENTO - (S.gasto || total()));
  $('hdrPontos').textContent = S.pontos;
}

/* ===== SESSÃO 1: MERCADO ===== */
function renderMercado(){
  const itens = Object.keys(S.cesta).filter(k=>S.cesta[k]>0);
  $('cartList').innerHTML = itens.length ? itens.map(k=>
    `<li><span>${S.cesta[k]}× ${ALIMENTOS[k].nome}</span><span>${fmt(S.cesta[k]*ALIMENTOS[k].preco)}<button data-rem="${k}" aria-label="Remover ${ALIMENTOS[k].nome}">−</button></span></li>`).join('')
    : '<li>Cesta vazia</li>';
  $('cartTotal').textContent = fmt(total());
  $('cartSaldo').textContent = fmt(ORCAMENTO - total());
  $('btnConfirm').disabled = itens.length === 0;
  atualizarCesta();
  const qtd = itens.reduce((s,k)=>s+S.cesta[k],0);
  $('resumo1').textContent = `Cesta: ${qtd} item(ns) · Total ${fmt(total())} · Saldo ${fmt(ORCAMENTO-total())}`;
  cabecalho();
}
function msg(el, texto, tipo){
  el.textContent = texto; el.className = 'msg ' + (tipo||'');
  if(el.id === 'msg1'){ const d = $('dica1'); d.textContent = texto; d.className = 'msg ' + (tipo||''); } // espelha o aviso perto da cena (útil no celular)
}
// Rola a tela até um elemento (sem animação se o usuário preferir menos movimento)
function rolarPara(el){
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({behavior: reduz ? 'auto' : 'smooth', block:'start'});
}

function adicionar(id){
  const a = ALIMENTOS[id];
  if(S.cesta[id] >= LIMITE_UNID) return msg($('msg1'), `Limite de ${LIMITE_UNID} unidades de ${a.nome} por compra.`, 'err');
  if(total() + a.preco > ORCAMENTO) return msg($('msg1'), `Saldo insuficiente para ${a.nome}. Remova algo da cesta para liberar saldo.`, 'err');
  S.cesta[id]++; msg($('msg1'), `${a.nome} adicionado.`, 'ok'); renderMercado();
}
function remover(id){
  if(S.cesta[id] > 0){ S.cesta[id]--; msg($('msg1'), `${ALIMENTOS[id].nome} removido.`, 'info'); renderMercado(); }
}
function confirmarCompra(){
  if(total() === 0) return msg($('msg1'), 'Compre pelo menos um alimento para avançar.', 'err');
  S.gasto = total();
  S.comprados = Object.keys(S.cesta).filter(k=>S.cesta[k]>0);
  S.comprados.forEach(id=>{ S.foods[id] = {i:0, erros:0, acertos:0, corrigidos:0, falhouPasso:false, done:false}; });
  S.pontos += 10; // planejou dentro do orçamento (o sistema impede ultrapassar)
  S.sel = S.comprados[0];
  irParaCasa();
}

/* ===== SESSÃO 2: HIGIENIZAÇÃO ===== */
function renderHigiene(){
  $('tabs').innerHTML = S.comprados.map(id=>
    `<button class="tab ${S.sel===id?'sel':''} ${S.foods[id].done?'done':''}" data-food="${id}">${ALIMENTOS[id].nome} ${S.foods[id].done?'✔':''}</button>`).join('');
  const id = S.sel, a = ALIMENTOS[id], f = S.foods[id];
  $('visual').innerHTML = arte(id) + '<div class="dirt"></div>';
  $('visual').style.setProperty('--dirt', 1 - f.i / a.steps.length);
  $('foodTitle').textContent = a.nome;
  $('foodHint').textContent = a.dica;
  $('progress').firstElementChild.style.width = (f.i / a.steps.length * 100) + '%';
  $('progressTxt').textContent = f.done ? 'Higienização concluída' : `Etapa ${f.i+1} de ${a.steps.length}`;
  $('actions').innerHTML = a.acoes.map(k=>
    `<button data-act="${k}" ${f.done?'disabled':''} class="${a.steps.indexOf(k) > -1 && a.steps.indexOf(k) < f.i ? 'used':''}">${k==='proximo' && S.comprados.filter(x=>!S.foods[x].done).length===1 ? 'Finalizar a higienização' : ACOES[k].t}</button>`).join('');
  $('btnFinish').disabled = !S.comprados.every(k=>S.foods[k].done);
  cabecalho();
}
function agir(k){
  const id = S.sel, a = ALIMENTOS[id], f = S.foods[id], fb = $('feedback');
  if(f.done) return;
  const esperado = a.steps[f.i];
  if(k === esperado){
    f.acertos++;
    if(f.falhouPasso){ S.pontos += 5; f.corrigidos++; f.falhouPasso = false; } else S.pontos += 10;
    f.i++;
    msg(fb, 'Correto! ' + ACOES[k].why, 'ok');
    const v = $('visual'); v.classList.remove('splash'); void v.offsetWidth;
    if(['agua','folha','enxague','sanitizar'].includes(k)) v.classList.add('splash');
    if(f.i >= a.steps.length){ f.done = true; if(S.comprados.every(k=>k===id||S.foods[k].done)) setTimeout(()=>{ msg($('dica2'),'Tudo higienizado! Toque na Mesa para finalizar.','ok'); rolarPara($('palco2')); }, 900); S.pontos += 15; msg(fb, `Correto! ${ACOES[k].why} ${a.nome} concluído. Lembre-se: a lavagem não garante ausência de resíduos.`, 'ok'); const prox = S.comprados.find(x=>!S.foods[x].done); if(prox) S.sel = prox; }
  } else {
    f.erros++; f.falhouPasso = true;
    let m;
    if(a.hints[k]) m = a.hints[k];
    else if(a.steps.includes(k)) m = 'Essa etapa faz parte do procedimento, mas ainda não é a hora. ';
    else m = ACOES[k].why + ' ';
    msg(fb, `Ainda não. ${m} Próxima etapa correta: "${ACOES[esperado].t}". ${ACOES[esperado].why}`, 'err');
  }
  renderHigiene();
}

/* ===== SESSÃO 3: RESULTADO ===== */
/* ===== REFERÊNCIAS ===== */
const REFS = [
 ['Programa de Análise de Resíduos de Agrotóxicos em Alimentos (PARA)','Anvisa','https://www.gov.br/anvisa'],
 ['Orientações sanitárias para higienização de frutas, legumes e verduras','Anvisa / Ministério da Saúde','https://www.gov.br/anvisa'],
 ['Guia Alimentar para a População Brasileira','Ministério da Saúde','https://www.gov.br/saude']
];
function abrirRefs(){
  $('refsBody').innerHTML =
   `<p><b>Importante:</b> nenhum material de referência foi anexado ao projeto, então o jogo não afirma que pepino, laranja e couve estejam entre os alimentos com mais resíduos; são apenas os três alimentos escolhidos para esta versão. Preços são fictícios.</p>
    <h3>O que o jogo ensina</h3>
    <ul><li>Lavar remove sujeira e pode reduzir parte dos resíduos superficiais, mas não garante a remoção de agrotóxicos, sobretudo os presentes no interior do alimento.</li>
    <li>Presença de resíduo não significa, por si só, dano à saúde: o risco depende da substância, da concentração e da exposição.</li>
    <li>Produtos de higienização devem ser próprios para alimentos, com diluição e tempo de contato do rótulo.</li></ul>
    <h3>Referências (institucionais, confirme o texto atual nos sites)</h3>
    <ul>${REFS.map(r=>`<li>${r[0]} — ${r[1]}. <a href="${r[2]}" target="_blank" rel="noopener">${r[2]}</a></li>`).join('')}</ul>`;
  $('refs').showModal();
}

/* ===== PERSONAGEM E CENAS ===== */
const HEROI = '<span class="corpo"><svg viewBox="-8 0 80 90" aria-hidden="true"><circle cx="30" cy="16" r="12" fill="#f1c9a5"/><path d="M18 14a12 12 0 0 1 24 0z" fill="#4a3322"/><rect x="16" y="30" width="28" height="30" rx="8" fill="#237a4b"/><rect class="pe pe1" x="19" y="58" width="9" height="28" rx="4" fill="#14302b"/><rect class="pe pe2" x="32" y="58" width="9" height="28" rx="4" fill="#14302b"/><path d="M42 38L51 47" stroke="#f1c9a5" stroke-width="5" stroke-linecap="round"/><path d="M43 54q9-15 18 0" stroke="#8a5f36" stroke-width="2.5" fill="none"/><g class="itens"></g><path d="M40 54h24l-3 17H43z" fill="#c58b4e" stroke="#8a5f36" stroke-width="1.5"/><path d="M45 58v9M52 58v9M59 58v9" stroke="#8a5f36" stroke-width="1"/><g class="selo"></g></svg></span>';
let andando = false, ultimoN = 0;
// Desenha na cesta do personagem uma unidade para cada item comprado, mais um selo com o total
function atualizarCesta(){
  const pos = [[45,53],[51,53],[57,53],[63,53],[48,48],[54,48],[60,48],[51,43],[57,43]];
  const lista = [];
  Object.keys(ALIMENTOS).forEach(id=>{ for(let i=0;i<S.cesta[id];i++) lista.push(id); });
  const itens = lista.slice(0,pos.length).map((id,i)=>{
    const x = pos[i][0], y = pos[i][1], c = ALIMENTOS[id].cor;
    return id==='pepino' ? `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="2.8" fill="${c}"/>` : `<circle cx="${x}" cy="${y}" r="3.8" fill="${c}"/>`;
  }).join('');
  const n = lista.length;
  document.querySelectorAll('.heroi .itens').forEach(g=>{ g.innerHTML = itens; });
  document.querySelectorAll('.heroi .selo').forEach(g=>{
    g.innerHTML = n ? `<circle cx="65" cy="38" r="6" fill="#ee8a1f" stroke="#fff" stroke-width="1.5"/><text x="65" y="41.3" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" ${FONTE}>${n}</text>` : '';
    if(n > ultimoN){ g.classList.remove('pop'); g.getBoundingClientRect(); g.classList.add('pop'); }
  });
  ultimoN = n;
}
// Monta uma cena: spots = [{id,x,y,html,fn}] (x,y em %), start = posição inicial do personagem
function montarPalco(elId, tipo, spots, start, sacola){
  const p = $(elId); p.className = 'palco ' + tipo;
  p.innerHTML = spots.map(s=>`<button class="spot ${s.cls||''}" data-spot="${s.id}" ${s.label?`aria-label="${s.label}"`:''} style="left:${s.x}%;top:${s.y}%">${s.html}</button>`).join('') +
    `<div class="heroi ${sacola?'comsacola':''}" style="left:${start[0]}%;top:${start[1]}%">${HEROI}</div>`;
  p.querySelectorAll('.spot').forEach((b,i)=>b.addEventListener('click', ()=>ir(p, spots[i])));
  ultimoN = 99; atualizarCesta(); // redesenha a cesta sem animar
}
// Faz o personagem andar até o objeto e só então executa a ação
function ir(p, s){
  if(andando) return; andando = true;
  const h = p.querySelector('.heroi');
  const alvoX = s.x/100*p.clientWidth, alvoY = Math.min(s.y+22,96)/100*p.clientHeight;
  const dist = Math.hypot(alvoX-h.offsetLeft, alvoY-h.offsetTop);
  const dur = Math.max(0.5, dist/260);               // duração proporcional à distância (s)
  h.classList.toggle('esq', alvoX < h.offsetLeft - 2); // vira o personagem para a direção do destino
  h.style.transitionDuration = dur + 's';
  h.classList.add('andando');
  h.style.left = s.x + '%'; h.style.top = Math.min(s.y+22,96) + '%';
  setTimeout(()=>{                                   // chegou: para de andar e só então age
    h.classList.remove('andando'); h.classList.add('chegou');
    setTimeout(()=>h.classList.remove('chegou'), 350);
    andando = false; s.fn();
  }, dur*1000 + 60);
}
/* ===== ILUSTRAÇÕES DAS CENAS (SVG próprio) ===== */
const FONTE = 'font-family="Segoe UI,Roboto,sans-serif"';
const placa = (txt,cor)=>`<rect x="30" y="2" width="80" height="26" rx="5" fill="#fff" stroke="${cor}" stroke-width="3"/><text x="70" y="21" text-anchor="middle" font-size="15" font-weight="700" fill="#14302b" ${FONTE}>${txt}</text>`;
const etiqueta = txt=>`<rect x="38" y="98" width="64" height="22" rx="5" fill="#fff"/><text x="70" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="#14302b" ${FONTE}>${txt}</text>`;
const BALCAO = '<rect x="6" y="84" width="128" height="42" rx="4" fill="#b98a5a"/><rect x="2" y="80" width="136" height="9" rx="3" fill="#8a5f36"/>';
// Barraca colorida com toldo listrado, placa com o nome e produtos no balcão
function svgBarraca(id){
  const a = ALIMENTOS[id], cor = {pepino:'#3bb273', laranja:'#ee8a1f', couve:'#1b6b3a'}[id];
  let toldo = '';
  for(let i=0;i<7;i++){ const f = i%2 ? '#fff' : cor; toldo += `<rect x="${i*20}" y="32" width="20" height="18" fill="${f}"/><circle cx="${10+i*20}" cy="50" r="10" fill="${f}"/>`; }
  const prod = [14,54,94].map(x=>arte(id).replace('<svg ',`<svg x="${x}" y="56" width="32" height="32" `)).join('');
  return `<svg viewBox="0 0 140 128" aria-hidden="true"><rect x="12" y="50" width="5" height="40" fill="#8a5f36"/><rect x="123" y="50" width="5" height="40" fill="#8a5f36"/>${placa(a.nome,cor)}${toldo}${prod}${BALCAO}${etiqueta(fmt(a.preco))}</svg>`;
}
// Caixa com uma atendente atrás do balcão, de boné e com a máquina registradora
function svgCaixa(){
  return `<svg viewBox="0 0 140 128" aria-hidden="true">${placa('Caixa','#2f86c8')}
  <rect x="48" y="74" width="44" height="36" rx="12" fill="#2f86c8"/><circle cx="70" cy="58" r="15" fill="#f1c9a5"/>
  <path d="M54 55a16 16 0 0 1 32 0z" fill="#2f86c8"/><rect x="70" y="53" width="22" height="4" rx="2" fill="#2f86c8"/>
  <circle cx="64" cy="61" r="1.8" fill="#14302b"/><circle cx="76" cy="61" r="1.8" fill="#14302b"/><path d="M64 67q6 5 12 0" stroke="#14302b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <rect x="96" y="66" width="30" height="22" rx="3" fill="#3d4a52"/><rect x="100" y="70" width="22" height="8" fill="#9fe3b8"/><rect x="100" y="81" width="6" height="4" fill="#9aa5ab"/><rect x="109" y="81" width="6" height="4" fill="#9aa5ab"/>
  ${BALCAO}<circle cx="56" cy="84" r="5" fill="#f1c9a5"/><circle cx="84" cy="84" r="5" fill="#f1c9a5"/>${etiqueta('Pagar')}</svg>`;
}
function svgPia(){
  return `<svg viewBox="0 0 140 128" aria-hidden="true">${placa('Pia','#2f86c8')}
  <path d="M108 76V52q0-12-12-12H86" stroke="#8a949a" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="86" cy="52" r="3" fill="#5fb3e8"/><circle cx="86" cy="61" r="3" fill="#5fb3e8"/>
  <rect x="8" y="76" width="124" height="11" rx="3" fill="#9aa5ab"/><rect x="36" y="74" width="64" height="8" rx="3" fill="#bcd3df"/>
  <rect x="12" y="87" width="116" height="38" rx="3" fill="#eef2f4" stroke="#c4ced3"/><path d="M70 87v38" stroke="#c4ced3"/>
  <circle cx="64" cy="106" r="2.5" fill="#8a949a"/><circle cx="76" cy="106" r="2.5" fill="#8a949a"/></svg>`;
}
function svgMesa(){
  return `<svg viewBox="0 0 140 128" aria-hidden="true">${placa('Mesa','#ee8a1f')}
  <rect x="14" y="84" width="7" height="40" fill="#8a5f36"/><rect x="119" y="84" width="7" height="40" fill="#8a5f36"/>
  <rect x="4" y="76" width="132" height="12" rx="4" fill="#c58b4e"/>
  <circle cx="46" cy="54" r="8" fill="#3bb273"/><circle cx="58" cy="50" r="8" fill="#1b6b3a"/><circle cx="70" cy="52" r="8" fill="#3bb273"/><circle cx="80" cy="55" r="7" fill="#1b6b3a"/><circle cx="60" cy="53" r="5" fill="#ee8a1f"/>
  <path d="M36 56a24 20 0 0 0 48 0z" fill="#fff" stroke="#c4ced3"/>
  <circle cx="108" cy="66" r="10" fill="#ee8a1f"/><path d="M108 56c4-6 10-5 11-4-2 5-6 6-11 4z" fill="#2f8f4a"/>
  <rect x="40" y="100" width="60" height="20" rx="5" fill="#fff"/><text x="70" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="#14302b" ${FONTE}>Finalizar</text></svg>`;
}

function montarMercado(){
  const sp = Object.keys(ALIMENTOS).map((id,i)=>({id, x:18+i*32, y:33, cls:'ilus', fn:()=>adicionar(id),
    label:`Barraca de ${ALIMENTOS[id].nome}, ${fmt(ALIMENTOS[id].preco)}`, html:svgBarraca(id)}));
  sp.push({id:'caixa', x:84, y:74, cls:'ilus', fn:confirmarCompra, label:'Caixa: pagar a compra', html:svgCaixa()});
  montarPalco('palco1','mercado',sp,[8,90],false);
}
function irParaCasa(){
  $('transicao').hidden = false;
  setTimeout(()=>{ $('transicao').hidden = true; mostrar(2); montarCasa(); renderHigiene(); }, 1600);
}
function montarCasa(){
  $('washPanel').hidden = true;
  msg($('dica2'),'Toque na pia para começar a lavar os alimentos.','info');
  montarPalco('palco2','casa',[
    {id:'pia', x:28, y:38, cls:'ilus', label:'Pia: lavar os alimentos', html:svgPia(), fn:()=>{ $('washPanel').hidden=false; msg($('dica2'),'','info'); renderHigiene(); rolarPara($('washPanel')); }},
    {id:'mesa', x:76, y:44, cls:'ilus', label:'Mesa: finalizar', html:svgMesa(), fn:finalizar}
  ],[10,90],true);
}
function finalizar(){
  if(!S.comprados.every(k=>S.foods[k].done)) return msg($('dica2'),'Higienize todos os alimentos na pia antes de finalizar.','err');
  renderResultado();
}

/* ===== SESSÃO 3: NOTA DA JORNADA ===== */
function renderResultado(){
  const d = new Date().toLocaleString('pt-BR');
  const li = S.comprados.map(k=>{ const a=ALIMENTOS[k], q=S.cesta[k]; return `<div class="l"><span>${q}x ${a.nome} @ ${fmt(a.preco)}</span><span>${fmt(q*a.preco)}</span></div>`; }).join('');
  const hig = S.comprados.map(k=>{ const f=S.foods[k]; return `<div class="l"><span>${ALIMENTOS[k].nome}: ${ALIMENTOS[k].steps.length} etapas</span><span>${f.erros} erro(s), ${f.corrigidos} corrigido(s)</span></div>`; }).join('');
  $('nota').innerHTML = `<h3>MERCADO DIDÁTICO</h3><p class="c">Nota da jornada — ${d}<br>(preços fictícios)</p><hr>${li}<hr>
    <div class="l"><b>TOTAL</b><b>${fmt(S.gasto)}</b></div><div class="l"><span>Orçamento</span><span>${fmt(ORCAMENTO)}</span></div><div class="l"><span>Saldo</span><span>${fmt(ORCAMENTO-S.gasto)}</span></div><hr>
    <p class="c">HIGIENIZAÇÃO EM CASA</p>${hig}<hr>
    <div class="l"><span>Pontos educativos</span><span>${S.pontos}</span></div><hr>
    <p class="c">A lavagem ajuda na higiene, mas não garante a remoção de resíduos de agrotóxicos.</p>`;
  mostrar(3); cabecalho();
}

/* ===== EVENTOS ===== */
document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.add) adicionar(b.dataset.add);
  else if(b.dataset.rem) remover(b.dataset.rem);
  else if(b.dataset.food){ S.sel = b.dataset.food; msg($('feedback'),''); renderHigiene(); }
  else if(b.dataset.act) agir(b.dataset.act);
});
$('btnConfirm').addEventListener('click', confirmarCompra);
$('btnFinish').addEventListener('click', finalizar);
$('btnPrint').addEventListener('click', ()=>window.print());
$('btnRestart').addEventListener('click', iniciar);
$('btnRefs').addEventListener('click', abrirRefs);
$('btnRefs2').addEventListener('click', abrirRefs);
$('btnCloseRefs').addEventListener('click', ()=>$('refs').close());

function iniciar(){ novoEstado(); andando=false; $('transicao').hidden=true; $('washPanel').hidden=true; msg($('msg1'),''); msg($('feedback'),''); mostrar(1); montarMercado(); renderMercado(); }
iniciar();
