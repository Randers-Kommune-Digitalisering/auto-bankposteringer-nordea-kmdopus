const Node = {
  "id": "38de2cde59dd9675",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "bae1c13f6f716fe4",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 480,
  "wires": [
    [
      "87c0ea611e4394f1"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS transactionsWithNoMatch (
    transactionID NVARCHAR(29) PRIMARY KEY,
    sender NVARCHAR(255) NULL,
    reference NVARCHAR(255) NULL,
    typeDescription NVARCHAR(29) NULL,
    bankAccount NVARCHAR(31),
    amount NVARCHAR(31),
    direction NVARCHAR(8),
    bookingDate NVARCHAR(31),
    account NVARCHAR(8) NULL,
    accountSecondary NVARCHAR(19) NULL,
    accountTertiary NVARCHAR(50) NULL,
    text NVARCHAR(255) NULL,
    cpr NVARCHAR(11) NULL
);
`

module.exports = Node;