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
  "x": 555,
  "y": 380,
  "wires": [
    [
      "79c15c0ace4301df"
    ],
    [
      "7582ec071bb24715"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;