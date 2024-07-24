const Node = {
  "id": "c982eb31acfc5fe6",
  "type": "ui-dropdown",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "group": "f38ded3967196d04",
  "name": "Beløbsregel",
  "label": "Beløb",
  "tooltip": "",
  "order": 5,
  "width": "2",
  "height": "1",
  "passthru": true,
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
  "x": 1230,
  "y": 140,
  "wires": [
    [
      "527a8d231af47b40"
    ]
  ]
}

module.exports = Node;