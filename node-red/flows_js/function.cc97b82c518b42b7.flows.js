const Node = {
  "id": "cc97b82c518b42b7",
  "type": "function",
  "z": "88c6307a5ee1dd81",
  "g": "54ef3083f50853f1",
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
      "65984a50da4fd189"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let postings = global.get("erp").postings;
  let formattedPostings = [];
  
  for (let posting of postings) {
      formattedPostings.push([posting.account, '', posting.accountSecondary || '', '', '', posting.debetOrCredit, posting.amount, '', posting.text, '', '', '', '', posting.cpr ? '02' : '', posting.cpr || '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  msg.payload = formattedPostings;
  msg.columns = global.get("configs").erp.csvHeaders;
  msg.filename = "/data/output/" + global.get("dates").bookingDate + ".csv";
  
  return msg;
}

module.exports = Node;