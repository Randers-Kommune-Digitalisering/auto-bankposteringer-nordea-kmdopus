const Node = {
  "id": "855873d2b3129e50",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "d185a894a0ce7b49",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 920,
  "wires": [
    [
      "173ef15d51807d5d"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS typeDescriptions (
    typeDescriptionName NVARCHAR(255) PRIMARY KEY
);
`

module.exports = Node;