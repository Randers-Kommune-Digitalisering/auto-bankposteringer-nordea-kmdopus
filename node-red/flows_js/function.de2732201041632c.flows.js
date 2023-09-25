const Node = {
  "id": "de2732201041632c",
  "type": "function",
  "z": "0b526691b09a2646",
  "g": "608c296403fab569",
  "name": "Script",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 610,
  "y": 580,
  "wires": [
    [
      "b73eae993793d2e5"
    ]
  ],
  "_order": 29
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let uplacerbare_poster = 0;
  let felter_i_nordea = ["narrative", "message", "counterparty_name", "type_description"];
  let omp_headers = ["Artskonto", "Omkostningssted", "PSP-element", "Profitcenter", "Ordre", "Debet/kredit", "Beløb", "Næste agent", "Tekst", "Betalingsart", "Påligningsår", "Betalingsmodtagernr.", "Betalingsmodtagernr.kode", "Ydelsesmodtagernr.", "Ydelsesmodtagernr.kode", "Ydelsesperiode fra", "Ydelsesperiode til", "Oplysningspligtnr.", "Oplysningspligtmodtagernr.kode", "Oplysningspligtkode", "Netværk", "Operation", "Mængde", "Mængdeenhed", "Referencenøgle"];
  flow.set("omp_headers", omp_headers.join(', '));
  
  let omposteringsbilag = [];
  
  // For hver transaktion
  for (let postering of global.get("transactions")) {
      let linjer_dannet = 0;
      let regellinjer_tjekket = 0;
  
      // Scope: Tjek alle konteringsregler igennem, regel for regel
      for (let regel_obj of global.get("konteringsregler")) {
          let delregler_tjekket = 0; // tæller til underreglerne, dvs. referenceregel, advisregel, afsenderregel, transaktionstyperegel og beløbregel
          let matches = 0;
  
          // Tjekker om beløbsregel er overholdt
          let match_beloeb;
          if (regel_obj[4].operator === '><') {
              match_beloeb = parseFloat(postering.amount) > parseFloat(regel_obj[4].value1.replace(',', '.')) && (regel_obj[4].value2 !== undefined ? parseFloat(postering.amount) < parseFloat(regel_obj[4].value2.replace(',', '.')) : true);
          } else if (regel_obj[4].operator === '>') {
              match_beloeb = parseFloat(postering.amount) > parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '<') {
              match_beloeb = parseFloat(postering.amount) < parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '==') {
              match_beloeb = parseFloat(postering.amount) === parseFloat(regel_obj[4].value1.replace(',', '.'));
          // Fallback
          } else if (!regel_obj[4].operator) { match_beloeb = true; } else if (!regel_obj[4].value1) { match_beloeb = true; }
  
          // Tæller antallet af udfyldte delregler
          let antal_searchword = regel_obj.slice(0, 4).filter(obj => obj.value !== null).length;
  
          if (regellinjer_tjekket > 1 && linjer_dannet > 0) {
              // console.log("Der er allerede dannet en linje, kigger på næste transaktion")
              continue
          } else {
              // Scope: Tjek alle delreglerne, delregel for delregel
              for (let i = 0; i < felter_i_nordea.length; i++) {
                  let searchword = regel_obj[i].value !== null ? String(regel_obj[i].value).toLowerCase() : null;
  
                  if (searchword !== null && regel_obj[6].active) {
                      // Pointer til delregels tilsvarende parameter i posteringen
                      let pointer_posteringsparameter = felter_i_nordea[delregler_tjekket];
  
                      let match_searchword;                                         
                      if (regel_obj[i].operator === '.startsWith') {
                          match_searchword = searchword === (postering[pointer_posteringsparameter]?.slice(0, searchword.length) ?? '').toLowerCase();
                      } else if (regel_obj[i].operator === '.endsWith') {
                          match_searchword = searchword === (postering[pointer_posteringsparameter]?.slice(-searchword.length) ?? '').toLowerCase();
                      } else if (regel_obj[i].operator === 'contains') {
                          match_searchword = (postering[pointer_posteringsparameter]?.toLowerCase() ?? '').includes(searchword);
                      } else if (regel_obj[i].operator === '!contains') {
                          match_searchword = !(postering[pointer_posteringsparameter]?.toLowerCase() ?? '').includes(searchword);
                      } else if (regel_obj[i].operator === '!null') {
                          match_searchword = (postering[pointer_posteringsparameter]?.toLowerCase() ?? '') !== null;
                      } else {
                          match_searchword = false;
                      }
  
                      if (match_searchword && match_beloeb) {
                          matches += 1;
  
                          let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
                          let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
                          let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
                          
                          let tekst;
                          if (regel_obj[5].Posteringstekst.toLowerCase() === 'tekst fra bank') {
                              tekst = postering.narrative;
                          } else if (regel_obj[5].Posteringstekst.toLowerCase() === 'afsender fra bank') {
                              tekst = postering.counterparty_name;
                          } else if (regel_obj[5].Posteringstekst.toLowerCase() === 'advis fra bank') {
                              try { tekst = postering.message; } catch (error) { tekst = postering.narrative; }
                          } else { tekst = regel_obj[5].Posteringstekst; }
  
                          // Særlige regler for posteringstekst, hvis postering er vedr. BDP eller KSD
                          if (pointer_posteringsparameter === "message") {
                              if (postering[pointer_posteringsparameter]?.includes('BDP')) {
                                  tekst = (postering.extra_info?.slice(postering.extra_info.indexOf('BDP')) || '') + (postering[pointer_posteringsparameter]?.toString() || '');
                              } else if (postering[pointer_posteringsparameter]?.includes('KSD')) {
                                  tekst = (postering[pointer_posteringsparameter]?.slice(postering[pointer_posteringsparameter]?.indexOf('KSD')) || '') + ', ' + (postering.counterparty_name || '');
                              }
                          }
                          // Placeholder til genereret posteringsdata ud fra match
                          flow.set("posteringsdata_til_drift", [regel_obj[5].Artskonto, '', regel_obj[5].PSP, '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                          flow.set("posteringsdata_til_90540000", ['90540000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                      }
                  }
                  delregler_tjekket += 1;
              }
              // Hvis der er udfyldt søgeord i reglen og der er lavet match på dem alle, sættes posteringsdata fra placeholderen ind i outputfilen "omposteringsbilag".
              if (antal_searchword > 0 && antal_searchword === matches) {
                  let output_posteringsdata_til_drift = {};
                  let output_posteringsdata_til_90540000 = {};
  
                  for (let i = 0; i < omp_headers.length; i++) {
                      output_posteringsdata_til_drift[omp_headers[i]] = flow.get("posteringsdata_til_drift")[i];
                      output_posteringsdata_til_90540000[omp_headers[i]] = flow.get("posteringsdata_til_90540000")[i];
                  }
  
                  omposteringsbilag.push(output_posteringsdata_til_drift);
                  omposteringsbilag.push(output_posteringsdata_til_90540000);
                  linjer_dannet += 1;
                  output_posteringsdata_til_drift = {};
                  output_posteringsdata_til_90540000 = {};
  
              }
              regellinjer_tjekket += 1;
          }
      }
  
      // Hvis der ikke findes noget match, smides posteringen over på 95990009
  
      if (linjer_dannet === 0) {
          uplacerbare_poster += 1;
  
          let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
          let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
          let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
          let tekst = postering.counterparty_name + ' - ' + postering.narrative;
  
          flow.set("posteringsdata_til_drift", ['95990009', '', '', '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
          flow.set("posteringsdata_til_90540000", ['90540000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  
          let output_posteringsdata_til_drift = {};
          let output_posteringsdata_til_90540000 = {};
  
          for (let i = 0; i < omp_headers.length; i++) {
              output_posteringsdata_til_drift[omp_headers[i]] = flow.get("posteringsdata_til_drift")[i];
              output_posteringsdata_til_90540000[omp_headers[i]] = flow.get("posteringsdata_til_90540000")[i];
          }
  
          omposteringsbilag.push(output_posteringsdata_til_drift);
          omposteringsbilag.push(output_posteringsdata_til_90540000);
          linjer_dannet += 1;
          output_posteringsdata_til_drift = {};
          output_posteringsdata_til_90540000 = {};
      }
  }
  
  global.set("omposteringsarray", omposteringsbilag);
  console.log("I alt " + uplacerbare_poster + " uplacerbare poster");
  
  flow.set("filename", "/data/output/" + global.get("time_of_origin") + ".csv")
  
  return msg;
}

module.exports = Node;