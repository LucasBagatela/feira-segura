'use strict';
/* ===== DADOS DO JOGO (fácil de modificar) ===== */
const ORCAMENTO = 20;      // R$ fictício, valor didático
const LIMITE_UNID = 3;     // máximo de unidades de cada alimento
const PERGUNTAS_POR_ALIMENTO = 3; // quantas perguntas sorteadas (de 6) cada alimento recebe
const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

// Embaralha uma lista (Fisher-Yates): a ordem dos botões muda a cada partida
function embaralhar(lista){
  const l = lista.slice();
  for(let i=l.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [l[i],l[j]] = [l[j],l[i]]; }
  return l;
}

const ALIMENTOS = {
  pepino: {nome:'Pepino', preco:4, cor:'#3b9a52',
    dica:'Costuma ser comido cru, às vezes com casca.'},
  laranja: {nome:'Laranja', preco:3, cor:'#ee8a1f',
    dica:'A casca normalmente é descartada, mas as mãos e a faca encostam nela.'},
  couve: {nome:'Couve', preco:5, cor:'#1f7a3d',
    dica:'Folhas sobrepostas retêm terra: ao lavar, abra bem as folhas.'}
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
  S.comprados.forEach(id=>{ S.foods[id] = {done:false, perguntas:embaralhar(MINIGAMES[id]).slice(0, PERGUNTAS_POR_ALIMENTO), quiz:{q:0, acertos:0, erros:0, errados:[], ordem:null, certa:false}}; });
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
  const total = f.perguntas.length, prog = f.done ? 1 : f.quiz.q / total;   // progresso = perguntas respondidas
  $('visual').style.setProperty('--dirt', 1 - prog);
  $('foodTitle').textContent = a.nome;
  $('foodHint').textContent = a.dica;
  $('progress').firstElementChild.style.width = (prog*100) + '%';
  $('progressTxt').textContent = f.done ? 'Higienização concluída' : `Pergunta ${f.quiz.q+1} de ${total}`;
  if(f.done) $('quiz').innerHTML = '<p class="msg ok">✔ Minigame concluído! Use "Próximo alimento" ou "Ver resultado".</p>';
  else renderQuiz();
  const faltam = S.comprados.filter(k=>!S.foods[k].done).length;
  $('btnFinish').disabled = faltam > 0;
  $('btnProximo').hidden = S.comprados.length < 2;      // só faz sentido com 2 ou mais alimentos
  $('btnProximo').disabled = !f.done || faltam === 0;   // libera quando o alimento atual termina
  cabecalho();
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
    `<div class="heroi ${sacola?'comsacola':''}" style="left:${start[0]}%;top:${start[1]}%">${HEROI}</div><button class="prompt" hidden></button>`;
  p.querySelectorAll('.spot').forEach((b,i)=>b.addEventListener('click', ()=>ir(p, spots[i])));
  p._spots = spots; p.setAttribute('role','group'); p.setAttribute('aria-label','Cena do jogo');
  p.querySelector('.prompt').addEventListener('click', ()=>usarPerto(p));
  ultimoN = 99; atualizarCesta(); // redesenha a cesta sem animar
}
// Faz o personagem andar até o objeto e só então executa a ação
function ir(p, s){
  if(andando) return; andando = true;
  const h = p.querySelector('.heroi'); h.classList.remove('livre');
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
    andando = false; s.fn(); atualizarPerto(p);
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
  const hig = S.comprados.map(k=>{ const f=S.foods[k]; return `<div class="l"><span>Minigame ${ALIMENTOS[k].nome}</span><span>${f.quiz.acertos}/${f.perguntas.length} de primeira, ${f.quiz.erros} erro(s)</span></div>`; }).join('');
  $('nota').innerHTML = `<h3>MERCADO DIDÁTICO</h3><p class="c">Nota da jornada — ${d}<br>(preços fictícios)</p><hr>${li}<hr>
    <div class="l"><b>TOTAL</b><b>${fmt(S.gasto)}</b></div><div class="l"><span>Orçamento</span><span>${fmt(ORCAMENTO)}</span></div><div class="l"><span>Saldo</span><span>${fmt(ORCAMENTO-S.gasto)}</span></div><hr>
    <p class="c">HIGIENIZAÇÃO EM CASA</p>${hig}<hr>
    <div class="l"><span>Pontos educativos</span><span>${S.pontos}</span></div><hr>
    <p class="c">A lavagem ajuda na higiene, mas não garante a remoção de resíduos de agrotóxicos.</p>`;
  mostrar(3); cabecalho();
}

