const Node = {
  "id": "ae963b62e1ecc1f3",
  "type": "comment",
  "z": "b2c910a3562c542e",
  "name": "Info",
  "info": "",
  "x": 610,
  "y": 240,
  "wires": [],
  "_order": 59
}

Node.info = `
Denne node krypterer msg.payload med private key som er flow-variabel.
Se evt. dokumentation på nettet for crypto.privateEncrypt.
DETTE SKAL LAVES OM.
`

module.exports = Node;