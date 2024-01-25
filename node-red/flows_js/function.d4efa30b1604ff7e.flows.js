const Node = {
  "id": "d4efa30b1604ff7e",
  "type": "function",
  "z": "0b526691b09a2646",
  "g": "a6a44c3ca7a42667",
  "name": "Script",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 350,
  "y": 1280,
  "wires": [
    [
      "f77922ade00c39f4"
    ]
  ],
  "_order": 233
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let debitorposter = [];
  let nomatch_list = [];
  let linjer_dannet = 0;
  
  // For hver transaktion
  for (let postering of global.get("debitorkonto_transactions")) {
  
      let bankdebkred = postering.amount.startsWith('-') ? 'Kredit' : 'Debet';
      let driftdebkred = bankdebkred === 'Debet' ? 'Kredit' : 'Debet';
      let beloeb = postering.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let tekst = postering.narrative + "-" + postering.counterparty_name ? postering.counterparty_name : '';
  
      let output_posteringsdata_til_drift = ['95991009', '', '', '', '', driftdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      let output_posteringsdata_til_90540000 = ['90541000', '', '', '', '', bankdebkred, beloeb, '', tekst, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
  
      debitorposter.push(output_posteringsdata_til_drift);
      debitorposter.push(output_posteringsdata_til_90540000);
      linjer_dannet += 1;
      output_posteringsdata_til_drift = [];
      output_posteringsdata_til_90540000 = [];
  }
  
  global.set("debitorposter", debitorposter);
  console.log("I alt " + linjer_dannet + " poster konteret");
  
  flow.set("filename_debitor", "/data/output/debitor/" + global.get("time_of_origin") + ".csv")
  
  return msg;
}

module.exports = Node;