/* ===== MINIGAMES (perguntas por alimento) =====
   Formato: q(tema, pergunta, feedback, [resposta correta, ...erradas]). A correta é SEMPRE a primeira da lista
   (as opções são embaralhadas na tela). */
const q = (t,p,ok,op)=>({t,p,ok,op});
const MINIGAMES = {
  couve: [
    q('Seleção','O jogador vê folhas boas e folhas amareladas. Qual é a primeira ação antes de lavar?','Ótimo! Eliminar as partes estragadas evita contaminar o restante.',['Selecionar e descartar as folhas murchas ou danificadas.','Picar todas as folhas juntas, sem separar.','Colocar tudo direto na solução clorada.','Guardar as folhas amareladas para misturar depois.']),
    q('Pré-lavagem','Como o jogador deve fazer a limpeza inicial da couve?','Exato! A água corrente remove poeira e pequenos insetos visíveis.',['Lavar folha por folha rigorosamente em água corrente.','Passar rapidamente o maço inteiro sob a torneira.','Deixar o maço parado em uma bacia com água parada.','Esfregar as folhas com detergente de louça.']),
    q('Desinfecção: dosagem','Para preparar a solução clorada de desinfecção, qual é a medida correta para 1 litro de água?','Perfeito! Essa é a proporção recomendada pela ANVISA.',['1 colher de sopa de água sanitária própria para alimentos.','1 xícara de água sanitária própria para alimentos.','1 colher de chá de qualquer água sanitária.','1 garrafa inteira de água sanitária.']),
    q('Desinfecção: tempo','Quanto tempo as folhas de couve devem ficar submersas na solução clorada?','Correto! Esse tempo elimina os germes sem estragar as folhas.',['De 10 a 15 minutos.','Apenas 10 segundos.','Cerca de 1 hora.','A noite toda.']),
    q('Enxágue','O que o jogador deve fazer imediatamente após retirar a couve do molho clorado?','Muito bem! O enxágue garante que nenhum produto químico fique no alimento.',['Enxaguar bem em água corrente para remover os resíduos do cloro.','Guardar direto na geladeira, ainda com o cloro.','Temperar as folhas com sal e limão.','Deixar secar ao ar sem enxaguar.']),
    q('Secagem','Qual é o último passo antes de picar ou guardar a couve?','Minigame concluído! Couve limpa, seca e pronta para o consumo!',['Secar as folhas (usando escorredor limpo ou centrífuga de saladas).','Guardar as folhas molhadas em um saco fechado.','Deixar as folhas na pia por várias horas.','Lavar tudo de novo com detergente.'])
  ],
  laranja: [
    q('Importância','Por que o jogador precisa lavar a casca da laranja se ela não vai ser comida?','Exato! Isso previne a contaminação cruzada.',['Para evitar que a faca leve sujeira e bactérias da casca para a polpa ao cortar.','Porque a casca é a parte mais saborosa.','Porque a água deixa a polpa mais doce.','Não precisa lavar, pois a casca é descartada.']),
    q('Ação mecânica','Como o jogador deve limpar a casca da laranja?','Ótimo! A fricção remove a terra e resíduos superficiais.',['Esfregando bem com as mãos ou escovinha em água corrente.','Apenas molhando por 1 segundo.','Descascando primeiro e lavando depois a polpa.','Passando um pano seco.']),
    q('Produto opcional','Se o jogador decidir usar um produto auxiliar na casca, qual é o correto?','Perfeito! Nunca use produtos perfumados ou químicos agressivos.',['Detergente neutro (com enxágue abundante depois).','Detergente perfumado, sem enxaguar.','Álcool ou desinfetante de uso geral.','Produto de limpeza de banheiro.']),
    q('Erro comum','O que o jogador deve fazer se encontrar uma laranja com mofo na casca?','Correto! O mofo penetra na polpa, mesmo que não dê para ver.',['Descartar a fruta inteira, pois as toxinas se espalham por dentro.','Cortar só a parte com mofo e comer o resto.','Lavar bem e usar normalmente.','Fazer suco para disfarçar.']),
    q('Secagem','O que deve ser feito com a laranja após a lavagem e antes de guardá-la?','Muito bem! A umidade parada acelera o apodrecimento.',['Secar completamente com papel-toalha.','Guardar ainda molhada.','Deixar de molho até o dia seguinte.','Embrulhar molhada em saco plástico.']),
    q('Conclusão','Qual o status final da laranja no minigame?','Minigame concluído com sucesso!',['Casca higienizada, seca e pronta para corte seguro.','Casca úmida e pronta para guardar.','Casca suja, mas descascada.','Fruta lavada apenas com água parada.'])
  ],
  pepino: [
    q('Ordem das etapas','Qual é a primeira coisa que o jogador deve fazer com o pepino?','Exato! Nunca fatie o pepino antes de higienizá-lo.',['Fazer a pré-lavagem com o pepino inteiro em água corrente.','Fatiar o pepino para lavar melhor.','Colocar já em fatias na solução clorada.','Descascar antes de lavar.']),
    q('Limpeza das ranhuras','Como o jogador remove a terra presa nas ranhuras da casca do pepino?','Ótimo! Isso limpa as dobrinhas da casca sem danificá-la.',['Usando uma escovinha macia em movimentos verticais sob a torneira.','Raspando com uma faca afiada.','Usando esponja de aço.','Lavando só por cima, deixando a terra.']),
    q('Desinfecção: lógica','Por que o pepino deve entrar inteiro na solução clorada?','Perfeito! Cortar antes levaria germes para dentro do alimento.',['Para que a água sanitária não entre em contato com a polpa interna.','Para o pepino ficar mais crocante.','Para a solução render mais.','Porque fatiado ele boia na bacia.']),
    q('Desinfecção: cálculo','Se a bacia tem 2 litros de água, quanta água sanitária o jogador deve colocar?','Excelente! Cálculo de proporção correto.',['2 colheres de sopa (1 colher por litro).','1 colher de sopa.','1 xícara.','4 colheres de sopa.']),
    q('Enxágue e espera','Após os 10 a 15 minutos de molho, qual é a obrigação do jogador?','Muito bem! Isso evita qualquer resíduo químico no pepino.',['Enxaguar abundantemente em água potável para tirar o cloro.','Cortar e servir direto, sem enxaguar.','Deixar secar com o cloro na casca.','Mergulhar de novo na solução.']),
    q('Armazenamento final','Como o pepino deve ser guardado na geladeira após seco?','Minigame concluído! Pepino crocante, seguro e pronto para a salada!',['Seco e armazenado na gaveta de legumes em recipiente fechado.','Molhado, solto na prateleira.','Dentro de um saco com água parada.','Ao lado da carne crua, sem proteção.'])
  ]
};
function renderQuiz(){
  const id = S.sel, f = S.foods[id], qs = f.perguntas, p = qs[f.quiz.q];
  if(!f.quiz.ordem) f.quiz.ordem = embaralhar(p.op.map((_,i)=>i)); // posição da resposta certa muda a cada pergunta
  $('quiz').innerHTML = `<p class="small"><b>Minigame ${ALIMENTOS[id].nome}</b> · pergunta ${f.quiz.q+1} de ${qs.length} · ${p.t}</p><h3>${p.p}</h3>
    <div class="opcoes">${f.quiz.ordem.map(i=>`<button data-opt="${i}" class="${f.quiz.errados.includes(i)?'errou':''} ${f.quiz.certa&&i===0?'certa':''}" ${f.quiz.certa?'disabled':''}>${p.op[i]}</button>`).join('')}</div>`
    + (f.quiz.certa ? `<button class="big alt" data-qnext>${f.quiz.q+1<qs.length ? 'Próxima pergunta' : 'Concluir minigame'}</button>` : '');
}
// Os feedbacks das últimas perguntas do material dizem "Minigame concluído!"; como as perguntas são sorteadas,
// essa frase só aparece de fato na última pergunta da rodada
function feedbackDa(p, ultima){
  if(ultima || !/^Minigame concluído/.test(p.ok)) return p.ok;
  const resto = p.ok.replace(/^Minigame concluído( com sucesso)?!\s*/, '');
  return 'Correto!' + (resto ? ' ' + resto : '');
}
function responder(i){
  const id = S.sel, f = S.foods[id], p = f.perguntas[f.quiz.q];
  if(f.quiz.certa) return;
  if(i === 0){                                    // a resposta certa é sempre o índice 0 da lista original
    f.quiz.certa = true;
    if(f.quiz.errados.length === 0){ f.quiz.acertos++; S.pontos += 10; } else S.pontos += 5; // corrigir após o erro também pontua
    msg($('feedback'), '✔ ' + feedbackDa(p, f.quiz.q === f.perguntas.length - 1), 'ok');
  } else {
    if(!f.quiz.errados.includes(i)) f.quiz.errados.push(i);
    f.quiz.erros++;
    msg($('feedback'), '✖ Ainda não. Releia a pergunta e tente outra opção.', 'err');
  }
  renderHigiene();
}
function proximaPergunta(){
  const id = S.sel, f = S.foods[id];
  f.quiz.q++; f.quiz.certa = false; f.quiz.errados = []; f.quiz.ordem = null;
  if(f.quiz.q >= f.perguntas.length) concluirAlimento(id);
  else { msg($('feedback'),''); renderHigiene(); }
}
function concluirAlimento(id){
  const f = S.foods[id];
  f.done = true; S.pontos += 15;
  if(S.comprados.every(k=>S.foods[k].done)) setTimeout(()=>{ msg($('dica2'),'Tudo higienizado! Toque na Mesa para finalizar.','ok'); rolarPara($('palco2')); }, 900);
  msg($('feedback'), `${ALIMENTOS[id].nome} concluído! Lembre-se: a lavagem não garante ausência de resíduos. Use o botão abaixo para seguir.`, 'ok');
  renderHigiene();
}

