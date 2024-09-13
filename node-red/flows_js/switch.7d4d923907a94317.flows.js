const Node = {
  "id": "7d4d923907a94317",
  "type": "switch",
  "z": "431f85f122b4636d",
  "g": "6dfe26228ab4f389",
  "name": "Is accountingRules in filesystem?",
  "property": "configs.initialData.isAccountingRulesInFilesystem",
  "propertyType": "global",
  "rules": [
    {
      "t": "true"
    },
    {
      "t": "false"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 395,
  "y": 360,
  "wires": [
    [
      "7a58d9ede83407ed"
    ],
    [
      "1645c492e5ff8eb0",
      "7258c49b7ac43cce"
    ]
  ],
  "l": false
}

module.exports = Node;