const Node = {
  "id": "039ddf8e95de0a11",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 790,
  "y": 200,
  "wires": [
    [
      "253d621bf23f1aaf"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
CREATE TABLE IF NOT EXISTS runHistory (
    uid NVARCHAR(32) PRIMARY KEY,
    originDate DATE,
    statusCode INT,
    ts timestamp
)
`

module.exports = Node;