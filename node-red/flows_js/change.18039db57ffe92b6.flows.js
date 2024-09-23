const Node = {
  "id": "18039db57ffe92b6",
  "type": "change",
  "z": "a5944093087bb38c",
  "name": "Check import",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.isAccountingRulesInFilesystem",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 205,
  "y": 100,
  "wires": [
    [
      "7d4d923907a94317"
    ]
  ],
  "l": false
}

module.exports = Node;