/* Tabelas de IRS 2026 - literaciafinanceira.pt
   Retencao na fonte, continente: Despacho n.o 233-A/2026, de 6 de janeiro, Tabelas I a XI (lidas do PDF do Diario da Republica).
   Retencao na fonte, Acores: Despacho n.o 1179/2026, de 3 de fevereiro (valores da Circular n.o 3/2026 da AT, que reproduz as tabelas em texto).
   Retencao na fonte, Madeira: Despacho n.o 19/2026 da Secretaria Regional das Financas, com os valores da Declaracao de Retificacao n.o 10/2026.
   Escaloes: artigo 68.o do Codigo do IRS, redacao da Lei n.o 73-A/2025 (OE 2026). Acores: menos 30% (DLR n.o 2/99/A). Madeira: DLR n.o 8/2025/M.
   Reutiliza o CSS do comparador de depositos (#lf-dp .dp-*) mais tabelas-irs.css. */
(function () {
  'use strict';
  if (window.__lfIrsInit) return;
  window.__lfIrsInit = true;

  var VERIFICADO = '1 de outubro de 2026';
  var IAS = 537.13, DED_ESP = 8.54 * IAS, MIN_EXIST = 12880;
  /* Valores por omissao do continente. Sao substituidos pelos de data/irs.json, que o atualizar_irs.py mantem a partir do Diario da Republica e do Portal das Financas. */
  var DESP = { nome: 'Despacho n.º 233-A/2026', data: '6 de janeiro', inicio: '1 de janeiro de 2026', url: null };
  var DESP0 = DESP.nome;
  var REDACAO = 'Lei n.º 73-A/2025, de 30/12', REDACAO0 = REDACAO, ANO = '2026';
  /* [limite superior do rendimento coletavel, taxa, parcela a abater] */
  var ESC = [
    [8342, 12.5, 0], [12587, 15.7, 266.94], [17838, 21.2, 959.23], [23089, 24.1, 1476.53], [29397, 31.1, 3092.76],
    [43090, 34.9, 4209.85], [46566, 43.1, 7743.23], [86634, 44.6, 8441.72], [Infinity, 48, 11387.27]
  ];
  var MEDIA = ['12,500%', '13,579%', '15,823%', '17,705%', '20,579%', '25,130%', '26,472%', '34,856%', '-'];
  /* Taxas de IRS na Madeira em 2026 (Decreto Legislativo Regional n.o 8/2025/M), com os mesmos limites dos escaloes nacionais.
     As dos Acores nao estao aqui: sao as taxas nacionais em vigor menos 30% e saem de ESC. */
  var TAXAS_M = [8.75, 10.99, 14.84, 16.87, 21.77, 24.43, 30.17, 31.22, 33.6];
  /* Tabelas de retencao. Cada linha: [remuneracao mensal ate (null = acima da anterior), taxa marginal maxima em %,
     parcela a abater em EUR ou [taxa, fator, constante] para "taxa x fator x (constante - R)",
     parcela adicional (por dependente nas tabelas I a VII; por deficiente das Forcas Armadas nas X e XI; null = nao tem),
     taxa efetiva no limite do escalao em %] */
  var RET = [
    { k: 'I', tipo: 'A', t: 'Não casado sem dependentes ou casado dois titulares', r: [
      [920, 0, 0, 0, 0],
      [1042, 12.5, [12.5, 2.6, 1273.85], 21.43, 5.3],
      [1108, 15.7, [15.7, 1.35, 1554.83], 21.43, 7.2],
      [1154, 15.7, 94.71, 21.43, 7.5],
      [1212, 21.2, 158.18, 21.43, 8.1],
      [1819, 24.1, 193.33, 21.43, 13.5],
      [2119, 31.1, 320.66, 21.43, 16],
      [2499, 34.9, 401.19, 21.43, 18.8],
      [3305, 38.36, 487.66, 21.43, 23.6],
      [5547, 39.69, 531.62, 21.43, 30.1],
      [20221, 44.95, 823.4, 21.43, 40.9],
      [null, 47.17, 1272.31, 21.43, null]] },
    { k: 'II', tipo: 'A', t: 'Não casado com um ou mais dependentes', r: [
      [920, 0, 0, 0, 0],
      [1042, 12.5, [12.5, 2.6, 1273.85], 34.29, 5.3],
      [1108, 15.7, [15.7, 1.35, 1554.83], 34.29, 7.2],
      [1154, 15.7, 94.71, 34.29, 7.5],
      [1212, 21.2, 158.18, 34.29, 8.1],
      [1819, 24.1, 193.33, 34.29, 13.5],
      [2119, 31.1, 320.66, 34.29, 16],
      [2499, 34.9, 401.19, 34.29, 18.8],
      [3305, 38.36, 487.66, 34.29, 23.6],
      [5547, 39.69, 531.62, 34.29, 30.1],
      [20221, 44.95, 823.4, 34.29, 40.9],
      [null, 47.17, 1272.31, 34.29, null]] },
    { k: 'III', tipo: 'A', t: 'Casado, único titular', r: [
      [991, 0, 0, 0, 0],
      [1042, 12.5, [12.5, 2.6, 1372.15], 42.86, 2.2],
      [1108, 12.5, [12.5, 1.35, 1677.85], 42.86, 3.8],
      [1119, 12.5, 96.17, 42.86, 3.9],
      [1432, 12.72, 98.64, 42.86, 5.8],
      [1962, 15.7, 141.32, 42.86, 8.5],
      [2240, 19.38, 213.53, 42.86, 9.8],
      [2773, 22.77, 289.47, 42.86, 12.3],
      [3389, 25.7, 370.72, 42.86, 14.8],
      [5965, 28.81, 476.12, 42.86, 20.8],
      [20265, 38.43, 1049.96, 42.86, 33.2],
      [null, 47.17, 2821.13, 42.86, null]] },
    { k: 'IV', tipo: 'A', t: 'Não casado ou casado dois titulares sem dependentes — Pessoa com deficiência', r: [
      [1694, 0, 0, null, 0],
      [2063, 21.2, 359.13, null, 3.8],
      [2492, 31.1, 563.37, null, 8.5],
      [4487, 34.9, 658.07, null, 20.2],
      [4753, 38.36, 813.33, null, 21.2],
      [6687, 39.69, 876.55, null, 26.6],
      [20468, 44.95, 1228.29, null, 38.9],
      [null, 47.17, 1682.68, null, null]] },
    { k: 'V', tipo: 'A', t: 'Não casado, com um ou mais dependentes — Pessoa com deficiência', r: [
      [1938, 0, 0, 0, 0],
      [2063, 21.32, 413.19, 42.86, 1.3],
      [2854, 31.1, 614.96, 42.86, 9.6],
      [4504, 34.9, 723.42, 42.86, 18.8],
      [6826, 38.36, 879.26, 42.86, 25.5],
      [7048, 39.69, 970.05, 42.86, 25.9],
      [20468, 44.95, 1340.78, 42.86, 38.4],
      [null, 47.17, 1795.17, 42.86, null]] },
    { k: 'VI', tipo: 'A', t: 'Casado dois titulares, com um ou mais dependentes — Pessoa com deficiência', r: [
      [1668, 0, 0, 0, 0],
      [2068, 20.49, 341.78, 21.43, 4],
      [2497, 24.1, 416.44, 21.43, 7.4],
      [3107, 31.1, 591.23, 21.43, 12.1],
      [4504, 34.9, 709.3, 21.43, 19.2],
      [6826, 38.36, 865.14, 21.43, 25.7],
      [7048, 39.69, 955.93, 21.43, 26.1],
      [20468, 44.95, 1326.66, 21.43, 38.5],
      [null, 47.17, 1781.05, 21.43, null]] },
    { k: 'VII', tipo: 'A', t: 'Casado único titular — Pessoa com deficiência', r: [
      [2325, 0, 0, 0, 0],
      [3494, 22.77, 529.41, 42.86, 7.6],
      [3761, 25.7, 631.79, 42.86, 8.9],
      [6687, 28.81, 748.76, 42.86, 17.6],
      [20468, 42.44, 1660.2, 42.86, 34.3],
      [null, 47.17, 2628.34, 42.86, null]] },
    { k: 'VIII', tipo: 'H', t: 'Não casado ou casado dois titulares', r: [
      [920, 0, 0, null, 0],
      [1042, 12.5, [12.5, 2.6, 1320.92], null, 3.8],
      [1100, 15.7, [15.7, 1.35, 1627.01], null, 5.5],
      [1133, 15.7, 111.7, null, 5.8],
      [1239, 21.2, 174.02, null, 7.2],
      [1869, 24.1, 209.96, null, 12.9],
      [2114, 31.1, 340.79, null, 15],
      [2361, 34.9, 421.13, null, 17.1],
      [3462, 43.1, 614.74, null, 25.3],
      [5833, 44.6, 666.67, null, 33.2],
      [18332, 50.5, 1010.82, null, 45],
      [null, 53, 1469.12, null, null]] },
    { k: 'IX', tipo: 'H', t: 'Casado único titular', r: [
      [920, 0, 0, null, 0],
      [1042, 12.5, [12.5, 2.6, 1381.69], null, 1.9],
      [1100, 12.5, [12.5, 1.728, 1553.11], null, 3.6],
      [1170, 12.5, 97.88, null, 4.1],
      [1526, 15.9, 137.66, null, 6.9],
      [1884, 19.28, 189.24, null, 9.2],
      [2314, 21.77, 236.16, null, 11.6],
      [3245, 27.92, 378.48, null, 16.3],
      [3480, 32.33, 521.59, null, 17.3],
      [6085, 32.37, 522.99, null, 23.8],
      [18350, 42.93, 1165.57, null, 36.6],
      [null, 53, 3013.42, null, null]] },
    { k: 'X', tipo: 'H', t: 'Não casado ou casado dois titulares — Pessoa com deficiência', r: [
      [1816, 0, 0, 0, 0],
      [2063, 24.1, 437.66, 18.19, 2.9],
      [2492, 31.1, 582.07, 18.19, 7.7],
      [3280, 34.9, 676.77, 18.19, 14.3],
      [4598, 43.1, 945.73, 18.19, 22.5],
      [6627, 44.6, 1014.7, 18.19, 29.3],
      [18529, 50.5, 1405.7, 18.19, 42.9],
      [null, 53, 1868.93, 18.19, null]] },
    { k: 'XI', tipo: 'H', t: 'Casado único titular — Pessoa com deficiência', r: [
      [2257, 0, 0, 0, 0],
      [2782, 18.22, 411.23, 36.38, 3.4],
      [3359, 23.73, 564.52, 36.38, 6.9],
      [4074, 30.17, 780.84, 36.38, 11],
      [6266, 36.37, 1033.43, 36.38, 19.9],
      [18169, 46.97, 1697.63, 36.38, 37.6],
      [null, 53, 2793.23, 36.38, null]] }
  ];

  /* Regioes autonomas: as linhas das Tabelas I a XI, pela mesma ordem e no mesmo formato do continente.
     A Tabela II e igual a I, so muda a parcela por dependente (34,29 em vez de 21,43): sai da I com comDep().
     Os valores estao como foram publicados, incluindo as incoerencias da propria publicacao (ver README). */
  function comDep(linhas, v) { return linhas.map(function (r) { return [r[0], r[1], r[2], r[3] ? v : r[3], r[4]]; }); }

  /* Acores: Despacho n.o 1179/2026, de 3 de fevereiro */
  var A1 = [
    [966, 0, 0, 0, 0],
    [1042, 8.75, [8.75, 2.6, 1337.54], 21.43, 2.3],
    [1108, 10.99, [10.99, 1.35, 1652.49], 21.43, 3.7],
    [1154, 10.99, 80.79, 21.43, 4],
    [1212, 14.84, 125.22, 21.43, 4.5],
    [1819, 16.87, 149.83, 21.43, 8.6],
    [2119, 21.77, 238.97, 21.43, 10.5],
    [2499, 24.43, 295.34, 21.43, 12.6],
    [3305, 26.85, 355.82, 21.43, 16.1],
    [5547, 27.79, 386.89, 21.43, 20.8],
    [20221, 31.46, 590.47, 21.43, 28.5],
    [null, 33.02, 905.92, 21.43, null]];
  var RET_A = [A1, comDep(A1, 34.29),
    [ /* III */
      [1226, 0, 0, 0, 0],
      [1267, 7.28, 89.26, 42.86, 0.2],
      [1602, 9.64, 119.17, 42.86, 2.2],
      [1962, 10.99, 140.8, 42.86, 3.8],
      [2240, 13.57, 191.42, 42.86, 5],
      [2900, 15.94, 244.51, 42.86, 7.5],
      [3389, 17.99, 303.96, 42.86, 9],
      [5965, 20.17, 377.85, 42.86, 13.8],
      [20265, 27.1, 791.23, 42.86, 23.2],
      [null, 33.02, 1990.92, 42.86, null]],
    [ /* IV */
      [2119, 0, 0, null, 0],
      [2492, 21.77, 464.51, null, 3.1],
      [2748, 24.43, 530.8, null, 5.1],
      [3012, 26.85, 597.31, null, 7],
      [4883, 27.79, 625.63, null, 15],
      [20468, 31.02, 783.36, null, 27.2],
      [null, 32.55, 1096.53, null, null]],
    [ /* V */
      [2339, 0, 0, 0, 0],
      [2488, 21.77, 511.64, 42.86, 1.2],
      [3479, 24.43, 577.83, 42.86, 7.8],
      [3728, 26.85, 662.03, 42.86, 9.1],
      [6687, 27.79, 697.08, 42.86, 17.4],
      [20468, 31.02, 913.08, 42.86, 26.6],
      [null, 32.55, 1226.25, 42.86, null]],
    [ /* VI */
      [2143, 0, 0, 0, 0],
      [2790, 16.87, 363.67, 21.43, 3.8],
      [3215, 21.77, 500.38, 21.43, 6.2],
      [3479, 24.43, 585.9, 21.43, 7.6],
      [5915, 26.85, 670.1, 21.43, 15.5],
      [6687, 27.79, 725.71, 21.43, 16.9],
      [20468, 31.02, 941.71, 21.43, 26.4],
      [null, 32.55, 1254.88, 21.43, null]],
    [ /* VII */
      [2897, 0, 0, 0, 0],
      [4503, 15.94, 461.79, 42.86, 5.7],
      [6818, 17.99, 554.11, 42.86, 9.9],
      [6916, 20.17, 702.75, 42.86, 9.8],
      [20468, 29.26, 1331.42, 42.86, 22.8],
      [null, 32.55, 2004.82, 42.86, null]],
    [ /* VIII */
      [966, 0, 0, null, 0],
      [1042, 8.75, [8.75, 2.6, 1438.38], null, 0.1],
      [1100, 10.99, [10.99, 1.35, 1840.67], null, 1],
      [1133, 11.97, 120.67, null, 1.3],
      [1239, 14.84, 153.19, null, 2.5],
      [1869, 17.86, 190.61, null, 7.7],
      [2114, 22.27, 273.04, null, 9.4],
      [2361, 24.43, 318.71, null, 10.9],
      [3462, 28.28, 409.61, null, 16.4],
      [5833, 29.25, 443.2, null, 21.7],
      [18332, 32.83, 652.03, null, 29.3],
      [null, 34.45, 949.01, null, null]],
    [ /* IX */
      [1055, 0, 0, null, 0],
      [1100, 8.75, [8.75, 1.7, 1703.51], null, 0.5],
      [1159, 8.75, 91.25, null, 0.9],
      [1511, 11.13, 118.84, null, 3.3],
      [1866, 13.49, 154.5, null, 5.2],
      [2291, 15.24, 187.16, null, 7.1],
      [3212, 19.54, 285.68, null, 10.6],
      [3445, 22.63, 384.94, null, 11.5],
      [6025, 22.66, 385.98, null, 16.3],
      [18168, 30.45, 855.33, null, 25.7],
      [null, 34.45, 1582.05, null, null]],
    [ /* X */
      [2202, 0, 0, 0, 0],
      [2492, 21.77, 481.51, 18.19, 2.4],
      [3280, 24.43, 547.8, 18.19, 7.7],
      [4598, 30.17, 736.08, 18.19, 14.2],
      [6627, 31.22, 784.36, 18.19, 19.4],
      [18529, 34.85, 1024.93, 18.19, 29.3],
      [null, 36.57, 1343.63, 18.19, null]],
    [ /* XI */
      [2821, 0, 0, 0, 0],
      [3293, 16.61, 478.97, 36.38, 2.1],
      [3994, 21.12, 627.49, 36.38, 5.4],
      [6266, 25.46, 800.83, 36.38, 12.7],
      [18169, 32.88, 1265.77, 36.38, 25.9],
      [null, 37.1, 2032.51, 36.38, null]]
  ];

  /* Madeira: Despacho n.o 19/2026, de 20 de janeiro, com os valores da Declaracao de Retificacao n.o 10/2026, de 23 de janeiro */
  var M1 = [
    [980, 0, 0, 0, 0],
    [1028, 8.72, [8.72, 2.6, 1356.92], 21.43, 1.5],
    [1099, 12.04, [12.04, 1.35, 1696.78], 21.43, 3.2],
    [1201, 12.04, 97.17, 21.43, 3.9],
    [1623, 17.63, 164.31, 21.43, 7.5],
    [2332, 22.3, 240.11, 21.43, 12],
    [3203, 22.42, 242.91, 21.43, 14.8],
    [3614, 27.27, 398.26, 21.43, 16.3],
    [6585, 27.78, 416.7, 21.43, 21.5],
    [6954, 28.02, 432.51, 21.43, 21.8],
    [21411, 29.24, 517.35, 21.43, 26.8],
    [null, 32.78, 1275.3, 21.43, null]];
  var RET_M = [M1, comDep(M1, 34.29),
    [ /* III */
      [997, 0, 0, 0, 0],
      [1099, 8.72, [8.72, 1.35, 1819.64], 42.86, 1],
      [1141, 8.72, 84.84, 42.86, 1.3],
      [1857, 10.33, 103.22, 42.86, 4.8],
      [2485, 10.91, 114, 42.86, 6.3],
      [3331, 12.36, 150.04, 42.86, 7.9],
      [3895, 14.04, 206.01, 42.86, 8.8],
      [6673, 15.95, 280.41, 42.86, 11.7],
      [6878, 22.13, 692.81, 42.86, 12.1],
      [21411, 24.93, 885.4, 42.86, 20.8],
      [null, 32.78, 2566.17, 42.86, null]],
    [ /* IV */
      [2053, 0, 0, null, 0],
      [2591, 14.9, 305.9, null, 3.1],
      [3622, 18.63, 402.55, null, 7.5],
      [4668, 22.89, 556.85, null, 11],
      [7066, 26.16, 709.5, null, 16.1],
      [7168, 27.52, 805.6, null, 16.3],
      [21625, 30.58, 1024.95, null, 25.8],
      [null, 32.78, 1500.7, null, null]],
    [ /* V */
      [2345, 0, 0, 0, 0],
      [2591, 13.82, 324.08, 42.86, 1.3],
      [3622, 18.63, 448.71, 42.86, 6.2],
      [4668, 22.89, 603.01, 42.86, 10],
      [7066, 26.16, 755.66, 42.86, 15.5],
      [7168, 27.52, 851.76, 42.86, 15.6],
      [21625, 30.58, 1071.11, 42.86, 25.6],
      [null, 32.78, 1546.86, 42.86, null]],
    [ /* VI */
      [2019, 0, 0, 0, 0],
      [2528, 15.66, 316.18, 21.43, 3.2],
      [3049, 17.68, 367.25, 21.43, 5.6],
      [4272, 17.81, 371.22, 21.43, 9.1],
      [5734, 22.8, 584.4, 21.43, 12.6],
      [7066, 25.95, 765.03, 21.43, 15.1],
      [7550, 27.52, 875.97, 21.43, 15.9],
      [21625, 30.58, 1107, 21.43, 25.5],
      [null, 32.78, 1582.75, 21.43, null]],
    [ /* VII */
      [3061, 0, 0, 0, 0],
      [4668, 8.83, 270.29, 42.86, 3],
      [7066, 13.34, 480.82, 42.86, 6.5],
      [7168, 25.03, 1306.84, 42.86, 6.8],
      [21625, 28.1, 1526.9, 42.86, 21],
      [null, 32.78, 2538.95, 42.86, null]],
    [ /* VIII */
      [980, 0, 0, null, 0],
      [1028, 8.72, [8.72, 2.6, 1356.92], null, 1.5],
      [1099, 12.04, [12.04, 1.35, 1696.78], null, 3.2],
      [1218, 13.04, 108.16, null, 4.2],
      [1843, 20.61, 200.37, null, 9.7],
      [2248, 23.3, 249.95, null, 12.2],
      [2450, 25.79, 305.93, null, 13.3],
      [3362, 31.72, 451.22, null, 18.3],
      [4904, 32.6, 480.81, null, 22.8],
      [5758, 34.13, 555.85, null, 24.5],
      [19327, 36.18, 673.89, null, 32.7],
      [null, 38.55, 1131.94, null, null]],
    [ /* IX */
      [1028, 0, 0, null, 0],
      [1099, 8.72, [8.72, 1.834, 1635.71], null, 0.9],
      [1218, 8.72, 85.84, null, 1.7],
      [1804, 13.06, 138.71, null, 5.4],
      [2172, 17.71, 222.6, null, 7.5],
      [2984, 20.23, 277.34, null, 10.9],
      [3914, 22.78, 353.44, null, 13.7],
      [4142, 23.49, 381.23, null, 14.3],
      [4616, 28.08, 571.35, null, 15.7],
      [19327, 29.93, 656.75, null, 26.5],
      [null, 38.55, 2322.74, null, null]],
    [ /* X */
      [2197, 0, 0, 0, 0],
      [2362, 22.3, 489.94, 18.19, 1.6],
      [3173, 25.46, 564.58, 18.19, 7.7],
      [4104, 29.77, 701.34, 18.19, 12.7],
      [5476, 31.22, 760.85, 18.19, 17.3],
      [5950, 34.13, 920.21, 18.19, 18.7],
      [19517, 36.16, 1041, 18.19, 30.8],
      [null, 38.55, 1507.46, 18.19, null]],
    [ /* XI */
      [2918, 0, 0, 0, 0],
      [3844, 10.04, 292.97, 36.38, 2.4],
      [4409, 14.49, 464.03, 36.38, 4],
      [5858, 18.13, 624.52, 36.38, 7.5],
      [5950, 25.54, 1058.6, 36.38, 7.7],
      [19196, 32.65, 1481.65, 36.38, 24.9],
      [null, 38.55, 2614.22, 36.38, null]]
  ];
  function regiao(linhas) { return RET.map(function (t, i) { return { k: t.k, tipo: t.tipo, t: t.t, r: linhas[i] }; }); }
  var RETS = { C: RET, A: regiao(RET_A), M: regiao(RET_M) };

  var GRUPOS = [
    { l: 'Trabalho dependente', k: ['I', 'II', 'III'] },
    { l: 'Trabalho dependente, pessoa com deficiência', k: ['IV', 'V', 'VI', 'VII'] },
    { l: 'Pensões', k: ['VIII', 'IX', 'X', 'XI'] }
  ];
  /* Parcela a somar por dependente nas tabelas de pensoes (n.o 5, alinea c) dos tres despachos) */
  var DEP_PENSAO = { nc: 34.29, c2: 21.43, c1: 42.86 };
  var L = {
    lei: 'https://diariodarepublica.pt/dr/detalhe/lei/73-a-2025-993270096',
    art68: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx',
    desp: 'https://diariodarepublica.pt/dr/detalhe/despacho/233-a-2026-998488151',
    circ: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Circular_1_2026.pdf',
    acores: 'https://diariodarepublica.pt/dr/detalhe/despacho/1179-2026-1033397644',
    acoresCirc: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Circular-3-2026.pdf',
    madeira: 'https://joram.madeira.gov.pt/joram/2serie/Ano%20de%202026/IISerie-013-2026-01-20Supl4.pdf',
    madeiraRet: 'https://at.madeira.gov.pt/ficheiros/IISerie-016-2026-01-23Supl3.pdf',
    madeiraCirc: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Circular_2_2026.pdf',
    madeiraEsc: 'https://diariodarepublica.pt/dr/detalhe/decreto-legislativo-regional/8-2025-993031451',
    tabelasAT: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/tabela_ret_doclib/Pages/default.aspx',
    prop: 'https://eco.sapo.pt/2026/09/21/governo-ja-entregou-proposta-para-reduzir-irs-no-parlamento/',
    sal: 'https://www.literaciafinanceira.pt/simulador-salario-liquido'
  };
  /* Textos e despacho de cada regiao. O despacho do continente e o DESP, que pode vir do data/irs.json. */
  var REG = {
    C: { n: 'Continente', onde: 'no continente', de: 'do continente', para: 'para o continente' },
    A: { n: 'Açores', onde: 'nos Açores', de: 'dos Açores', para: 'para os Açores',
      desp: { nome: 'Despacho n.º 1179/2026', data: '3 de fevereiro', inicio: '1 de janeiro de 2026', url: L.acores } },
    M: { n: 'Madeira', onde: 'na Madeira', de: 'da Madeira', para: 'para a Madeira',
      desp: { nome: 'Despacho n.º 19/2026', data: '20 de janeiro', inicio: '1 de janeiro de 2026', url: L.madeira } }
  };
  var ORDEM = ['C', 'A', 'M'];
  function despacho(reg) { return reg === 'C' ? DESP : REG[reg].desp; }

  var S = { mes: 1500, tipo: 'A', sit: 'nc', dep: 0, def: false, reg: 'C', tab: 'I', res: null };

  function milhar(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function eur(v) { var p = Math.abs(v).toFixed(2).split('.'); return (v < 0 ? '-' : '') + milhar(p[0]) + ',' + p[1] + '€'; }
  function eurInt(v) { return milhar(String(Math.round(v))) + '€'; }
  function pct(v, d) { return v.toFixed(d).replace('.', ',') + '%'; }
  /* Casas decimais de uma taxa: 12,5% no continente, 8,75% nas regioes */
  function casas(v) { return Math.abs(v * 10 - Math.round(v * 10)) > 1e-9 ? 2 : 1; }
  function n2(v, d) { return v.toFixed(d == null ? 2 : d).replace('.', ','); }
  function ico(path) { return '<svg class="dp-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>'; }
  var CAL = '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>';
  function tabela(k, reg) { return RETS[reg || 'C'].filter(function (x) { return x.k === k; })[0]; }

  /* Escaloes de uma regiao a partir das taxas: os limites sao os nacionais, a parcela a abater e a taxa media sao calculadas */
  function montarEsc(taxas) {
    var e = [], m = [], parc = 0, acum = 0;
    ESC.forEach(function (x, i) {
      var de = i ? ESC[i - 1][0] : 0;
      if (i) parc += de * (taxas[i] - taxas[i - 1]) / 100;
      e.push([x[0], taxas[i], Math.round(parc * 100) / 100]);
      if (x[0] === Infinity) m.push('-');
      else { acum += (x[0] - de) * taxas[i] / 100; m.push((acum / x[0] * 100).toFixed(3).replace('.', ',') + '%'); }
    });
    return { esc: e, media: m };
  }
  function escaloes(reg) {
    /* Acores: taxas nacionais em vigor menos 30%. Madeira: tabela propria (se deixar de bater com os escaloes nacionais, usa a mesma regra dos 30%) */
    if (reg === 'A' || (reg === 'M' && TAXAS_M.length !== ESC.length)) return montarEsc(ESC.map(function (x) { return Math.round(x[1] * 70) / 100; }));
    if (reg === 'M') return montarEsc(TAXAS_M);
    return { esc: ESC, media: MEDIA };
  }

  /* Que tabela se aplica a cada situacao */
  function escolherTabela(tipo, sit, dep, def) {
    if (tipo === 'H') return def ? (sit === 'c1' ? 'XI' : 'X') : (sit === 'c1' ? 'IX' : 'VIII');
    if (def) return sit === 'c1' ? 'VII' : dep === 0 ? 'IV' : sit === 'nc' ? 'V' : 'VI';
    return sit === 'c1' ? 'III' : (sit === 'nc' && dep > 0) ? 'II' : 'I';
  }
  function linha(t, R) { for (var i = 0; i < t.r.length; i++) if (t.r[i][0] === null || R <= t.r[i][0]) return i; return t.r.length - 1; }

  function retencao(R, tipo, sit, dep, def, reg) {
    var k = escolherTabela(tipo, sit, dep, def), t = tabela(k, reg), i = linha(t, R), r = t.r[i];
    var taxa = r[1];
    /* Tres ou mais dependentes: menos um ponto percentual na taxa (so trabalho dependente) */
    var menos1 = tipo === 'A' && dep >= 3 && taxa > 0;
    if (menos1) taxa -= 1;
    var parcela = typeof r[2] === 'number' ? r[2] : r[2][0] / 100 * r[2][1] * (r[2][2] - R);
    var porDep = tipo === 'H' ? DEP_PENSAO[sit] : (r[3] || 0);
    if (r[1] === 0) porDep = 0;
    var valor = Math.max(0, R * taxa / 100 - parcela - porDep * dep);
    return { k: k, i: i, taxa: taxa, menos1: menos1, parcela: parcela, formula: typeof r[2] !== 'number', porDep: porDep, valor: valor, efetiva: R > 0 ? valor / R * 100 : 0 };
  }

  function anual(bruto, tipo, reg) {
    var E = escaloes(reg).esc;
    var ss = tipo === 'A' ? bruto * 0.11 : 0, ded = Math.min(bruto, Math.max(DED_ESP, ss)), col = Math.max(0, bruto - ded), i = 0;
    while (col > E[i][0]) i++;
    var coleta = Math.max(0, col * E[i][1] / 100 - E[i][2]);
    return { bruto: bruto, ded: ded, col: col, i: i, taxa: E[i][1], coleta: coleta, media: col > 0 ? coleta / col * 100 : 0, isento: bruto <= MIN_EXIST };
  }
  function exemplo() {
    var x = retencao(1500, 'A', 'nc', 0, false, S.reg);
    if (x.k !== 'I' || x.formula) return '';
    return 'Exemplo na Tabela I, com 1.500€ e sem dependentes: 1.500€ × ' + pct(x.taxa, 2) + ' − ' + eur(x.parcela) + ' = ' + eur(x.valor) + '.';
  }
  function calcular(mes, tipo, sit, dep, def, reg) {
    tipo = tipo || 'A'; sit = sit || 'nc'; dep = dep || 0; reg = RETS[reg] ? reg : 'C';
    return { mes: mes, tipo: tipo, sit: sit, dep: dep, def: !!def, reg: reg, ret: retencao(mes, tipo, sit, dep, !!def, reg), an: anual(mes * 14, tipo, reg) };
  }

  function faixa(t, i) {
    var r = t.r[i];
    return r[0] === null ? 'Mais de ' + eur(t.r[i - 1][0]) : 'Até ' + eur(r[0]);
  }
  function parcelaTxt(p) {
    /* O fator tem duas casas decimais (2,60) ou tres (1,728) */
    return typeof p === 'number' ? eur(p) : n2(p[0]) + '% × ' + n2(p[1], Math.abs(p[1] * 100 - Math.round(p[1] * 100)) > 1e-9 ? 3 : 2) + ' × (' + eur(p[2]) + ' − R)';
  }

  /* Escolha da regiao: os mesmos botoes das tabelas, numa linha propria */
  function botoesRegiao() {
    return '<div class="irs-grp" style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border-secondary)"><span class="irs-grp-l">Região</span><div class="irs-tabs is-3">' + ORDEM.map(function (r) {
      return '<button type="button" class="dp-tab' + (S.reg === r ? ' is-active' : '') + '" data-reg="' + r + '">' + REG[r].n + '</button>';
    }).join('') + '</div></div>';
  }

  function tabEscaloes(on) {
    var x = escaloes(S.reg), d = x.esc.some(function (e) { return casas(e[1]) === 2; }) ? 2 : 1;
    var h = '<div class="irs-box"><table class="irs-t"><thead><tr><th>Escalão</th><th>Rendimento coletável</th><th class="num">Taxa</th><th class="num">Taxa média</th><th class="num">Parcela a abater</th></tr></thead><tbody>';
    x.esc.forEach(function (e, i) {
      var de = i ? x.esc[i - 1][0] : 0;
      var fx = i === 0 ? 'Até ' + eurInt(e[0]) : e[0] === Infinity ? 'Mais de ' + eurInt(de) : 'De ' + eurInt(de) + ' a ' + eurInt(e[0]);
      h += '<tr' + (on === i ? ' class="is-on"' : '') + '><td>' + (i + 1) + '.º' + (on === i ? '<span class="irs-tu">O teu escalão</span>' : '') + '</td><td>' + fx + '</td><td class="num">' + pct(e[1], d) + '</td><td class="num">' + x.media[i] + '</td><td class="num">' + eur(e[2]) + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function tabRetencao() {
    var t = tabela(S.tab, S.reg), temAdic = t.r.some(function (r) { return r[3] !== null; }), fa = S.tab === 'X' || S.tab === 'XI';
    var on = S.res && S.res.reg === S.reg && S.res.ret.k === S.tab ? S.res.ret.i : -1;
    var h = '<div class="irs-box"><table class="irs-t"><thead><tr><th>Remuneração mensal</th><th class="num">Taxa marginal máxima</th><th class="num">Parcela a abater</th>' +
      (temAdic ? '<th class="num">' + (fa ? 'Adicional Forças Armadas' : 'Por dependente') + '</th>' : '') + '<th class="num">Taxa efetiva no limite</th></tr></thead><tbody>';
    t.r.forEach(function (r, i) {
      h += '<tr' + (on === i ? ' class="is-on"' : '') + '><td>' + faixa(t, i) + (on === i ? '<span class="irs-tu">O teu caso</span>' : '') + '</td><td class="num">' + pct(r[1], 2) + '</td><td class="num">' + parcelaTxt(r[2]) + '</td>' +
        (temAdic ? '<td class="num">' + eur(r[3] || 0) + '</td>' : '') + '<td class="num">' + (r[4] === null ? 'n.a.' : pct(r[4], 1)) + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }

  function resultado() {
    var x = S.res;
    if (!x) return '';
    var r = x.ret, a = x.an, t = tabela(r.k, x.reg), oque = x.tipo === 'H' ? 'pensão' : 'salário';
    var row = function (l, v, hl, sub) { return '<div class="irs-row' + (hl ? ' is-hl' : '') + '"><span>' + l + (sub ? '<small>' + sub + '</small>' : '') + '</span><span>' + v + '</span></div>'; };
    var conta;
    if (r.valor <= 0) conta = 'Com ' + eur(x.mes) + ' por mês não tens retenção na fonte.';
    else conta = eur(x.mes) + ' × ' + pct(r.taxa, 2) + ' − ' + eur(r.parcela) + (x.dep && r.porDep ? ' − ' + x.dep + ' × ' + eur(r.porDep) : '') + ' = <strong>' + eur(r.valor) + '</strong>' +
      (r.menos1 ? '. A taxa já tem o desconto de um ponto percentual para quem tem três ou mais dependentes' : '') + '.';
    var resumo = a.isento
      ? 'Com <strong>' + eurInt(a.bruto) + '</strong> brutos por ano ficas dentro do mínimo de existência (' + eurInt(MIN_EXIST) + '): <strong>não pagas IRS</strong>, mesmo que a conta pelos escalões dê imposto.'
      : 'Com <strong>' + eurInt(a.bruto) + '</strong> brutos por ano, o teu rendimento coletável é de <strong>' + eur(a.col) + '</strong> e ficas no <strong>' + (a.i + 1) + '.º escalão</strong>. A taxa de ' + pct(a.taxa, casas(a.taxa)) + ' só se aplica à parte do rendimento que cai nesse escalão. No total, o imposto é de <strong>' + eur(a.coleta) + '</strong> antes das deduções à coleta (despesas de saúde, educação, habitação e dependentes), que baixam este valor.';
    return '<div class="all-results_wrapper" id="irsRes"><div class="table-results_padding"><div class="table-results_wrapper"><div class="w-layout-grid grid is-calculadora"><div class="grid-block irs-gb">' +
      '<div class="text-weight-medium"><div class="text-size-extra-large"><div>Resultados</div></div></div><div class="spacer-2 spacer-mobile-1"></div>' +
      '<p class="irs-res-t">Retenção na fonte (por mês)</p>' +
      row('IRS retido por mês', eur(r.valor), true) +
      row('Tabela que se aplica', 'Tabela ' + r.k + ' ' + REG[x.reg].de, false, t.t.replace(' — ', ', ').toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); })) +
      row('Linha da tabela', faixa(t, r.i)) +
      row('Taxa efetiva de retenção', pct(r.efetiva, 1)) +
      '<p class="irs-resumo"><strong>A conta:</strong> ' + conta + '</p>' +
      '<p class="irs-res-t is-sep">Escalão de IRS (por ano)</p>' +
      row('Escalão de IRS', a.isento ? 'Sem IRS a pagar' : (a.i + 1) + '.º escalão', true) +
      row('Taxa do escalão (marginal)', pct(a.taxa, casas(a.taxa))) +
      row('Rendimento bruto anual', eur(a.bruto), false, '14 meses de ' + oque) +
      row('Dedução específica', eur(a.ded)) +
      row('Rendimento coletável', eur(a.col)) +
      row('IRS antes das deduções à coleta', eur(a.isento ? 0 : a.coleta)) +
      row('Taxa média sobre o rendimento coletável', pct(a.isento ? 0 : a.media, 2)) +
      '<p class="irs-resumo">' + resumo + '</p>' +
      '<div class="irs-disc">A retenção segue a fórmula do ' + despacho(x.reg).nome + ' para residentes ' + REG[x.reg].onde + ' e pode diferir em cêntimos do teu recibo. O escalão anual é calculado para um titular, só com este rendimento e sem tributação conjunta' + (x.def ? ', e não conta com os benefícios fiscais das pessoas com deficiência no IRS anual' : '') + '. A dedução específica é o maior valor entre ' + eur(DED_ESP) + ' (8,54 × IAS) e os descontos para a Segurança Social. Os resultados são simulações indicativas e não representam aconselhamento fiscal.</div>' +
      '</div></div></div></div></div>';
  }

  function render() {
    var root = document.getElementById('lf-dp');
    if (!root) return;
    var SUF = '<div class="input-text-position"><div class="text-size-medium"><div class="text-color-placeholder"><div>€</div></div></div></div>';
    var campo = function (id, rot, ctl) { return '<div class="form_field-wrapper"><div class="form-label-info_wrapper"><label for="' + id + '" class="form_label">' + rot + '</label></div>' + ctl + '</div>'; };
    var op = function (v, sel, txt) { return '<option value="' + v + '"' + (String(sel) === String(v) ? ' selected' : '') + '>' + txt + '</option>'; };
    var tabs = GRUPOS.map(function (g) {
      return '<div class="irs-grp"><span class="irs-grp-l">' + g.l + '</span><div class="irs-tabs">' + g.k.map(function (k) {
        return '<button type="button" class="dp-tab' + (S.tab === k ? ' is-active' : '') + '" data-tab="' + k + '">Tabela ' + k + '</button>';
      }).join('') + '</div></div>';
    }).join('');
    var atual = tabela(S.tab, S.reg), temDep = ['I', 'II', 'III', 'V', 'VI', 'VII'].indexOf(S.tab) > -1, pens = atual.tipo === 'H', fa = S.tab === 'X' || S.tab === 'XI';
    var formula = 'Retenção = R × taxa marginal máxima − parcela a abater' + (temDep ? ' − (parcela por dependente × número de dependentes)' : '') + ', em que R é ' + (pens ? 'a pensão mensal bruta' : 'a remuneração mensal bruta') + '. ';
    var nota = pens
      ? ((S.reg !== 'C' || DESP.nome === DESP0) ? 'Nas pensões, por cada dependente a cargo soma-se à parcela a abater 42,86€ (casado, único titular), 21,43€ (casado, dois titulares) ou 34,29€ (não casado).' : 'Nas pensões, a parcela a abater aumenta por cada dependente a cargo, nos valores do despacho.') + (fa ? ' Os deficientes das Forças Armadas têm ainda a parcela adicional da tabela.' : '')
      : (temDep ? 'Com três ou mais dependentes, a taxa marginal máxima baixa um ponto percentual. ' : '') + 'A taxa efetiva no limite é a retenção a dividir pela remuneração no topo de cada linha, sem dependentes.';

    var mudou = REDACAO !== REDACAO0;
    /* Despacho da regiao escolhida */
    var dR = despacho(S.reg), urlR = S.reg === 'C' ? (DESP.url || L.desp) : dR.url, anoR = S.reg === 'C' ? ANO : (/(\d{4})$/.exec(dR.inicio) || [0, ANO])[1];
    var ondeEsta = '<a href="' + urlR + '" target="_blank" rel="noopener">' + dR.nome + ', de ' + dR.data + '</a>' +
      (S.reg === 'M' ? ', da Secretaria Regional das Finanças, com os valores da <a href="' + L.madeiraRet + '" target="_blank" rel="noopener">Declaração de Retificação n.º 10/2026</a>' : '');
    /* Se o continente ja tem despacho novo e a regiao ainda nao foi atualizada aqui, avisa */
    var avisoReg = (S.reg !== 'C' && DESP.nome !== DESP0)
      ? '<div class="irs-aviso"><div><strong>Confirma se há tabelas novas:</strong> as do continente mudaram com o ' + DESP.nome + '. As ' + REG[S.reg].de + ' que vês aqui são as do ' + dR.nome + '. Se já saiu um despacho novo para a região, está na <a href="' + L.tabelasAT + '" target="_blank" rel="noopener">página de tabelas de retenção do Portal das Finanças</a>.</div></div>'
      : '';
    var escReg = S.reg === 'A'
      ? '<p class="irs-p">Nos Açores, os limites dos escalões são os mesmos e as taxas são 30% mais baixas em todos os escalões. É a redução do artigo 4.º do Decreto Legislativo Regional n.º 2/99/A, aplicada às taxas nacionais em vigor.</p>'
      : S.reg === 'M'
        ? '<p class="irs-p">Na Madeira, os limites dos escalões são os mesmos e as taxas são 30% mais baixas em todos os escalões. Estão no <a href="' + L.madeiraEsc + '" target="_blank" rel="noopener">Decreto Legislativo Regional n.º 8/2025/M</a>, o Orçamento da Região para 2026.</p>'
        : '';
    var propReg = S.reg === 'A' ? ' Nos Açores, a redução de 30% incide sobre as taxas nacionais em vigor, por isso as taxas da região descem também se a proposta for aprovada.'
      : S.reg === 'M' ? ' Na Madeira, as taxas estão num diploma da Região e só mudam se esse diploma for alterado.' : '';

    root.innerHTML =
      '<div class="max-width-37-5 dp-lead"><div class="text-color-secondary"><div class="text-size-large"><div class="text-align-center">As tabelas de retenção na fonte e os escalões de IRS em vigor em ' + ANO + ' no continente, nos Açores e na Madeira, com os valores oficiais. Indica o teu salário ou pensão e vê quanto te retêm por mês e em que escalão ficas.</div></div></div></div>' +
      '<div class="dp-meta"><div class="dp-authors">' +
      '<a class="dp-author" href="https://www.literaciafinanceira.pt/autores/franklin-silva"><img class="dp-author-img" src="https://cdn.prod.website-files.com/67922c46c9da6bf5d9bfdf20/683ee0ae5bc67fe0ef48466e_franklin-silva.avif" alt="Franklin Silva"><span><span class="dp-author-l">Autor</span><span class="dp-author-n">Franklin Silva</span></span></a>' +
      '<a class="dp-author" href="https://www.literaciafinanceira.pt/autores/pedro-braz"><img class="dp-author-img" src="https://cdn.prod.website-files.com/67922c46c9da6bf5d9bfdf20/683ee0f9b80a20ec1767fab5_Pedro-Braz.avif" alt="Pedro Braz"><span><span class="dp-author-l">Revisor</span><span class="dp-author-n">Pedro Braz</span></span></a>' +
      '<span class="dp-author dp-author-date"><span class="dp-author-ico">' + ico(CAL) + '</span><span><span class="dp-author-l">Última verificação</span><span class="dp-author-n">' + VERIFICADO + '</span></span></span>' +
      '</div></div>' +

      '<div class="calculadora-content_wrapper irs-calc"><div class="calculadora-form_wrapper"><div class="w-layout-grid grid is-calculadora"><div class="grid-block irs-gb" id="calc-inputs_wrapper">' +
      '<div class="calculator-title_wrapper"><div class="text-size-medium"><div>Calculadora de retenção na fonte e escalão de IRS</div></div><div class="spacer-1"></div><div class="horizontal-line border-secondary"></div></div>' +
      '<form class="form_form" id="calc-tabelas-irs" onsubmit="return false">' +
      campo('irsMes', 'Valor bruto por mês', '<div class="input-text_wrapper"><input id="irsMes" class="form_input is-normal" type="text" inputmode="numeric" autocomplete="off" value="' + milhar(String(Math.round(S.mes))) + '">' + SUF + '</div>') +
      '<div class="irs-ou" aria-hidden="true"><span>ou</span></div>' +
      campo('irsBruto', 'Valor bruto por ano (14 meses)', '<div class="input-text_wrapper"><input id="irsBruto" class="form_input is-normal" type="text" inputmode="numeric" autocomplete="off" value="' + milhar(String(Math.round(S.mes * 14))) + '">' + SUF + '</div>') +
      '<p class="irs-hint">Preenche só um dos dois valores. O outro é calculado por nós.</p><div class="spacer-1-5"></div>' +
      campo('irsTipo', 'Rendimento', '<select class="form_input is-normal irs-select" id="irsTipo">' + op('A', S.tipo, 'Salário') + op('H', S.tipo, 'Pensão') + '</select>') + '<div class="spacer-1-5"></div>' +
      campo('irsReg', 'Região', '<select class="form_input is-normal irs-select" id="irsReg">' + ORDEM.map(function (r) { return op(r, S.reg, REG[r].n); }).join('') + '</select>') + '<div class="spacer-1-5"></div>' +
      campo('irsSit', 'Situação', '<select class="form_input is-normal irs-select" id="irsSit">' + op('nc', S.sit, 'Não casado') + op('c2', S.sit, 'Casado, dois titulares') + op('c1', S.sit, 'Casado, único titular') + '</select>') + '<div class="spacer-1-5"></div>' +
      campo('irsDep', 'Dependentes', '<select class="form_input is-normal irs-select" id="irsDep">' + [0, 1, 2, 3, 4, 5, 6].map(function (d) { return op(d, S.dep, d === 0 ? 'Nenhum' : String(d)); }).join('') + '</select>') + '<div class="spacer-1-5"></div>' +
      '<label class="irs-check"><input type="checkbox" id="irsDef"' + (S.def ? ' checked' : '') + '><span>Tenho deficiência (incapacidade de 60% ou mais)</span></label>' +
      '<div class="spacer-2"></div><a id="calcular" href="#" class="button is-form-submit w-button">Calcular</a>' +
      '</form></div></div></div>' + resultado() + '</div>' +

      '<div class="irs-sec"><h2 class="heading-style-h2 irs-h2">Tabelas de retenção na fonte de IRS ' + ANO + '</h2>' +
      '<p class="irs-p">A retenção na fonte é o IRS que a entidade patronal ou a Segurança Social desconta todos os meses no teu salário ou pensão, por conta do imposto final. O continente, os Açores e a Madeira têm tabelas diferentes: escolhe a tua região. As de ' + anoR + ' ' + REG[S.reg].para + ' estão no ' + ondeEsta + ', e aplicam-se desde ' + dR.inicio.replace(/ de \d{4}$/, '') + '. São 11 em cada região: três para trabalho dependente, quatro para trabalhadores com deficiência e quatro para pensões.</p>' +
      botoesRegiao() + tabs + '<p class="irs-p irs-tab-t"><strong>Tabela ' + atual.k + ' ' + REG[S.reg].de + ':</strong> ' + (pens ? 'pensões, ' : 'trabalho dependente, ') + atual.t.replace(' — ', ', ').toLowerCase() + '.</p>' +
      tabRetencao() +
      '<p class="dp-foot">' + formula + nota + ' ' + exemplo() + ' Para o valor exato do teu salário líquido, usa o <a href="' + L.sal + '">simulador de salário líquido</a>.</p>' +
      avisoReg + '</div>' +

      '<div class="irs-sec"><h2 class="heading-style-h2 irs-h2">Escalões de IRS ' + ANO + '</h2>' +
      (mudou ? '<p class="irs-p">Os escalões aplicam-se ao rendimento coletável de ' + ANO + '. São os do <a href="' + L.art68 + '" target="_blank" rel="noopener">artigo 68.º do Código do IRS</a>, na redação da ' + REDACAO + '.</p>' : '<p class="irs-p">Os escalões aplicam-se ao rendimento coletável de 2026, que declaras em 2027. Foram fixados pelo <a href="' + L.lei + '" target="_blank" rel="noopener">Orçamento do Estado para 2026 (Lei n.º 73-A/2025)</a>, que alterou o <a href="' + L.art68 + '" target="_blank" rel="noopener">artigo 68.º do Código do IRS</a>: os limites subiram 3,51% e as taxas do 2.º ao 5.º escalão desceram 0,3 pontos percentuais.</p>') +
      botoesRegiao() + escReg +
      tabEscaloes(S.res && S.res.reg === S.reg && !S.res.an.isento ? S.res.an.i : -1) +
      '<p class="dp-foot">IRS = rendimento coletável × taxa do escalão − parcela a abater. A parcela a abater é calculada por nós a partir das taxas da lei e dá o mesmo resultado que aplicar cada taxa à sua fatia de rendimento.' + (S.reg === 'C' ? ' Rendimentos coletáveis acima de 80.000€ pagam ainda a taxa adicional de solidariedade (2,5% até 250.000€ e 5% acima).' : '') + '</p>' +
      (mudou ? '' : '<div class="irs-aviso"><div><strong>Pode mudar ainda em 2026:</strong> o Governo entregou no Parlamento, a 21 de setembro de 2026, uma proposta para baixar as taxas nacionais do 1.º ao 6.º escalão (para 12,2%, 15,2%, 20,7%, 23,6%, 30,6% e 34,6%), com efeitos em todo o ano de 2026 e novas tabelas de retenção a partir de novembro. À data da última verificação ainda não era lei.' + propReg + ' <a href="' + L.prop + '" target="_blank" rel="noopener">Fonte: ECO</a>.</div></div>') +
      '<ul class="irs-fontes"><li><a href="' + (DESP.url || L.desp) + '" target="_blank" rel="noopener">' + DESP.nome + ', de ' + DESP.data + '</a>: tabelas de retenção na fonte do continente.</li><li><a href="' + L.circ + '" target="_blank" rel="noopener">Circular n.º 1/2026 da Autoridade Tributária</a>: instruções de aplicação das tabelas.</li>' +
      '<li><a href="' + L.acores + '" target="_blank" rel="noopener">Despacho n.º 1179/2026, de 3 de fevereiro</a> e <a href="' + L.acoresCirc + '" target="_blank" rel="noopener">Circular n.º 3/2026 da Autoridade Tributária</a>: tabelas de retenção na fonte dos Açores.</li>' +
      '<li><a href="' + L.madeira + '" target="_blank" rel="noopener">Despacho n.º 19/2026 da Secretaria Regional das Finanças</a>, <a href="' + L.madeiraRet + '" target="_blank" rel="noopener">Declaração de Retificação n.º 10/2026</a> e <a href="' + L.madeiraCirc + '" target="_blank" rel="noopener">Circular n.º 2/2026 da Autoridade Tributária</a>: tabelas de retenção na fonte da Madeira.</li>' +
      (mudou ? '<li><a href="' + L.art68 + '" target="_blank" rel="noopener">Artigo 68.º do Código do IRS</a> (' + REDACAO + '): escalões de IRS.</li>' : '<li><a href="' + L.lei + '" target="_blank" rel="noopener">Lei n.º 73-A/2025, de 30 de dezembro</a> (Orçamento do Estado para 2026): escalões de IRS.</li>') +
      '<li>Artigo 4.º do Decreto Legislativo Regional n.º 2/99/A: redução de 30% nas taxas de IRS nos Açores.</li>' +
      '<li><a href="' + L.madeiraEsc + '" target="_blank" rel="noopener">Decreto Legislativo Regional n.º 8/2025/M</a> (Orçamento da Madeira para 2026): taxas de IRS na Madeira.</li></ul></div>';
  }

  function num(id) { var el = document.getElementById(id); return el ? parseInt(String(el.value).replace(/\D/g, ''), 10) || 0 : 0; }
  function lerForm() {
    S.mes = Math.min(num('irsMes'), 10000000);
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    S.tipo = g('irsTipo') || 'A'; S.sit = g('irsSit') || 'nc'; S.dep = parseInt(g('irsDep'), 10) || 0;
    var d = document.getElementById('irsDef'); S.def = !!(d && d.checked);
  }
  /* A regiao e uma so para a calculadora, as tabelas de retencao e os escaloes */
  function mudarRegiao(reg) {
    if (!RETS[reg] || reg === S.reg) return;
    S.reg = reg;
    if (S.res) S.res = calcular(S.res.mes, S.res.tipo, S.res.sit, S.res.dep, S.res.def, reg);
    render();
  }
  // Altura do menu fixo/sticky no topo, para o scroll nao deixar o cartao tapado.
  function alturaMenu() {
    var h = 0, xs = [8, window.innerWidth / 2, window.innerWidth - 8];
    for (var i = 0; i < xs.length; i++) {
      var n = document.elementFromPoint(xs[i], 2);
      while (n && n !== document.body && n !== document.documentElement) {
        var pos = getComputedStyle(n).position;
        if (pos === 'fixed' || pos === 'sticky') {
          var b = n.getBoundingClientRect();
          if (b.top <= 2 && b.bottom > h && b.height < window.innerHeight / 2) h = b.bottom;
          break;
        }
        n = n.parentElement;
      }
    }
    return h;
  }
  function rolarPara(el) {
    var off = alturaMenu() + 24;
    // O site usa Lenis: o scroll tem de passar por ele, senao o Lenis desfaz o scrollTo nativo.
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(el, { offset: -off, duration: 1 });
      return;
    }
    var y = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - off;
    try { window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (err) { window.scrollTo(0, Math.max(0, y)); }
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest || !t.closest('#lf-dp')) return;
    var rg = t.closest('[data-reg]');
    if (rg) { lerForm(); mudarRegiao(rg.getAttribute('data-reg')); return; }
    var tab = t.closest('[data-tab]');
    if (tab) { lerForm(); S.tab = tab.getAttribute('data-tab'); render(); return; }
    if (t.closest('#calcular')) {
      e.preventDefault();
      lerForm();
      S.res = calcular(S.mes, S.tipo, S.sit, S.dep, S.def, S.reg);
      S.tab = S.res.ret.k;
      render();
      var r = document.getElementById('irsRes');
      if (r) rolarPara(r);
    }
  });
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'irsReg') return;
    lerForm(); mudarRegiao(e.target.value);
    var el = document.getElementById('irsReg'); if (el && el.focus) el.focus();
  });
  document.addEventListener('input', function (e) {
    var id = e.target && e.target.id;
    if (id !== 'irsBruto' && id !== 'irsMes') return;
    var v = parseInt(String(e.target.value).replace(/\D/g, ''), 10);
    e.target.value = isNaN(v) ? '' : milhar(String(v));
    var outro = document.getElementById(id === 'irsBruto' ? 'irsMes' : 'irsBruto');
    if (outro) outro.value = isNaN(v) ? '' : milhar(String(id === 'irsBruto' ? Math.round(v / 14) : v * 14));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && (e.target.id === 'irsBruto' || e.target.id === 'irsMes')) { var b = document.getElementById('calcular'); if (b) b.click(); }
  });

  function montar() {
    if (!document.getElementById('lf-dp')) {
      var h1 = document.querySelector('h1.heading-style-h2'), div = document.createElement('div');
      div.id = 'lf-dp';
      if (h1 && h1.parentNode) h1.parentNode.appendChild(div); else return;
    }
    render();
    carregar();
  }
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  /* Dados do continente e escaloes nacionais vindos do data/irs.json. As regioes ficam com as tabelas deste ficheiro. */
  function aplicar(d) {
    if (!d || !d.retencao || !d.retencao.tabelas || d.retencao.tabelas.length !== 11 || !d.escaloes || d.escaloes.linhas.length < 5) return false;
    var e = [], m = [], parc = 0, ant = 0, antTaxa = 0;
    d.escaloes.linhas.forEach(function (l, i) {
      if (i) parc += ant * (l[1] - antTaxa) / 100;
      e.push([l[0] === null ? Infinity : l[0], l[1], Math.round(parc * 100) / 100]);
      m.push(l[2] ? l[2] + '%' : '-');
      ant = l[0]; antTaxa = l[1];
    });
    ESC = e; MEDIA = m; RET = d.retencao.tabelas; RETS.C = RET;
    if (d.ias) { IAS = d.ias; DED_ESP = 8.54 * IAS; }
    if (d.min_existencia) MIN_EXIST = d.min_existencia;
    if (d.escaloes.redacao) REDACAO = d.escaloes.redacao;
    DESP = { nome: d.retencao.despacho, data: d.retencao.data_txt, inicio: d.retencao.inicio, url: d.retencao.pdf };
    var a = /(\d{4})$/.exec(d.retencao.inicio || ''); if (a) ANO = a[1];
    var v = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.verificado || '');
    if (v) VERIFICADO = parseInt(v[3], 10) + ' de ' + MESES[parseInt(v[2], 10) - 1] + ' de ' + v[1];
    return true;
  }
  function carregar() {
    var sc = document.querySelector('script[src*="tabelas-irs.js"]'), url = window.__lfIrsDados;
    if (!url && sc) url = sc.src.replace(/tabelas-irs\.js.*$/, 'data/irs.json');
    if (!url || !window.fetch) return;
    fetch(url + '?d=' + new Date().toISOString().slice(0, 10)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (aplicar(d)) { if (S.res) S.res = calcular(S.res.mes, S.res.tipo, S.res.sit, S.res.dep, S.res.def, S.res.reg); render(); }
    }).catch(function () {});
  }
  window.__lfIrsAplicar = aplicar;
  window.__lfIrsCalc = calcular;
  window.__lfIrsTabelas = RETS; /* exposto para testes */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
