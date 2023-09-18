const Node = {
  "id": "ea85fd717480f10a",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "g": "6ff9877691fd4c6f",
  "name": "Regler til msg",
  "rules": [
    {
      "t": "set",
      "p": "payload.rules",
      "pt": "msg",
      "to": "konteringsregler",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 960,
  "y": 380,
  "wires": [
    [
      "bdf4a944ed661fbe"
    ]
  ],
  "_order": 152
}

module.exports = Node;