const Node = {
  "id": "54aba7209ae8b428",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "704dc03174bd43e2",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 240,
  "wires": [
    [
      "9177bdbf7796f59d"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS transactionsWithNoMatch (
    transactionID NVARCHAR(29) NULL PRIMARY KEY,
    sender NVARCHAR(255) NULL,
    reference NVARCHAR(255) NULL,
    typeDescription NVARCHAR(29) NULL,
    bankAccount NVARCHAR(31) NULL,
    amount NVARCHAR(31) NULL,
    bookingDate NVARCHAR(31) NULL,
    account NVARCHAR(8) NULL,
    accountSecondary NVARCHAR(19) NULL,
    text NVARCHAR(255) NULL,
    cpr NVARCHAR(11) NULL
);
`

module.exports = Node;