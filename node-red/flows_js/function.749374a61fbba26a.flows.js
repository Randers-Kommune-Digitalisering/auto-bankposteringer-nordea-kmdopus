const Node = {
  "id": "749374a61fbba26a",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "46eab8862a269fad",
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
      "dcf695f4a88105de"
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