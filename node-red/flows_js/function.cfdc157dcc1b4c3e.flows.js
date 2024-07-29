const Node = {
  "id": "cfdc157dcc1b4c3e",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "35de195cfdfd282b",
  "name": "Amount operator ui update",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 635,
  "y": 1720,
  "wires": [
    [
      "24fc62ac931cc142"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  switch (msg.payload) {
      case "<>":
          msg.payload = {
              groups: {
                  show: ["Ny undtagelse:To beløb"],
                  hide: ["Ny undtagelse:Enkelt beløb"]
              }
          };
          break;
      default:
          msg.payload = {
              groups: {
                  show: ["Ny undtagelse:Enkelt beløb"],
                  hide: ["Ny undtagelse:To beløb"]
              }
          };
  }
  
  return msg;
}

module.exports = Node;