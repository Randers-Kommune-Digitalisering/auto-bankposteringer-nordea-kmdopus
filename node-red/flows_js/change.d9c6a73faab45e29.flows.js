const Node = {
  "id": "d9c6a73faab45e29",
  "type": "change",
  "z": "a5944093087bb38c",
  "name": "Check import",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.isAccountingRulesInFilesystem",
      "pt": "global",
      "to": "false",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 205,
  "y": 60,
  "wires": [
    [
      "7d4d923907a94317"
    ]
  ],
  "l": false
}

module.exports = Node;