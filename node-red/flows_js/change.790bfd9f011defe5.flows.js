const Node = {
  "id": "790bfd9f011defe5",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f5b0f2cb9d251540",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "(  $transactions := $globalContext(\"transactions\").unmatched[transactionID = $$.uid];  $map($transactions, function($transaction) {    $merge([      $transaction,      {        \"bankAccountName\": ($globalContext(\"masterData\").bankAccounts[bankAccount = $transaction.bankAccount].bankAccountName)[0]      }    ])  }))",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1125,
  "y": 100,
  "wires": [
    [
      "95db53e01eb3a86a"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;