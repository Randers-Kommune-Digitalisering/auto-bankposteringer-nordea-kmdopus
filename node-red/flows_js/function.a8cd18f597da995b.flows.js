const Node = {
  "id": "a8cd18f597da995b",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Show/hide",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1695,
  "y": 280,
  "wires": [
    [
      "4d9f63a26f27e408",
      "436d2b3faa5edb0e"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  flow.set("Posteringstekst_variation", null);
  
  switch (msg.payload) {
      case 0:
          flow.set("Posteringstekst_variation", "Reference fra bank");
          break;
      case 1:
          flow.set("Posteringstekst_variation", "Afsender fra bank");
          break;
      case 2:
          flow.set("Posteringstekst_variation", "Advis fra bank");
          break;
  }
  
  switch (msg.payload) {
      case 3:
          msg.payload = {
              groups: {
                  show: ['Rediger regel:Posteringstekst']
              }
          };
          break;
      default:
          msg.payload = {
              groups: {
                  hide: ['Rediger regel:Posteringstekst']
              }
          };
  }
  
  return msg;
}

module.exports = Node;