/* ===== MOVIMENTO PELO TECLADO (computador) =====
   Setas ou W/A/S/D andam; E ou Enter usam o objeto mais próximo. O toque/clique continua funcionando. */
const teclas = new Set();
let rafId = null, tAnt = 0;
const MAPA = {ArrowLeft:'e',a:'e',A:'e', ArrowRight:'d',d:'d',D:'d', ArrowUp:'c',w:'c',W:'c', ArrowDown:'b',s:'b',S:'b'};
// Cena que o teclado controla agora (só se estiver visível na tela e sem janelas abertas)
function palcoAtivo(){
  if(!$('transicao').hidden || $('refs').open) return null;
  const el = !$('s1').hidden ? $('palco1') : !$('s2').hidden ? $('palco2') : null;
  if(!el) return null;
  const r = el.getBoundingClientRect();
  return (r.bottom > 80 && r.top < window.innerHeight - 80) ? el : null;
}
function pararAndar(h){ if(h) h.classList.remove('andando'); rafId = null; }
function passo(t){
  const p = palcoAtivo(), h = p && p.querySelector('.heroi');
  if(!h || !teclas.size || andando){ pararAndar(h); if(p) atualizarPerto(p); return; }
  const dt = Math.min((t - tAnt)/1000, 0.05); tAnt = t;
  const dx = (teclas.has('d')?1:0) - (teclas.has('e')?1:0), dy = (teclas.has('b')?1:0) - (teclas.has('c')?1:0);
  if(dx || dy){
    const n = Math.hypot(dx,dy), v = 190*dt;                 // velocidade: 190 px/s
    const x = Math.max(.04*p.clientWidth, Math.min(.96*p.clientWidth, h.offsetLeft + dx/n*v));
    const y = Math.max(.42*p.clientHeight, Math.min(.96*p.clientHeight, h.offsetTop + dy/n*v));
    h.classList.add('livre','andando');                       // "livre" desliga a transição do clique
    if(dx) h.classList.toggle('esq', dx < 0);
    h.style.left = (x/p.clientWidth*100) + '%'; h.style.top = (y/p.clientHeight*100) + '%';
    atualizarPerto(p);
  }
  rafId = requestAnimationFrame(passo);
}
// Descobre o objeto mais próximo do personagem e mostra o aviso "Pressione E"
function atualizarPerto(p){
  const h = p.querySelector('.heroi'), pr = p.querySelector('.prompt'); if(!h || !pr) return;
  let melhor = null, menor = 70;                              // alcance: 70 px
  (p._spots||[]).forEach(s=>{
    const d = Math.hypot(h.offsetLeft - s.x/100*p.clientWidth, h.offsetTop - Math.min(s.y+22,96)/100*p.clientHeight);
    if(d < menor){ menor = d; melhor = s; }
  });
  p._perto = melhor;
  p.querySelectorAll('.spot').forEach(b=>b.classList.toggle('perto', !!melhor && b.dataset.spot === melhor.id));
  pr.hidden = !melhor;
  if(melhor) pr.textContent = `Pressione E ou toque aqui: ${melhor.label}`;
}
function usarPerto(p){
  const s = p._perto; if(!s || andando) return false;
  const h = p.querySelector('.heroi'); h.classList.add('chegou'); setTimeout(()=>h.classList.remove('chegou'), 350);
  s.fn(); return true;
}
document.addEventListener('keydown', e=>{
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.target.closest && e.target.closest('input,select,textarea')) return;
  const dir = MAPA[e.key], p = palcoAtivo();
  if(dir && p){
    e.preventDefault(); teclas.add(dir);
    if(!rafId && !andando){ tAnt = performance.now(); rafId = requestAnimationFrame(passo); }
    return;
  }
  const usar = e.key === 'e' || e.key === 'E' || ((e.key === 'Enter' || e.key === ' ') && !(e.target.closest && e.target.closest('button,a')));
  if(usar && p && usarPerto(p)) e.preventDefault();
});
document.addEventListener('keyup', e=>{ if(MAPA[e.key]) teclas.delete(MAPA[e.key]); });
window.addEventListener('blur', ()=>teclas.clear());

