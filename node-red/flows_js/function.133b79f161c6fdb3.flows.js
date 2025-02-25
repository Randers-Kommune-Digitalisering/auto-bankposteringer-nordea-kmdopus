const Node = {
  "id": "133b79f161c6fdb3",
  "type": "function",
  "z": "2d5de3ec9a4f11b6",
  "g": "1e0e1f57083661ef",
  "name": "Script",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 970,
  "y": 60,
  "wires": [
    [
      "e6ed46604a7faeeb"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let nomatch_list = [];
  let omp_headers = global.get("omp_headers").split(", ");
  
  // For hver transaktion
  for (let postering of flow.get("nomatch_transactions")) {
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
  
  flow.set("filename_nomatch", "/data/nomatch_output/nomatch_" + flow.get("time_of_origin") + ".csv")
  flow.set("nomatch_omposteringsarray", nomatch_list)
  
  return msg;
}

module.exports = Node;