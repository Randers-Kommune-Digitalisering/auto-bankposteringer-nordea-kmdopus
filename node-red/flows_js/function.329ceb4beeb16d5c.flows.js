const Node = {
  "id": "329ceb4beeb16d5c",
  "type": "function",
  "z": "b4ac8ea3a77a9132",
  "g": "25ef659717eb2e31",
  "name": "Tilføj ruleId",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 330,
  "y": 120,
  "wires": [
    [
      "6a32e693078a19ae"
    ]
  ],
  "_order": 143
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = msg.payload != null ? msg.payload.map((rule, index) => ({ ...rule, 7: { ruleId: index } })) : [];
  msg.payload = rules;
  return msg;
}

module.exports = Node;