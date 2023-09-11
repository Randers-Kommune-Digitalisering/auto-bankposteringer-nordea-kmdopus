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
  "_order": 30
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let uplacerbare_poster = 0;
  let felter_i_nordea = [
      ["narrative"],
      ["message"],
      ["counterparty_name"],
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
  
  // For hver transaktion
  for (let postering of global.get("transactions")) {
      let linjer_dannet = 0;
      let rules_checked = 0;
  
      // Opsplit hver regel i hhv. referenceregel, advisregel, afsenderregel, transaktionstyperegel, beløbregel, kontering og aktivstatus
      for (let regel_obj of global.get("konteringsregler")) {
          let subRule_checked = 0; // tæller til underreglerne, dvs. referenceregel, advisregel, afsenderregel, transaktionstyperegel og beløbregel
          let matches = 0;
  
          // beløbregel tjekkes inden de resterende regler
          let tjek_beløb;
          if (!regel_obj[4].operator) {
              // hvis ikke der er sat beløbregel op, anses det som et automatisk match på beløbet
              tjek_beløb = true;
          } else if (!regel_obj[4].value1) {
              // det samme gør sig gældende hvis der er ikke er angivet et beløb at matche ud fra
              tjek_beløb = true;
          } else if (regel_obj[4].operator === '>') {
              tjek_beløb = parseFloat(postering.amount) > parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '<') {
              tjek_beløb = parseFloat(postering.amount) < parseFloat(regel_obj[4].value1.replace(',', '.'));
          } else if (regel_obj[4].operator === '==') {
              tjek_beløb = parseFloat(postering.amount) === parseFloat(regel_obj[4].value1.replace(',', '.'));
              // Mellem 2 beløb.
          } else if (regel_obj[4].operator === '><') {
              // Hvis beløb 2 ikke er anført, men beløbet er større end beløb 1, anses det som et automatisk match på beløbet
              tjek_beløb = parseFloat(postering.amount) > parseFloat(regel_obj[4].value1.replace(',', '.')) && (regel_obj[4].value2 !== undefined ? parseFloat(postering.amount) < parseFloat(regel_obj[4].value2.replace(',', '.')) : true);
          }
  
          let antal_searchword = regel_obj.slice(0, 4).filter(obj => obj.value !== null).length;
  
          // Når mere end 1 regel er tjekket og der allerede er dannet en konteringslinje (både debit og kredit), så tjekkes der ikke yderligere. Dette skal laves om i næste version, så der tages højde for flere mulige matches.
          if (rules_checked > 1 && linjer_dannet > 0) {
              continue
          } else {
              // Tæller svarer til antallet af parametre fra transaktionsdata, der kigges på. Svarer til reference, advis, afsender og transaktionstype.
              for (let i = 0; i < 4; i++) {
                  // Søgeordet for delreglen gemmes og formateres
                  let searchword = String(regel_obj[i].value).toLowerCase();
  
                  // Hvis der findes et søgeord for delreglen, og reglen overordnet set er aktiv
                  if (searchword && regel_obj[6].active) {
                      // searchfelt peger på det parameter i transaktionsdata der skal matches på
                      let searchfelt = felter_i_nordea[subRule_checked];
  
                      // tjek_searchword tjekker om søgeordet matcher med det valgte posteringsparameter ud fra de forskellige matchregler; "starter med", "slutter med", "indeholder", "indeholder ikke" og "er oplyst". 
                      flow.set("tjek_searchword");
                      if (regel_obj[i].operator === '.startsWith') {
                          flow.set("tjek_searchword", searchword === postering.searchfelt?.slice(0, searchword.length).toLowerCase());
                      } else if (regel_obj[i].operator === '.endsWith') {
                          flow.set("tjek_searchword", searchword === postering.searchfelt?.slice(-searchword.length).toLowerCase());
                      } else if (regel_obj[i].operator === 'contains') {
                          flow.set("tjek_searchword", postering.length >= searchfelt && searchword in postering.searchfelt?.toLowerCase());
                      } else if (regel_obj[i].operator === '!contains') {
                          flow.set("tjek_searchword", postering.length >= searchfelt && !(searchword in postering.searchfelt?.toLowerCase()));
                      } else if (regel_obj[i].operator === '!null') {
                          flow.set("tjek_searchword", postering.searchfelt?.toLowerCase() !== null);
                      } else { flow.set("tjek_searchword", false); }
  
                      // Hvis der er fundet match på posteringsparameteret og beløbet overholder beløbsreglen
                      if (flow.get("tjek_searchword") && tjek_beløb) {
                          matches += 1;
  
                          let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
                          let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
                          let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
                          let tekst;
  
                          if (regel_obj[5].Posteringstekst.toLowerCase() === 'tekst fra bank') {
                              tekst = postering.narrative;
                          } else if (regel_obj[5].Posteringstekst.toLowerCase() === 'afsender fra bank') {
                              // Det her skal ses på når der er afsenderdata fra API'et
                              tekst = postering.counterparty_name;
                          } else if (regel_obj[5].Posteringstekst.toLowerCase() === 'advis fra bank') {
                              // Hvis der ikke findes advistekst, tages referenceteksten
                              try { tekst = postering.message; } catch (error) { tekst = postering.narrative; }
                          } else { tekst = regel_obj[5].Posteringstekst; }
  
                          // Særlige regler for posteringstekst, hvis postering er vedr. BDP eller KSD
                          if (searchfelt = "message") {
                              if (postering.searchfelt.includes('BDP')) {
                                  tekst = postering.extra_info?.slice(postering.extra_info.indexOf('BDP')) + postering.message?.toString();
                              } else if (postering.searchfelt.includes('KSD')) {
                                  // Det her skal ses på når der er afsenderdata fra API'et
                                  tekst = postering.message?.slice(postering.message.indexOf('KSD')) + ', ' + postering.counterparty_name;
                              }
                          }
                          // Placeholder til genereret posteringsdata ud fra match
                          flow.set("posteringsdata_til_drift", [regel_obj[5].Artskonto, '', regel_obj[5].PSP, '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                          flow.set("posteringsdata_til_90540000", ['90540000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                      }
                  }
                  subRule_checked += 1;
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
              rules_checked += 1;
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
  
  // Omposteringsbilaget findes kun i denne node indtil nu, så det gemmes i en global variabel. 
  global.set("omposteringsarray", omposteringsbilag);
  // Fortæller konsollen hvor mange poster der lægges over på 95990009
  console.log("I alt " + uplacerbare_poster + " uplacerbare poster");
  
  flow.set("filename", "/data/output/" + global.get("time_of_origin") + ".csv")
  
  return msg;
}

module.exports = Node;