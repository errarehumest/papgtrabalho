/* =========================================================
   PA & PG Lab — lógica do frontend
   Mesma ideia do pa_pg_lab.py: os termos são gerados UM A UM
   dentro de um laço, e a soma é acumulada durante o processo.
   ========================================================= */

const LIMITE_TERMOS_META = 10000;
const MAX_CHIPS = 60;
const MAX_LINHAS_TABELA = 500;
const MAX_BARRAS = 200;

const $ = (sel) => document.querySelector(sel);
const estado = { tipo: "PA", modo: "gerar", resultado: null };
const reduzMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Números ---------------- */
function normalizar(v) {
  if (!Number.isFinite(v) || Number.isInteger(v)) return Object.is(v, -0) ? 0 : v;
  const r = Number(v.toPrecision(12)); // remove ruído de ponto flutuante
  return Object.is(r, -0) ? 0 : r;
}

function fmt(v) {
  v = normalizar(v);
  if (v === Infinity) return "∞";
  if (v === -Infinity) return "−∞";
  if (Number.isNaN(v)) return "—";
  if (Math.abs(v) >= 1e15) return v.toExponential(4).replace(".", ",");
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 6, useGrouping: false });
}

function fmtCurto(v) {
  if (!Number.isFinite(v)) return fmt(v);
  const a = Math.abs(v);
  if (a >= 1e6) return v.toExponential(1).replace(".", ",");
  return v.toLocaleString("pt-BR", { maximumFractionDigits: a < 10 ? 2 : 0, useGrouping: false });
}

function lerNumero(texto) {
  const limpo = String(texto).trim().replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? normalizar(n) : null;
}

function iguais(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/* ---------------- Algoritmos (laço termo a termo) ---------------- */
function proximoTermo(tipo, termo, razao) {
  return tipo === "PA" ? termo + razao : termo * razao; // decisão central
}

function gerarProgressao(tipo, primeiro, razao, quantidade) {
  const termos = [], somas = [];
  let soma = 0;
  let termo = primeiro;

  for (let i = 0; i < quantidade; i++) {
    termos.push(normalizar(termo));
    soma += termo;
    somas.push(normalizar(soma));
    termo = proximoTermo(tipo, termo, razao);
  }
  return { termos, somas, soma: normalizar(soma), quantidade };
}

function alcancarMeta(tipo, primeiro, razao, meta) {
  const termos = [], somas = [];
  let soma = 0;
  let termo = primeiro;

  while (soma <= meta) {
    if (termos.length >= LIMITE_TERMOS_META) {
      return { termos, somas, soma: normalizar(soma), quantidade: null };
    }
    termos.push(normalizar(termo));
    soma += termo;
    somas.push(normalizar(soma));
    termo = proximoTermo(tipo, termo, razao);
  }
  return { termos, somas, soma: normalizar(soma), quantidade: termos.length };
}

/* ---------------- Entrada ---------------- */
function lerEntradas() {
  const campos = ["primeiro", "razao", estado.modo === "gerar" ? "quantidade" : "meta"];
  campos.forEach((id) => $("#" + id).classList.remove("invalido"));

  const primeiro = lerNumero($("#primeiro").value);
  const razao = lerNumero($("#razao").value);
  const erros = [];

  if (primeiro === null) { erros.push("primeiro termo"); $("#primeiro").classList.add("invalido"); }
  if (razao === null) { erros.push("razão"); $("#razao").classList.add("invalido"); }

  let quantidade = null, meta = null;
  if (estado.modo === "gerar") {
    quantidade = Number($("#quantidade").value);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 500) {
      erros.push("quantidade (inteiro de 1 a 500)");
      $("#quantidade").classList.add("invalido");
    }
  } else {
    meta = lerNumero($("#meta").value);
    if (meta === null) { erros.push("meta"); $("#meta").classList.add("invalido"); }
  }

  $("#erro").textContent = erros.length ? `Verifique: ${erros.join(", ")}.` : "";
  return erros.length ? null : { primeiro, razao, quantidade, meta };
}