/* ===== EVENTOS ===== */
document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.add) adicionar(b.dataset.add);
  else if(b.dataset.rem) remover(b.dataset.rem);
  else if(b.dataset.food){ S.sel = b.dataset.food; msg($('feedback'),''); renderHigiene(); }
  else if(b.dataset.opt !== undefined) responder(+b.dataset.opt);
  else if(b.dataset.qnext !== undefined) proximaPergunta();
});
$('btnConfirm').addEventListener('click', confirmarCompra);
$('btnFinish').addEventListener('click', finalizar);
$('btnProximo').addEventListener('click', ()=>{   // vai para o próximo alimento ainda não higienizado
  const p = S.comprados.find(k=>!S.foods[k].done);
  if(p){ S.sel = p; msg($('feedback'),''); renderHigiene(); }
});
$('btnPrint').addEventListener('click', ()=>window.print());
$('btnRestart').addEventListener('click', iniciar);
$('btnRefs').addEventListener('click', abrirRefs);
$('btnRefs2').addEventListener('click', abrirRefs);
$('btnCloseRefs').addEventListener('click', ()=>$('refs').close());

function iniciar(){ novoEstado(); andando=false; $('transicao').hidden=true; $('washPanel').hidden=true; msg($('msg1'),''); msg($('feedback'),''); mostrar(1); montarMercado(); renderMercado(); }
iniciar();
