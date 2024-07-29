const Node = {
  "id": "8ff37393e8f2ac8a",
  "type": "ui-dropdown",
  "z": "74de194f4f0868a4",
  "g": "35de195cfdfd282b",
  "group": "ccd83ed4e18a6ffd",
  "name": "Beløbsregel",
  "label": "Beløb",
  "tooltip": "",
  "order": 6,
  "width": "2",
  "height": "1",
  "passthru": false,
  "multiple": false,
  "chips": false,
  "clearable": true,
  "options": [
    {
      "label": "Lig med",
      "value": "==",
      "type": "str"
    },
    {
      "label": "Mindre end",
      "value": "<",
      "type": "str"
    },
    {
      "label": "Større end",
      "value": ">",
      "type": "str"
    },
    {
      "label": "Mellem",
      "value": "<>",
      "type": "str"
    }
  ],
  "payload": "",
  "topic": "Operator",
  "topicType": "str",
  "className": "",
  "x": 530,
  "y": 1720,
  "wires": [
    [
      "cfdc157dcc1b4c3e"
    ]
  ]
}

module.exports = Node;