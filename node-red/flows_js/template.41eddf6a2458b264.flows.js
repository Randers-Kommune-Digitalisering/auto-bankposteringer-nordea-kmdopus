const Node = {
  "id": "41eddf6a2458b264",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1120,
  "wires": [
    [
      "18be8dd5b4afccb1"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS runHistory (
    uid NVARCHAR(32) NULL,
    bookingDate NVARCHAR(31) PRIMARY KEY,
    statusCode NVARCHAR(3) NULL,
    ts timestamp
);
`

module.exports = Node;