const Node = {
  "id": "992cba6f7c21b6c7",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "Integration to ØS?",
  "property": "masterData.admSysData.integrationBool",
  "propertyType": "global",
  "rules": [
    {
      "t": "false"
    },
    {
      "t": "true"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 855,
  "y": 220,
  "wires": [
    [
      "45bdcb5fc64e9543"
    ],
    [
      "7582ec071bb24715"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;