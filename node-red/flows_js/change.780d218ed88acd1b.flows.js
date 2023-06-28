const Node = {
  "id": "780d218ed88acd1b",
  "type": "change",
  "z": "0bc16db685bd2e6a",
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
      "3641e43ccd705cfd"
    ]
  ],
  "l": false,
  "_order": 110
}

module.exports = Node;