/* ---------------- Execução principal ---------------- */
function calcular() {
  const e = lerEntradas();
  if (!e) return;

  const r = estado.modo === "gerar"
    ? gerarProgressao(estado.tipo, e.primeiro, e.razao, e.quantidade)
    : alcancarMeta(estado.tipo, e.primeiro, e.razao, e.meta);

  estado.resultado = { ...r, ...e, tipo: estado.tipo, modo: estado.modo };
  renderizar();
}

/* ---------------- Renderização ---------------- */
function renderizar() {
  const R = estado.resultado;
  const n = R.termos.length;
  const ultimo = n ? R.termos[n - 1] : NaN;
  const simb = R.tipo === "PA" ? "r" : "q";

  // Aviso (apenas modo meta)
  const aviso = $("#aviso");
  aviso.hidden = true;
  if (R.modo === "meta" && R.quantidade === null) {
    aviso.hidden = false;
    aviso.textContent = `A soma não ultrapassou a meta em ${LIMITE_TERMOS_META.toLocaleString("pt-BR")} termos. ` +
      `Com esses valores ela provavelmente nunca ultrapassará ${fmt(R.meta)} ` +
      (R.tipo === "PG" ? "(com |q| < 1 a soma converge)." : "(a razão não faz a soma crescer o suficiente).");
  } else if (R.modo === "meta" && n === 0) {
    aviso.hidden = false;
    aviso.textContent = `A soma inicial (0) já é maior que a meta ${fmt(R.meta)}: nenhum termo é necessário.`;
  }

  // Estatísticas
  if (R.modo === "gerar") {
    $("#rotulo-stat1").textContent = "Último termo";
    $("#rotulo-stat3").textContent = "Quantidade de termos";
    animarNumero($("#stat-ultimo"), ultimo);
    animarNumero($("#stat-qtd"), n);
    $("#extra-ultimo").innerHTML = `a<sub>${n}</sub>`;
    $("#extra-soma").innerHTML = `S<sub>${n}</sub>`;
    $("#extra-qtd").textContent = `${simb} = ${fmt(R.razao)}`;
  } else {
    $("#rotulo-stat1").textContent = "Termos necessários";
    $("#rotulo-stat3").textContent = "Último termo";
    if (R.quantidade === null) {
      cancelAnimationFrame($("#stat-ultimo")._raf);
      $("#stat-ultimo").textContent = `> ${LIMITE_TERMOS_META}`;
    }
    else animarNumero($("#stat-ultimo"), R.quantidade);
    animarNumero($("#stat-qtd"), ultimo);
    $("#extra-ultimo").textContent = "para a soma passar da meta";
    $("#extra-soma").textContent = `meta: ${fmt(R.meta)}`;
    $("#extra-qtd").innerHTML = n ? `a<sub>${n}</sub>` : "&nbsp;";
  }
  animarNumero($("#stat-soma"), R.soma);
  document.querySelectorAll(".stat").forEach((s) => {
    s.classList.remove("pulsar"); void s.offsetWidth; s.classList.add("pulsar");
  });

  $("#titulo-sequencia").textContent = R.modo === "gerar" ? `${R.tipo} gerada` : `${R.tipo} até ultrapassar a meta`;

  renderizarSequencia(R);
  renderizarVerificacao(R);
  renderizarTabela(R);
  renderizarPseudo(R);
  iniciarGrafico();
}

function textoOperador(tipo, razao) {
  if (tipo === "PA") return razao < 0 ? `−${fmt(-razao)}` : `+${fmt(razao)}`;
  return razao < 0 ? `×(${fmt(razao)})` : `×${fmt(razao)}`;
}

