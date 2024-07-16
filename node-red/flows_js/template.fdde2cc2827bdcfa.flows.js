const Node = {
  "id": "fdde2cc2827bdcfa",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 830,
  "y": 80,
  "wires": [
    [
      "cec013e5592b6995"
    ]
  ]
}

Node.template = `
CREATE TABLE IF NOT EXISTS konteringsregler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data NVARCHAR(4000)
)
`

module.exports = Node;