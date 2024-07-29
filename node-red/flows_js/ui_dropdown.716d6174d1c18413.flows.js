const Node = {
  "id": "716d6174d1c18413",
  "type": "ui-dropdown",
  "z": "74de194f4f0868a4",
  "g": "4571d34d4f5bd1cf",
  "group": "cf83549c5f01a906",
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
  "x": 510,
  "y": 1220,
  "wires": [
    [
      "f4e7ae0689b4183d"
    ]
  ]
}

module.exports = Node;