function renderizarSequencia(R) {
  const ol = $("#sequencia");
  const op = textoOperador(R.tipo, R.razao);
  const mostrar = Math.min(R.termos.length, MAX_CHIPS);
  let html = "";
  for (let i = 0; i < mostrar; i++) {
    const ehUltimo = i === R.termos.length - 1;
    html += `<li><span class="termo${ehUltimo ? " ultimo" : ""}" style="--i:${i}" title="a${i + 1} = ${fmt(R.termos[i])}">` +
      `${fmt(R.termos[i])}<span class="indice">a<sub>${i + 1}</sub></span></span>` +
      (i < mostrar - 1 ? `<span class="operador" style="--i:${i}" aria-hidden="true">${op}</span>` : "") + `</li>`;
  }
  if (R.termos.length > MAX_CHIPS) {
    const resto = R.termos.length - MAX_CHIPS;
    html += `<li class="mais-termos">… mais ${resto.toLocaleString("pt-BR")} termos · último: <strong>${fmt(R.termos.at(-1))}</strong></li>`;
  }
  if (!R.termos.length) html = `<li class="mais-termos">Nenhum termo gerado.</li>`;
  ol.innerHTML = html;
}

function renderizarVerificacao(R) {
  const box = $("#verificacao");
  const a1 = R.primeiro, q = R.razao, n = R.termos.length;
  if (!n) { box.innerHTML = ""; return; }
  const an = R.termos[n - 1];
  const selo = (ok) => `<span class="selo ${ok ? "ok" : "falha"}">${ok ? "✓ confere" : "✗ diverge"}</span>`;
  let itens = [];

  let anF, snF, exprAn, exprSn;
  if (R.tipo === "PA") {
    anF = a1 + (n - 1) * q;
    snF = (a1 + anF) * n / 2;
    exprAn = `a<sub>n</sub> = a<sub>1</sub> + (n − 1)·r<br>a<sub>${n}</sub> = ${fmt(a1)} + (${n} − 1)·${par(q)} = <em>${fmt(anF)}</em>`;
    exprSn = `S<sub>n</sub> = (a<sub>1</sub> + a<sub>n</sub>)·n / 2<br>S<sub>${n}</sub> = (${fmt(a1)} + ${par(anF)})·${n} / 2 = <em>${fmt(snF)}</em>`;
  } else {
    anF = a1 * q ** (n - 1);
    snF = q === 1 ? a1 * n : a1 * (q ** n - 1) / (q - 1);
    exprAn = `a<sub>n</sub> = a<sub>1</sub>·q<sup>n−1</sup><br>a<sub>${n}</sub> = ${fmt(a1)}·${par(q)}<sup>${n - 1}</sup> = <em>${fmt(anF)}</em>`;
    exprSn = q === 1
      ? `q = 1 ⇒ S<sub>n</sub> = n·a<sub>1</sub> = <em>${fmt(snF)}</em>`
      : `S<sub>n</sub> = a<sub>1</sub>·(q<sup>n</sup> − 1) / (q − 1)<br>S<sub>${n}</sub> = ${fmt(a1)}·(${par(q)}<sup>${n}</sup> − 1) / (${fmt(q)} − 1) = <em>${fmt(snF)}</em>`;
  }

  itens.push(item("Último termo", iguais(anF, an), `${exprAn}<br>laço: ${fmt(an)}`));
  itens.push(item("Soma dos termos", iguais(snF, R.soma), `${exprSn}<br>laço: ${fmt(R.soma)}`));

  if (R.modo === "meta" && R.quantidade !== null) {
    const anterior = n > 1 ? R.somas[n - 2] : 0;
    const ok = R.soma > R.meta && anterior <= R.meta;
    itens.push(item("Menor n possível", ok,
      `S<sub>${n}</sub> = ${fmt(R.soma)} &gt; ${fmt(R.meta)}<br>S<sub>${n - 1}</sub> = ${fmt(anterior)} ≤ ${fmt(R.meta)}`));
  }
  box.innerHTML = itens.join("");

  function item(titulo, ok, corpo) {
    return `<div class="verif-item"><div class="titulo">${titulo}${selo(ok)}</div><code>${corpo}</code></div>`;
  }
}

