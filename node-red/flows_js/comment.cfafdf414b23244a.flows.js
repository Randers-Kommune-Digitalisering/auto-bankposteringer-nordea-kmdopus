const Node = {
  "id": "cfafdf414b23244a",
  "type": "comment",
  "z": "b2c910a3562c542e",
  "name": "Info",
  "info": "",
  "x": 690,
  "y": 180,
  "wires": [],
  "_order": 58
}

Node.info = `
Denne node laver miljøvariablen fra forrige node om til et
crypto object i stedet for en string og gemmer som flow-variabel.
Se evt. dokumentation på nettet for crypto.createPrivateKey.
DETTE SKAL LAVES OM.
`

module.exports = Node;