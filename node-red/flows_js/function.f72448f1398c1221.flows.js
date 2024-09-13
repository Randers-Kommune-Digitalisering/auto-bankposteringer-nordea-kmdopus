const Node = {
  "id": "f72448f1398c1221",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "1c9d2e5a1088096c",
  "name": "ERP headers",
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
      "e647e7e80e1b8c83"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpSystem = global.get("erpSystem");
  let erpFileHeaders = [];
  
  switch (erpSystem) {
      case "KMD":
          erpFileHeaders = ["Artskonto", "Omkostningssted", "PSP-element", "Profitcenter", "Ordre", "Debet/kredit", "Beløb", "Næste agent", "Tekst", "Betalingsart", "Påligningsår", "Betalingsmodtagernr.", "Betalingsmodtagernr.kode", "Ydelsesmodtagernr.", "Ydelsesmodtagernr.kode", "Ydelsesperiode fra", "Ydelsesperiode til", "Oplysningspligtnr.", "Oplysningspligtmodtagernr.kode", "Oplysningspligtkode", "Netværk", "Operation", "Mængde", "Mængdeenhed", "Referencenøgle"];
          break;
      case "Prisme":
          break;
      default:
          node.error("Unknown ERP-system");
          break;
  }
  
  flow.set("erpFileHeaders", erpFileHeaders.join(', '));    
  
  return msg;
}

module.exports = Node;