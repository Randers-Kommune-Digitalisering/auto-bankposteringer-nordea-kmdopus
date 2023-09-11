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
  "x": 110,
  "y": 560,
  "wires": [
    [
      "b73eae993793d2e5"
    ]
  ],
  "_order": 34
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let uplacerbare_poster = 0;
  let felter_i_nordea = [
      ["narrative", "end_to_end_reference", "own_message"],
      ["extra_info", "message"],
      ["counterparty_name", "payer_alias"],
      ["type_description"]
  ];
  let omp_headers = [
      "Artskonto",
      "Omkostningssted",
      "PSP-element",
      "Profitcenter",
      "Ordre",
      "Debet/kredit",
      "Beløb",
      "Næste agent",
      "Tekst",
      "Betalingsart",
      "Påligningsår",
      "Betalingsmodtagernr.",
      "Betalingsmodtagernr.kode",
      "Ydelsesmodtagernr.",
      "Ydelsesmodtagernr.kode",
      "Ydelsesperiode fra",
      "Ydelsesperiode til",
      "Oplysningspligtnr.",
      "Oplysningspligtmodtagernr.kode",
      "Oplysningspligtkode",
      "Netværk",
      "Operation",
      "Mængde",
      "Mængdeenhed",
      "Referencenøgle"
  ];
  flow.set("omp_headers", omp_headers.join(', '));
  let omposteringsbilag = [];
  
  for (let postering of global.get("transactions")) {
      let linjer_dannet = 0;
      let rules_checked = 0;
  
      for (let regel_obj of global.get("konteringsregler")) {
          let subRule_checked = 0;
          let matches = 0;
  
          let tjek_beløb;
          if (!regel_obj[4].operator) {
              tjek_beløb = true;
          } else if (!regel_obj[4].value1) {
              tjek_beløb = true;
          } else if (regel_obj[4].operator === '>') {
              tjek_beløb = parseFloat(postering.amount) > parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '<') {
              tjek_beløb = parseFloat(postering.amount) < parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '==') {
              tjek_beløb = parseFloat(postering.amount) === parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '><') {
              tjek_beløb = parseFloat(postering.amount) > parseFloat(regel_obj[4].value1.replace(',', '.')) && parseFloat(postering.amount) < parseFloat(regel_obj[4].value2.replace(',', '.'));
          }
  
          let antal_searchword = regel_obj.filter(obj => obj.value !== null).length;
  
          if (rules_checked > 1 && linjer_dannet > 0) {
              continue
          } else {
  
              for (let i = 0; i < 4; i++) {
                  let searchword = String(regel_obj[i].value).toLowerCase();
  
                  if (searchword && regel_obj[6].active) {
                      let searchfelt = felter_i_nordea[subRule_checked];
                      if (!Array.isArray(searchfelt)) {
                          searchfelt = [searchfelt];
                      }
  
                      for (let alternativer of searchfelt) {
  
                          try {
                              flow.set("tjek_searchword");
                              if (regel_obj[i].operator === '.startsWith') {
                                  flow.set("tjek_searchword", searchword === postering[alternativer]?.slice(0, searchword.length).toLowerCase());
                              } else if (regel_obj[i].operator === '.endsWith') {
                                  flow.set("tjek_searchword", searchword === postering[alternativer]?.slice(-searchword.length).toLowerCase());
                              } else if (regel_obj[i].operator === 'contains') {
                                  flow.set("tjek_searchword", postering.length >= alternativer && searchword in postering[alternativer]?.toLowerCase());
                              } else if (regel_obj[i].operator === '!contains') {
                                  flow.set("tjek_searchword", postering.length >= alternativer && !(searchword in postering[alternativer]?.toLowerCase()));
                              } else if (regel_obj[i].operator === '!null') {
                                  flow.set("tjek_searchword", postering[alternativer]?.toLowerCase() !== null);
                              }
  
                          }
  
                          catch (error) {
                              flow.set("tjek_searchword", false);
                          }
  
                          if (flow.get("tjek_searchword") && tjek_beløb) {
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
                                  try {
                                      try {
                                          tekst = postering.extra_info;
                                      } catch (error) {
                                          tekst = postering.message;
                                      }
                                  } catch (error) {
                                      tekst = postering.narrative;
                                  }
                              } else {
                                  tekst = regel_obj[5].Posteringstekst;
                              }
  
                              if (alternativer in felter_i_nordea[1]) {
                                  if (postering[alternativer].includes('BDP')) {
                                      tekst = postering.extra_info?.slice(postering.extra_info.indexOf('BDP')) + postering.message?.toString();
                                  } else if (postering[alternativer].includes('KSD')) {
                                      tekst = postering.message?.slice(postering.message.indexOf('KSD')) + ', ' + postering.payer_alias;
                                  }
                              }
                              let artskonto = regel_obj[5].Artskonto;
                              let psp = regel_obj[5].PSP;
  
                              flow.set("posteringsdata_til_drift", [artskonto, '', psp, '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                              flow.set("posteringsdata_til_90540000", ['90540000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                          }
                          subRule_checked += 1;
                      }
                  }
              }
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
              rules_checked += 1;
          }
      }
      if (linjer_dannet === 0) {
          uplacerbare_poster += 1;
  
          let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
          let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
          let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
          let tekst = postering.counterparty_name + ' - ' + postering.narrative;
          let artskonto = '95990009';
  
          flow.set("posteringsdata_til_drift", [artskonto, '', '', '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
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