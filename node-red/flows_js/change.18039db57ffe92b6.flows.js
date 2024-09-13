const Node = {
  "id": "18039db57ffe92b6",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "6dfe26228ab4f389",
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
  "x": 345,
  "y": 380,
  "wires": [
    [
      "7d4d923907a94317"
    ]
  ],
  "l": false
}

module.exports = Node;