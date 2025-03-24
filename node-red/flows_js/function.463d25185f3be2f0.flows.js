const Node = {
  "id": "463d25185f3be2f0",
  "type": "function",
  "z": "62eaf4407ee85a3a",
  "g": "85a5e54522cd21cc",
  "name": "set global vars",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "dayjs",
      "module": "dayjs"
    }
  ],
  "x": 755,
  "y": 400,
  "wires": [
    [
      "c6058b99801376b0"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false,
  "info": ""
}

Node.info = `
Format: ISO 8601
`

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  let transactions = global.get("transactions");
  
  transactions.list = [];
  
  global.set("transactions", transactions)
  
  return msg;
}

module.exports = Node;