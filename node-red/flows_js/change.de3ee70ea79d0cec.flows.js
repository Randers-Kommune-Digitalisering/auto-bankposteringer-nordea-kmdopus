const Node = {
  "id": "de3ee70ea79d0cec",
  "type": "change",
  "z": "a5944093087bb38c",
  "name": "Set db initial accountingRules",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.accountingRules",
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
  "x": 355,
  "y": 60,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;