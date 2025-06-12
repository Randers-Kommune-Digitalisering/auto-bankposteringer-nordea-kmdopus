const Node = {
  "id": "91529d306ae205fa",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1200,
  "wires": [
    [
      "3013b5a86278ec86"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT bookingDate
FROM runHistory
WHERE bookingDate = "{{global.dates.bookingDate}}"
`

module.exports = Node;