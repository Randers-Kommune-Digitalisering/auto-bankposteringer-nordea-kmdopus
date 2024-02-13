const Node = {
  "id": "f6dd7ca74ddcc911",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "matching, debitorkonto",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 180,
  "y": 60,
  "wires": [
    [
      "4255d18a1fe6c5d1"
    ]
  ],
  "_order": 229
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let omposteringsbilag = [];
  let omposteringsarray = flow.get("omposteringsarray")
  
  // For hver transaktion
  for (let postering of flow.get("transactions")) {
      let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
      let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
      let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let tekst = postering.counterparty_name + " - " + postering.narrative;
  
      omposteringsbilag.push(['95991009', '', '', '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      omposteringsbilag.push(['90541000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  // Concatenate omposteringsbilag to omposteringsarray
  flow.set("omposteringsarray", omposteringsarray.concat(omposteringsbilag));
  
  flow.set("filename", "/data/output/" + flow.get("time_of_origin") + ".csv")
  
  return msg;
}

module.exports = Node;