document.addEventListener('DOMContentLoaded', () => {
  const desiredWidth = document.getElementById('desiredWidth');
  const desiredHeight = document.getElementById('desiredHeight');
  const desiredDepth = document.getElementById('desiredDepth');
  const seamAllowance = document.getElementById('seamAllowance');
  const unitSelect = document.getElementById('unit');

  const calculateBtn = document.getElementById('calculate');
  const results = document.getElementById('results');
  const fabricWidthEl = document.getElementById('fabricWidth');
  const fabricHeightEl = document.getElementById('fabricHeight');
  const copyBtn = document.getElementById('copyBtn');

  function showError(msg) {
    alert(msg);
  }

  function fmt(n) {
    // trim unnecessary decimals
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  }

  // Unit conversion helpers: base unit internally = cm
  const toCm = (value, unit) => {
    if (unit === 'cm') return value;
    if (unit === 'mm') return value / 10;
    if (unit === 'in') return value * 2.54;
    return value;
  };
  const fromCm = (valueCm, unit) => {
    if (unit === 'cm') return valueCm;
    if (unit === 'mm') return valueCm * 10;
    if (unit === 'in') return valueCm / 2.54;
    return valueCm;
  };

  function buildConversions(cmValue) {
    // return HTML with other unit conversions
    const mm = fromCm(cmValue, 'mm');
    const cm = fromCm(cmValue, 'cm');
    const inch = fromCm(cmValue, 'in');
    return `<p>Konverteringar: ${fmt(cm)} cm — ${fmt(mm)} mm — ${fmt(inch)} in</p>`;
  }

function renderDiagram(fabricWcm, fabricHcm, dCm, sCm) {
  const canvasSize = 260;
  const padding = 24;
  const svg = document.getElementById('diagram');
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const w = fabricWcm;
  const h = fabricHcm;
  const corner = dCm / 2 + sCm; // hur mycket man ska klippa bort (cm)
  const drawArea = canvasSize - padding * 3;
  const scale = Math.max(w / drawArea, h / drawArea, 1e-6);
  const drawW = w / scale;
  const drawH = h / scale;
  const cornerDraw = corner / scale;
  const offsetX = padding + (drawArea - drawW) / 2;
  const offsetY = padding + (drawArea - drawH) / 2;
  const ns = 'http://www.w3.org/2000/svg';

  // pilmarkörer
  const defs = document.createElementNS(ns, 'defs');
  const marker = document.createElementNS(ns, 'marker');
  marker.setAttribute('id', 'arrow');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '5');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '5');
  marker.setAttribute('markerHeight', '5');
  marker.setAttribute('orient', 'auto-start-reverse');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  path.setAttribute('fill', '#000');
  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // ytterrektangel
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', offsetX);
  rect.setAttribute('y', offsetY);
  rect.setAttribute('width', drawW);
  rect.setAttribute('height', drawH);
  rect.setAttribute('fill', '#ffffff');
  rect.setAttribute('stroke', '#0f172a');
  rect.setAttribute('stroke-width', '1');
  svg.appendChild(rect);

  // mittlinje
  const midY = offsetY + drawH / 2;
  const midLine = document.createElementNS(ns, 'line');
  midLine.setAttribute('x1', offsetX);
  midLine.setAttribute('y1', midY);
  midLine.setAttribute('x2', offsetX + drawW);
  midLine.setAttribute('y2', midY);
  midLine.setAttribute('stroke', '#888');
  midLine.setAttribute('stroke-width', '0.6');
  midLine.setAttribute('stroke-dasharray', '4,2');
  svg.appendChild(midLine);

  // hörnklipp (4)
  const corners = [
    [offsetX, offsetY, 0, -4],
    [offsetX + drawW - cornerDraw, offsetY, 4, -4],
    [offsetX, offsetY + drawH - cornerDraw, 0, 12],
    [offsetX + drawW - cornerDraw, offsetY + drawH - cornerDraw, 4, 12]
  ];
  corners.forEach(([x, y, tx, ty]) => {
    const cut = document.createElementNS(ns, 'rect');
    cut.setAttribute('x', x);
    cut.setAttribute('y', y);
    cut.setAttribute('width', cornerDraw);
    cut.setAttribute('height', cornerDraw);
    cut.setAttribute('fill', 'none');
    cut.setAttribute('stroke', '#000');
    cut.setAttribute('stroke-dasharray', '3,2');
    svg.appendChild(cut);

    // text som visar måttet
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', x + cornerDraw / 2 + tx);
    label.setAttribute('y', y + cornerDraw / 2 + ty);
    label.setAttribute('font-size', '7');
    label.setAttribute('text-anchor',  'middle');
    label.textContent = `${fmt(corner)} cm`;
    svg.appendChild(label);
  });

  const sideCuts = [
  [offsetX, midY - cornerDraw, 0, -1],     // vänster
  [offsetX + drawW - cornerDraw, midY - cornerDraw, cornerDraw + 4, 0] // höger
];

sideCuts.forEach(([x, y, tx, ty], i) => {
  const cut = document.createElementNS(ns, 'rect');
  cut.setAttribute('x', x);
  cut.setAttribute('y', y);
  cut.setAttribute('width', cornerDraw);
  cut.setAttribute('height', 2 * cornerDraw);
  cut.setAttribute('fill', 'none');
  cut.setAttribute('stroke', '#000');
  cut.setAttribute('stroke-dasharray', '3,2');
  svg.appendChild(cut);

  // Text som visar hur mycket som klipps bort i bredd (d/2 + s)
  const label = document.createElementNS(ns, 'text');
  label.setAttribute('x', x + cornerDraw / 2);
  label.setAttribute('y', y - 4);
  label.setAttribute('font-size', '7');
  label.setAttribute('text-anchor', 'middle');
  label.textContent = `${fmt(corner)} cm`;
  svg.appendChild(label);

  // Text som visar hela höjden på klippet (d + 2s)
  const cutHeight = dCm + 2 * sCm;
  const heightLabel = document.createElementNS(ns, 'text');
  heightLabel.setAttribute('x', x + (i === 0 ? 30 : cornerDraw - 30)); // vänster längre ut, höger innanför
  heightLabel.setAttribute('y', y + cornerDraw); // centrera vertikalt på rektangeln
  heightLabel.setAttribute('font-size', '7');
  heightLabel.setAttribute('text-anchor', i === 0 ? 'end' : 'start');
  heightLabel.textContent = `${fmt(cutHeight)} cm`;
  svg.appendChild(heightLabel);
});


  // måttpil - bredd
  const arrowY = offsetY + drawH + 12;
  const arrowLine = document.createElementNS(ns, 'line');
  arrowLine.setAttribute('x1', offsetX);
  arrowLine.setAttribute('y1', arrowY);
  arrowLine.setAttribute('x2', offsetX + drawW);
  arrowLine.setAttribute('y2', arrowY);
  arrowLine.setAttribute('stroke', '#000');
  arrowLine.setAttribute('marker-start', 'url(#arrow)');
  arrowLine.setAttribute('marker-end', 'url(#arrow)');
  svg.appendChild(arrowLine);

  const widthText = document.createElementNS(ns, 'text');
  widthText.setAttribute('x', offsetX + drawW / 2);
  widthText.setAttribute('y', arrowY + 10);
  widthText.setAttribute('text-anchor', 'middle');
  widthText.setAttribute('font-size', '7');
  widthText.textContent = `${fmt(w)} cm`;
  svg.appendChild(widthText);

  // måttpil - höjd
  const arrowX = offsetX - 8;
  const arrowLineVert = document.createElementNS(ns, 'line');
  arrowLineVert.setAttribute('x1', arrowX);
  arrowLineVert.setAttribute('y1', offsetY);
  arrowLineVert.setAttribute('x2', arrowX);
  arrowLineVert.setAttribute('y2', offsetY + drawH);
  arrowLineVert.setAttribute('stroke', '#000');
  arrowLineVert.setAttribute('marker-start', 'url(#arrow)');
  arrowLineVert.setAttribute('marker-end', 'url(#arrow)');
  svg.appendChild(arrowLineVert);

  const heightText = document.createElementNS(ns, 'text');
  heightText.setAttribute('x', arrowX - 2);
  heightText.setAttribute('y', offsetY + drawH / 2 + 3);
  heightText.setAttribute('text-anchor', 'end');
  heightText.setAttribute('font-size', '7');
  heightText.textContent = ` ${fmt(h)} cm`;
  svg.appendChild(heightText);
}

 



  function calculate() {
    const unit = unitSelect.value;
    const w = parseFloat(desiredWidth.value);
    const h = parseFloat(desiredHeight.value);
    const d = parseFloat(desiredDepth.value);
    const s = parseFloat(seamAllowance.value);

    if (Number.isNaN(w) || Number.isNaN(h) || Number.isNaN(d) || Number.isNaN(s)) {
      showError('Vänligen fyll i alla fält med numeriska värden.');
      return;
    }
    if (w < 0 || h < 0 || d < 0 || s < 0) {
      showError('Måtten kan inte vara negativa.');
      return;
    }

    // Convert inputs to cm for internal calculation
    const wCm = toCm(w, unit);
    const hCm = toCm(h, unit);
    const dCm = toCm(d, unit);
    const sCm = toCm(s, unit);

    // Enligt formlerna (beräkna i cm)
    const fabricWidthCm = wCm + dCm + 2 * sCm;
    const fabricHeightCm = 2 * hCm + dCm + 2 * sCm;

    // Show inputs in selected units
    inWidth.textContent = `${fmt(w)} ${unit}`;
    inHeight.textContent = `${fmt(h)} ${unit}`;
    inDepth.textContent = `${fmt(d)} ${unit}`;
    inSeam.textContent = `${fmt(s)} ${unit}`;

    // total seam allowance (both sides) in selected unit
    const totalSeamSelected = fromCm(2 * sCm, unit);
    totalSeam.textContent = `${fmt(totalSeamSelected)} ${unit}`;

    // Output in selected unit
    const fabricWidthSelected = fromCm(fabricWidthCm, unit);
    const fabricHeightSelected = fromCm(fabricHeightCm, unit);
    fabricWidthEl.textContent = `${fmt(fabricWidthSelected)} ${unit}`;
    fabricHeightEl.textContent = `${fmt(fabricHeightSelected)} ${unit}`;

    // Conversions (also show cm/mm/in)
    conversions.innerHTML = `
      <p><strong>Primärt (valda enheter):</strong> ${fmt(fabricWidthSelected)} ${unit} × ${fmt(fabricHeightSelected)} ${unit}</p>
      ${buildConversions(fabricWidthCm)}
      `;

    // Render simple diagram using cm values
    renderDiagram(fabricWidthCm, fabricHeightCm, dCm, sCm);

    results.classList.remove('hidden');
  }

  calculateBtn.addEventListener('click', calculate);

  copyBtn.addEventListener('click', async () => {
    const text = `Tygbredd: ${fabricWidthEl.textContent} — Tyghöjd: ${fabricHeightEl.textContent} (konverteringar: ${conversions.textContent})`;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Kopierat!';
      setTimeout(() => copyBtn.textContent = 'Kopiera resultat', 1500);
    } catch (e) {
      alert('Kunde inte kopiera automatiskt. Markera och kopiera manuellt: ' + text);
    }
  });


});
