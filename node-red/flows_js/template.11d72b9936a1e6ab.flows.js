const Node = {
  "id": "11d72b9936a1e6ab",
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
  "y": 1280,
  "wires": [
    [
      "feb7aa2035ee8942"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT bookingDate, statusCode FROM runHistory WHERE bookingDate = "{{global.dates.bookingDate}}"
`

module.exports = Node;