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