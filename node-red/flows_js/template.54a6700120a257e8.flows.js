const Node = {
  "id": "54a6700120a257e8",
  "type": "template",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Byg SQL-tabel til transaktioner uden match",
  "field": "configs.database.transactionsWithNoMatch",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 270,
  "y": 300,
  "wires": [
    [
      "12b79b33b84ebcc0"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

Node.template = `
CREATE TABLE IF NOT EXISTS transactionsWithNoMatch (
    transactionID NVARCHAR(21) NULL PRIMARY KEY,
    counterpartyName NVARCHAR(63) NULL,
    narrative NVARCHAR(255) NULL,
    bankAccount NVARCHAR(31) NULL,
    amount NVARCHAR(31) NULL,
    bookingDate NVARCHAR(31) NULL,
    Artskonto NVARCHAR(8) NULL,
    PSP NVARCHAR(19) NULL,
    Posteringstekst NVARCHAR(255) NULL
);
`

module.exports = Node;