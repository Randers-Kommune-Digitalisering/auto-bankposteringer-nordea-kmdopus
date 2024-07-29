const Node = {
  "id": "98a34165c551b238",
  "type": "ui-form",
  "z": "74de194f4f0868a4",
  "g": "ada765780fa31438",
  "name": "Add account",
  "group": "415c6b338380895b",
  "label": "",
  "order": 2,
  "width": "8",
  "height": "1",
  "options": [
    {
      "label": "Navn",
      "key": "Navn",
      "type": "text",
      "required": true,
      "rows": null
    },
    {
      "label": "IBAN",
      "key": "IBAN",
      "type": "text",
      "required": true,
      "rows": null
    },
    {
      "label": "Statuskonto",
      "key": "Statuskonto",
      "type": "number",
      "required": true,
      "rows": null
    },
    {
      "label": "Mellemregningskonto",
      "key": "Mellemregningskonto",
      "type": "number",
      "required": true,
      "rows": null
    }
  ],
  "formValue": {
    "Navn": "",
    "IBAN": "",
    "Statuskonto": "",
    "Mellemregningskonto": ""
  },
  "payload": "",
  "submit": "Tilføj",
  "cancel": "Annuller",
  "resetOnSubmit": true,
  "topic": "payload",
  "topicType": "msg",
  "splitLayout": true,
  "className": "",
  "x": 370,
  "y": 300,
  "wires": [
    [
      "7f607bfbdd2aae54"
    ]
  ]
}

module.exports = Node;