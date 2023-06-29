const Node = {
  "id": "f9f8ecbb51b5ad2c",
  "type": "change",
  "z": "9f235917ac3d8025",
  "name": "Clean response JSON object",
  "rules": [
    {
      "t": "set",
      "p": "payload.decryptedData",
      "pt": "msg",
      "to": "$keys(payload.decryptedData) = \"object\" ?\tpayload.decryptedData.object : payload.decryptedData",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 765,
  "y": 520,
  "wires": [
    [
      "78e67c5d9b14d37c"
    ]
  ],
  "l": false,
  "_order": 105
}

module.exports = Node;