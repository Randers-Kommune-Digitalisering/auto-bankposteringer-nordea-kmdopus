const Node = {
  "id": "299f5bb6150afa07",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "fafde89af20cbe51",
  "name": "Convert to csv-like structure",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 105,
  "y": 60,
  "wires": [
    [
      "e176ace9d52ca574"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let postings = global.get("erpPostings");
  let erpPostings = [];
  
  for (let posting in postings) {
      erpPostings.push([posting.account, '', posting.psp || '', '', '', posting.debetOrCredit, posting.amount, '', posting.text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  msg.payload = erpPostings;
  msg.columns = flow.get("erpFileHeaders").split(", ");
  msg.filename = "/data/output/" + global.get("simpleDate") + ".csv";
  
  return msg;
}

module.exports = Node;