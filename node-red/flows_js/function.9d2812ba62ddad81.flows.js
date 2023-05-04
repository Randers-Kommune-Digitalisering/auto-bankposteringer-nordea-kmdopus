const Node = {
  "id": "9d2812ba62ddad81",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Set headers in Signature (+ endpoint)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1190,
  "y": 240,
  "wires": [
    []
  ],
  "_order": 25
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const request_target = "https://api.nordeaopenbanking.com/corporate/premium/v4/accounts/DK5036579260-USD/transactions";
  const host = msg.headers['X-Nordea-Originating-Host'];
  const date = msg.headers['X-Nordea-Originating-Date'];
  
  msg.headers.Signature.headers = `${request_target}" "${host}" "${date}`;
  
  return msg;
}

module.exports = Node;