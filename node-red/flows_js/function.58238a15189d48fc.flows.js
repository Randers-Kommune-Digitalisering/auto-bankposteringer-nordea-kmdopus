const Node = {
  "id": "58238a15189d48fc",
  "type": "function",
  "z": "0b526691b09a2646",
  "g": "248b6faf1bd25dc8",
  "name": "add ruleId",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 800,
  "y": 640,
  "wires": [
    [
      "66b81c6ebf307b20"
    ]
  ],
  "_order": 217
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = msg.payload != null ? msg.payload.map((rule, index) => ({ ...rule, 7: { ruleId: index } })) : [];
  msg.payload = rules;
  global.set("konteringsregler", rules);
  return msg;
}

module.exports = Node;