const Node = {
  "id": "f4e7ae0689b4183d",
  "type": "function",
  "z": "74de194f4f0868a4",
  "name": "Amount operator ui update",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 485,
  "y": 560,
  "wires": [
    [
      "e0f238aa54304526"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  switch (msg.payload) {
      case "<>":
          msg.payload = {
              groups: {
                  show: ["Ny regel:To beløb"],
                  hide: ["Ny regel:Enkelt beløb"]
              }
          };
          break;
      default:
          msg.payload = {
              groups: {
                  show: ["Ny regel:Enkelt beløb"],
                  hide: ["Ny regel:To beløb"]
              }
          };
  }
  
  return msg;
}

module.exports = Node;