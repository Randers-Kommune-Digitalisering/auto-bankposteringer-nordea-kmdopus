const Node = {
  "id": "039ddf8e95de0a11",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "c6445a5238f0bf3b",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 105,
  "y": 680,
  "wires": [
    [
      "eaa69e0779a92d47"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS runHistory (
    uid NVARCHAR(32) PRIMARY KEY,
    dato DATE,
    statusCode INT,
    ts timestamp
)
`

module.exports = Node;