function par(v) { return v < 0 ? `(${fmt(v)})` : fmt(v); }

function renderizarTabela(R) {
  const linhas = Math.min(R.termos.length, MAX_LINHAS_TABELA);
  const sinal = R.tipo === "PA" ? "+" : "×";
  let html = "";
  for (let i = 0; i < linhas; i++) {
    const operacao = i === 0 ? "início (a₁)" : `${fmt(R.termos[i - 1])} ${sinal} ${par(R.razao)}`;
    const cruzou = R.modo === "meta" && R.quantidade !== null && i === R.termos.length - 1;
    html += `<tr${cruzou ? ' class="cruzou"' : ""}><td>${i + 1}</td><td>${fmt(R.termos[i])}</td><td>${operacao}</td><td>${fmt(R.somas[i])}</td></tr>`;
  }
  if (R.termos.length > linhas) {
    html += `<tr><td colspan="4" style="color:var(--texto-3)">… ${(R.termos.length - linhas).toLocaleString("pt-BR")} linhas omitidas</td></tr>`;
  }
  $("#tabela").innerHTML = html;
}

function renderizarPseudo(R) {
  const kw = (t) => `<span class="kw">${t}</span>`;
  const nu = (t) => `<span class="nu">${t}</span>`;
  const cm = (t) => `<span class="cm">// ${t}</span>`;
  const op = R.tipo === "PA" ? "+" : "×";
  const regra = R.tipo === "PA" ? "PA: soma a razão" : "PG: multiplica pela razão";
  let linhas;

  if (R.modo === "gerar") {
    linhas = [
      `termo ← ${nu(fmt(R.primeiro))}`,
      `soma  ← ${nu(0)}`,
      `${kw("PARA")} i ${kw("DE")} ${nu(1)} ${kw("ATÉ")} ${nu(R.quantidade)} ${kw("FAÇA")}`,
      `    ${kw("MOSTRAR")} termo`,
      `    soma  ← soma + termo`,
      `    termo ← termo ${op} ${nu(par(R.razao))}        ${cm(regra)}`,
      `${kw("FIM PARA")}`,
      `${kw("MOSTRAR")} "Último termo:", ${nu(fmt(R.termos.at(-1)))}`,
      `${kw("MOSTRAR")} "Soma dos termos:", soma   ${cm("= " + fmt(R.soma))}`,
    ];
  } else {
    linhas = [
      `termo ← ${nu(fmt(R.primeiro))}`,
      `soma  ← ${nu(0)}`,
      `contador ← ${nu(0)}`,
      `${kw("ENQUANTO")} soma ≤ ${nu(fmt(R.meta))} ${kw("FAÇA")}`,
      `    soma     ← soma + termo`,
      `    contador ← contador + ${nu(1)}`,
      `    termo    ← termo ${op} ${nu(par(R.razao))}     ${cm(regra)}`,
      `${kw("FIM ENQUANTO")}`,
      `${kw("MOSTRAR")} "São necessários", contador, "termos"   ${cm(R.quantidade === null ? "limite atingido" : R.quantidade + " termos")}`,
      `${kw("MOSTRAR")} "Soma obtida:", soma   ${cm("= " + fmt(R.soma))}`,
    ];
  }
  $("#pseudo").innerHTML = linhas.join("\n");
}

