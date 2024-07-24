const Node = {
  "id": "527a8d231af47b40",
  "type": "function",
  "z": "74de194f4f0868a4",
  "name": "Amount operator ui update",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1455,
  "y": 160,
  "wires": [
    [
      "db75df9f1002c0e6"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  switch (msg.payload) {
      case "<>":
          msg.payload = {
              groups: {
                  show: ["Rediger regel:To beløb"],
                  hide: ["Rediger regel:Enkelt beløb"]
              }
          };
          break;
      default:
          msg.payload = {
              groups: {
                  show: ["Rediger regel:Enkelt beløb"],
                  hide: ["Rediger regel:To beløb"]
              }
          };
  }
  
  return msg;
}

module.exports = Node;