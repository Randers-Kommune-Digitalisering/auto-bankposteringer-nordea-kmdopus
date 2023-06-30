const Node = {
  "id": "8ac398a8353d0e9d",
  "type": "function",
  "z": "a1938e80ddbe5950",
  "g": "745ee7cac00b8ea6",
  "name": "Apply rules to transactions",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 220,
  "y": 580,
  "wires": [
    [
      "be0a51d36be4d3e8"
    ]
  ],
  "_order": 66
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
      let rows_tjekket = 0;
  
      for (let regel_row of global.get("konteringsregler")) {
          let regler_tjekket = 0;
          let matches = 0;
  
          let antal_searchword = Object.values(regel_row).slice(0, 4).filter(item => item).length;
  
          let tjek_beløb;
          if (!regel_row.beløb_regel) {
              tjek_beløb = true;
          } else if (regel_row.beløb_regel.toLowerCase() === 'større end') {
              tjek_beløb = parseFloat(postering.amount) > parseFloat(regel_row.Beløb1.replace(',', '.'));
          } else if (regel_row.beløb_regel.toLowerCase() === 'mindre end') {
              tjek_beløb = parseFloat(postering.amount) < parseFloat(regel_row.Beløb1.replace(',', '.'));
          } else if (regel_row.beløb_regel.toLowerCase() === 'lig med') {
              tjek_beløb = parseFloat(postering.amount) === parseFloat(regel_row.Beløb1.replace(',', '.'));
          } else if (regel_row.beløb_regel.toLowerCase() === 'mellem') {
              tjek_beløb = parseFloat(postering.amount) > parseFloat(regel_row.Beløb1.replace(',', '.')) && parseFloat(postering.amount) < parseFloat(regel_row.Beløb2.replace(',', '.'));
          }
  
          if (rows_tjekket > 1 && linjer_dannet > 0) {
              continue
          } else {
              for (let regel_celle of Object.values(regel_row).slice(0, 4)) {
                  let searchword = String(regel_celle).toLowerCase();
  
                  if (searchword && !searchword.startsWith("#")) {
                      let searchfelt = felter_i_nordea[regler_tjekket];
                      if (!Array.isArray(searchfelt)) {
                          searchfelt = [searchfelt];
                      }
  
                      for (let alternativer of searchfelt) {
  
                          try {
                              flow.set("tjek_searchword");
                              if (regel_row.match_regel.toLowerCase() === 'starter med') {
                                  flow.set("tjek_searchword", searchword === postering[alternativer]?.slice(0, searchword.length).toLowerCase());
                              } else if (regel_row.match_regel.toLowerCase() === 'slutter med') {
                                  flow.set("tjek_searchword", searchword === postering[alternativer]?.slice(-searchword.length).toLowerCase());
                              } else if (regel_row.match_regel.toLowerCase() === 'indeholder') {
                                  flow.set("tjek_searchword", postering.length >= alternativer && searchword in postering[alternativer]?.toLowerCase());
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
                              if (regel_row.Posteringstekst.toLowerCase() === 'tekst fra bank') {
                                  tekst = postering.narrative;
                              } else if (regel_row.Posteringstekst.toLowerCase() === 'afsender fra bank') {
                                  tekst = postering.counterparty_name;
                              } else if (regel_row.Posteringstekst.toLowerCase() === 'advis fra bank') {
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
                                  tekst = regel_row.Posteringstekst;
                              }
  
                              if (alternativer in felter_i_nordea[1]) {
                                  if (postering[alternativer].includes('BDP')) {
                                      tekst = postering.extra_info?.slice(postering.extra_info.indexOf('BDP')) + postering.message?.toString();
                                  } else if (postering[alternativer].includes('KSD')) {
                                      tekst = postering.message?.slice(postering.message.indexOf('KSD')) + ', ' + postering.payer_alias;
                                  }
                              }
                              let artskonto = regel_row.Artskonto;
                              let psp = regel_row.PSP;
                              let sio = regel_row.SIO;
  
                              flow.set("posteringsdata_til_drift", [artskonto, '', psp, '', sio, driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                              flow.set("posteringsdata_til_90540000", ['90540000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                          }
                          regler_tjekket += 1;
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
              rows_tjekket += 1;
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
  console.log("ialt " + uplacerbare_poster + "uplacerbare poster");
  
  flow.set("filename", "/data/output/" + global.get("time_of_origin") + ".csv")
  
  return msg;
}

module.exports = Node;