const Node = {
  "id": "7b1a3d084db1807c",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "name": "Testregler til global konteringsregler",
  "rules": [
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 360,
  "y": 500,
  "wires": [
    []
  ],
  "_order": 114
}

module.exports = Node;