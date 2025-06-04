const Node = {
  "id": "be90c1df160477da",
  "type": "change",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Set vars",
  "rules": [
    {
      "t": "set",
      "p": "runs.originStatusCode",
      "pt": "global",
      "to": "payload[0].statusCode",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 645,
  "y": 900,
  "wires": [
    [
      "265fb2fc1879d7fb"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;