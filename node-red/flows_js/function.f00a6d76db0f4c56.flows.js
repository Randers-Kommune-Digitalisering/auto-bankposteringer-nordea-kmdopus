const Node = {
  "id": "f00a6d76db0f4c56",
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
  "x": 970,
  "y": 740,
  "wires": [
    [
      "41c24fb7566b040f"
    ]
  ],
  "_order": 204
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let nomatch_list = [];
  let omp_headers = global.get("omp_headers").split(", ");
  
  // For hver transaktion
  for (let postering of global.get("nomatch_transactions")) {
      let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
      let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
      let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let tekst = postering.transaction_id;
  
      let posteringsdata_til_drift = [postering.artskonto, '', postering.psp, '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      let posteringsdata_til_95990009 = ['95990009', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      let output_posteringsdata_til_drift = {};
      let output_posteringsdata_til_95990009 = {};
  
      for (let i = 0; i < omp_headers.length; i++) {
          output_posteringsdata_til_drift[omp_headers[i]] = posteringsdata_til_drift[i];
          output_posteringsdata_til_95990009[omp_headers[i]] = posteringsdata_til_95990009[i];
      }
  
      nomatch_list.push(output_posteringsdata_til_drift);
      nomatch_list.push(output_posteringsdata_til_95990009);
      output_posteringsdata_til_drift = {};       // Måske ikke nødvendig fordi der overskrives?
      output_posteringsdata_til_95990009 = {};    // Måske ikke nødvendig fordi der overskrives?
  }
  
  flow.set("filename_nomatch", "/data/nomatch_output/nomatch_" + global.get("time_of_origin") + ".csv")
  global.set("nomatch_omposteringsarray", nomatch_list)
  
  return msg;
}

module.exports = Node;