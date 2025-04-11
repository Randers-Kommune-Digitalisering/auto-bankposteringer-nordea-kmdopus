const Node = {
  "id": "ab089e78855915d8",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 660,
  "wires": [
    [
      "7e39e773a866b059"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT originDate FROM runHistory WHERE originDate = "{{global.dates.bookingDate}}"
`

module.exports = Node;