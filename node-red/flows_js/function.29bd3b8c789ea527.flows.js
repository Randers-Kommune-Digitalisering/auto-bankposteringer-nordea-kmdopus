const Node = {
  "id": "29bd3b8c789ea527",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "4571d34d4f5bd1cf",
  "name": "Show/hide",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 525,
  "y": 740,
  "wires": [
    [
      "7b5142991310e16a",
      "9a42d5f5779713a7"
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
                  show: ['Ny regel:Posteringstekst']
              }
          };
          break;
      default:
          msg.payload = {
              groups: {
                  hide: ['Ny regel:Posteringstekst']
              }
          };
  }
  
  return msg;
}

module.exports = Node;