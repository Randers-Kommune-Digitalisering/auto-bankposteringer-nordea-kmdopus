const Node = {
  "id": "749374a61fbba26a",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "46eab8862a269fad",
  "name": "headers - KMD Opus",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 755,
  "y": 80,
  "wires": [
    [
      "dcf695f4a88105de"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpFileHeaders = ["Artskonto", "Omkostningssted", "PSP-element", "Profitcenter", "Ordre", "Debet/kredit", "Beløb", "Næste agent", "Tekst", "Betalingsart", "Påligningsår", "Betalingsmodtagernr.", "Betalingsmodtagernr.kode", "Ydelsesmodtagernr.", "Ydelsesmodtagernr.kode", "Ydelsesperiode fra", "Ydelsesperiode til", "Oplysningspligtnr.", "Oplysningspligtmodtagernr.kode", "Oplysningspligtkode", "Netværk", "Operation", "Mængde", "Mængdeenhed", "Referencenøgle"];
  flow.set("erp_file_headers", erpFileHeaders.join(', '));
  
  return msg;
}

module.exports = Node;