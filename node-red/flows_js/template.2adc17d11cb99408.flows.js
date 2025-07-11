const Node = {
  "id": "2adc17d11cb99408",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Update",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1160,
  "wires": [
    [
      "87aa8f1a5f50958e"
    ]
  ],
  "icon": "font-awesome/fa-pencil",
  "l": false
}

Node.template = `
UPDATE runHistory 
SET 
  statusCode = "{{statusCode}}", 
  uid = "{{uid}}"
WHERE 
  bookingDate = "{{global.dates.bookingDate}}"
`

module.exports = Node;