/* ---------------- Animação de números ---------------- */
function animarNumero(el, alvo) {
  cancelAnimationFrame(el._raf);
  if (!Number.isFinite(alvo) || Math.abs(alvo) >= 1e12 || reduzMovimento) { el.textContent = fmt(alvo); return; }
  const inteiro = Number.isInteger(alvo);
  const inicio = performance.now(), dur = 700;
  const passo = (t) => {
    const p = Math.min(1, (t - inicio) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    const v = alvo * e;
    el.textContent = p < 1 ? fmt(inteiro ? Math.round(v) : v) : fmt(alvo);
    if (p < 1) el._raf = requestAnimationFrame(passo);
  };
  el._raf = requestAnimationFrame(passo);
}

/* ---------------- Gráfico (canvas) ---------------- */
const canvas = $("#grafico");
const ctx = canvas.getContext("2d");
const tooltip = $("#tooltip");
let progressoGrafico = 1, hoverIdx = -1, geometria = null;

function iniciarGrafico() {
  if (reduzMovimento) { progressoGrafico = 1; desenharGrafico(); return; }
  const inicio = performance.now();
  cancelAnimationFrame(canvas._raf);
  const passo = (t) => {
    progressoGrafico = Math.min(1, (t - inicio) / 900);
    desenharGrafico();
    if (progressoGrafico < 1) canvas._raf = requestAnimationFrame(passo);
  };
  canvas._raf = requestAnimationFrame(passo);
}

function cor(variavel, alfa = 1) {
  const v = getComputedStyle(document.body).getPropertyValue(variavel).trim();
  return `hsl(${v} / ${alfa})`;
}

function desenharGrafico() {
  const R = estado.resultado;
  const dpr = window.devicePixelRatio || 1;
  const { width: W, height: H } = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!R || !R.termos.length) return;

  const termos = R.termos.slice(0, MAX_BARRAS).map((v) => (Number.isFinite(v) ? v : 0));
  const somas = R.somas.slice(0, MAX_BARRAS).map((v) => (Number.isFinite(v) ? v : 0));
  const n = termos.length;
  const esq = 62, dir = 66, topo = 18, base = 34;
  const pw = W - esq - dir, ph = H - topo - base;

  let tMin = Math.min(0, ...termos), tMax = Math.max(0, ...termos);
  if (tMin === tMax) tMax = tMin + 1;
  const extras = R.modo === "meta" && Number.isFinite(R.meta) ? [R.meta] : [];
  let sMin = Math.min(0, ...somas, ...extras), sMax = Math.max(0, ...somas, ...extras);
  if (sMin === sMax) sMax = sMin + 1;
  const yT = (v) => topo + ((tMax - v) / (tMax - tMin)) * ph;
  const yS = (v) => topo + ((sMax - v) / (sMax - sMin)) * ph;
  const passo = pw / n;
  const xC = (i) => esq + passo * (i + 0.5);
  geometria = { esq, pw, passo, n, xC, yT, termos, somas };

  // grade + rótulos dos eixos
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textBaseline = "middle";
  for (let k = 0; k <= 4; k++) {
    const y = topo + (ph * k) / 4;
    ctx.strokeStyle = "hsl(230 40% 80% / .07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(esq, y); ctx.lineTo(esq + pw, y); ctx.stroke();
    ctx.fillStyle = cor("--acento", .75);
    ctx.textAlign = "right";
    ctx.fillText(fmtCurto(tMax - ((tMax - tMin) * k) / 4), esq - 10, y);
    ctx.fillStyle = "hsl(48 96% 64% / .8)";
    ctx.textAlign = "left";
    ctx.fillText(fmtCurto(sMax - ((sMax - sMin) * k) / 4), esq + pw + 10, y);
  }

  // linha do zero
  ctx.strokeStyle = "hsl(230 40% 85% / .25)";
  ctx.beginPath(); ctx.moveTo(esq, yT(0)); ctx.lineTo(esq + pw, yT(0)); ctx.stroke();

  // barras dos termos
  const larg = Math.max(2, Math.min(passo * 0.62, 46));
  const ease = 1 - Math.pow(1 - progressoGrafico, 3);
  const grad = ctx.createLinearGradient(0, topo, 0, topo + ph);
  grad.addColorStop(0, cor("--acento", .95));
  grad.addColorStop(1, cor("--acento-2", .35));
  for (let i = 0; i < n; i++) {
    const atraso = (i / n) * 0.35;
    const p = Math.max(0, Math.min(1, (ease - atraso) / (1 - atraso)));
    const y0 = yT(0), y1 = y0 + (yT(termos[i]) - y0) * p;
    const x = xC(i) - larg / 2;
    ctx.fillStyle = i === hoverIdx ? cor("--acento", 1) : grad;
    raioRet(x, Math.min(y0, y1), larg, Math.abs(y1 - y0), Math.min(6, larg / 2), termos[i] >= 0);
  }

  // meta
  if (extras.length) {
    const y = yS(R.meta);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = cor("--erro", .9);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(esq, y); ctx.lineTo(esq + pw, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cor("--erro", 1);
    ctx.textAlign = "left";
    ctx.fillText(`meta ${fmtCurto(R.meta)}`, esq + 6, y - 10);
  }

  // linha da soma acumulada
  const visiveis = Math.max(1, Math.ceil(n * ease));
  ctx.strokeStyle = "hsl(48 96% 64%)";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.shadowColor = "hsl(48 96% 64% / .6)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < visiveis; i++) {
    const x = xC(i), y = yS(somas[i]);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (n <= 60) {
    for (let i = 0; i < visiveis; i++) {
      ctx.fillStyle = i === hoverIdx ? "#fff" : "hsl(48 96% 64%)";
      ctx.beginPath(); ctx.arc(xC(i), yS(somas[i]), i === hoverIdx ? 5 : 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // rótulos do eixo x
  ctx.fillStyle = "hsl(228 14% 52%)";
  ctx.textAlign = "center";
  const pular = Math.ceil(n / 14);
  for (let i = 0; i < n; i += pular) ctx.fillText(String(i + 1), xC(i), topo + ph + 18);
  if (R.termos.length > MAX_BARRAS) {
    ctx.textAlign = "right";
    ctx.fillText(`mostrando ${MAX_BARRAS} de ${R.termos.length} termos`, esq + pw, topo + 4);
  }
}

function raioRet(x, y, w, h, r, emCima) {
  if (h < 0.5) return;
  r = Math.min(r, h);
  ctx.beginPath();
  if (emCima) {
    ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.quadraticCurveTo(x, y + h, x + r, y + h);
    ctx.lineTo(x + w - r, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r); ctx.lineTo(x + w, y);
  }
  ctx.closePath();
  ctx.fill();
}

canvas.addEventListener("mousemove", (ev) => {
  if (!geometria) return;
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const i = Math.floor((x - geometria.esq) / geometria.passo);
  if (i < 0 || i >= geometria.n) { esconderTooltip(); return; }
  if (i !== hoverIdx) { hoverIdx = i; desenharGrafico(); }
  tooltip.hidden = false;
  tooltip.innerHTML = `<b>a<sub>${i + 1}</sub> = ${fmt(estado.resultado.termos[i])}</b><br><span class="t-soma">S<sub>${i + 1}</sub> = ${fmt(estado.resultado.somas[i])}</span>`;
  tooltip.style.left = `${geometria.xC(i)}px`;
  tooltip.style.top = `${Math.min(geometria.yT(geometria.termos[i]), geometria.yT(0))}px`;
});
canvas.addEventListener("mouseleave", esconderTooltip);
function esconderTooltip() { tooltip.hidden = true; if (hoverIdx !== -1) { hoverIdx = -1; desenharGrafico(); } }

new ResizeObserver(() => desenharGrafico()).observe(canvas.parentElement);

/* ---------------- Interface: tipo, modo, presets ---------------- */
function atualizarInterface() {
  document.body.dataset.tipo = estado.tipo;
  document.body.dataset.modo = estado.modo;
  const pa = estado.tipo === "PA";
  $("#simbolo-razao").textContent = pa ? "r" : "q";
  $("#formula-topo").innerHTML = pa ? "a<sub>n+1</sub> = a<sub>n</sub> + r" : "a<sub>n+1</sub> = a<sub>n</sub> · q";
  $("#btn-texto").textContent = estado.modo === "gerar" ? `Gerar ${estado.tipo}` : "Descobrir quantos termos";
  document.querySelectorAll(".aba").forEach((b) => {
    const ativa = b.dataset.modo === estado.modo;
    b.classList.toggle("ativa", ativa);
    b.setAttribute("aria-selected", ativa);
  });
  $(`#tipo-${estado.tipo.toLowerCase()}`).checked = true;
}

document.querySelectorAll('input[name="tipo"]').forEach((r) =>
  r.addEventListener("change", () => { estado.tipo = r.value; atualizarInterface(); calcular(); }));

document.querySelectorAll(".aba").forEach((b) =>
  b.addEventListener("click", () => { estado.modo = b.dataset.modo; atualizarInterface(); calcular(); }));

$("#formulario").addEventListener("submit", (ev) => { ev.preventDefault(); calcular(); });

let debounce;
$("#formulario").addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(calcular, 300); });

const PRESETS = [
  { nome: "Exemplo PA", tipo: "PA", modo: "gerar", a1: "5", r: "3", n: 6 },
  { nome: "Exemplo PG", tipo: "PG", modo: "gerar", a1: "2", r: "3", n: 5 },
  { nome: "PA crescente", tipo: "PA", modo: "gerar", a1: "2", r: "4", n: 8 },
  { nome: "PA decrescente", tipo: "PA", modo: "gerar", a1: "50", r: "-7", n: 6 },
  { nome: "PG crescente", tipo: "PG", modo: "gerar", a1: "3", r: "2", n: 7 },
  { nome: "PG decrescente", tipo: "PG", modo: "gerar", a1: "1024", r: "0,5", n: 6 },
  { nome: "Meta 1000", tipo: "PG", modo: "meta", a1: "2", r: "2", meta: "1000" },
  { nome: "Meta 100", tipo: "PA", modo: "meta", a1: "1", r: "1", meta: "100" },
];

$("#presets").innerHTML = PRESETS.map((p, i) =>
  `<button type="button" class="preset" data-i="${i}" data-tipo="${p.tipo}" id="preset-${i}"><span class="tag">${p.tipo}</span>${p.nome}</button>`).join("");

$("#presets").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".preset");
  if (!btn) return;
  const p = PRESETS[btn.dataset.i];
  estado.tipo = p.tipo; estado.modo = p.modo;
  $("#primeiro").value = p.a1;
  $("#razao").value = p.r;
  if (p.n) $("#quantidade").value = p.n;
  if (p.meta) $("#meta").value = p.meta;
  atualizarInterface();
  calcular();
});

/* ---------------- Copiar resultado (formato do terminal) ---------------- */
$("#btn-copiar").addEventListener("click", async () => {
  const R = estado.resultado;
  if (!R) return;
  const texto = R.modo === "gerar"
    ? `${R.tipo} gerada:\n${R.termos.map(fmt).join(", ")}\nÚltimo termo: ${fmt(R.termos.at(-1))}\nSoma dos termos: ${fmt(R.soma)}`
    : `Tipo: ${R.tipo}\nPrimeiro termo: ${fmt(R.primeiro)}\nRazão: ${fmt(R.razao)}\nMeta: ${fmt(R.meta)}\nResultado:\n` +
      (R.quantidade === null ? "A meta não foi ultrapassada." : `São necessários ${R.quantidade} termos.\nSoma obtida: ${fmt(R.soma)}`);
  try { await navigator.clipboard.writeText(texto); mostrarToast("Resultado copiado!"); }
  catch { mostrarToast("Não foi possível copiar."); }
});

function mostrarToast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 1800);
}

/* ---------------- Início ---------------- */
atualizarInterface();
calcular();
