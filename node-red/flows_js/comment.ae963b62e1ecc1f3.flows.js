const Node = {
  "id": "ae963b62e1ecc1f3",
  "type": "comment",
  "z": "b2c910a3562c542e",
  "name": "Info",
  "info": "",
  "x": 610,
  "y": 240,
  "wires": [],
  "_order": 67
}

Node.info = `
Denne node laver miljøvariablen fra forrige node om til et
crypto object i stedet for en string og gemmer som flow-variabel.
Se evt. dokumentation på nettet for crypto.createPrivateKey.
`

module.exports = Node;