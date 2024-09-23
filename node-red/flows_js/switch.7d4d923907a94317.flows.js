const Node = {
  "id": "7d4d923907a94317",
  "type": "switch",
  "z": "a5944093087bb38c",
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
  "x": 255,
  "y": 80,
  "wires": [
    [
      "7a58d9ede83407ed"
    ],
    [
      "7258c49b7ac43cce"
    ]
  ],
  "l": false
}

module.exports = Node;