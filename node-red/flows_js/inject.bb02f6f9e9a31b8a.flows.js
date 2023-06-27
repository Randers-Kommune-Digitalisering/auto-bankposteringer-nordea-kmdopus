const Node = {
  "id": "bb02f6f9e9a31b8a",
  "type": "inject",
  "z": "aff40520a8419466",
  "name": "eksempel",
  "props": [
    {
      "p": "payload"
    }
  ],
  "repeat": "",
  "crontab": "",
  "once": false,
  "onceDelay": 0.1,
  "topic": "",
  "payload": "{\"group_header\":{\"message_identification\":\"d005e48b6e32b4207b0079a7dd3f5fe8\",\"creation_date_time\":\"2023-04-24T12:25:44.238021Z\",\"http_code\":200},\"response\":{\"transactions\":[{\"currency\":\"USD\",\"narrative\":\" Adv.ref. 17000088824215\",\"status\":\"billed\",\"message\":\"Faktura 1234\",\"amount\":\"-11.01\",\"transaction_id\":\"2021111414389277\",\"booking_date\":\"2021-11-14\",\"value_date\":\"2021-11-14\",\"type_description\":\"Udenl. Betaling\",\"transaction_date\":\"2021-11-14\",\"payment_date\":\"2021-11-14\",\"original_currency\":\"EUR\",\"original_currency_amount\":\"10.00\",\"currency_rate\":\"1.10\",\"balance_after_transaction\":\"1015203.44\"},{\"currency\":\"DKK\",\"narrative\":\"Måske advisfelt\",\"status\":\"billed\",\"message\":\"Sikkert referencefelt\",\"amount\":\"1000\",\"transaction_id\":\"2021111414389278\",\"booking_date\":\"2021-11-30\",\"value_date\":\"2021-11-30\",\"type_description\":\"Overførsel\",\"transaction_date\":\"2021-11-30\",\"payment_date\":\"2021-11-30\",\"balance_after_transaction\":\"1016203.44\"}],\"_links\":[{\"rel\":\"self\",\"href\":\"/premium/v3/accounts/DK5036579260-USD/transactions?from_date=2021-11-14&to_date=2021-11-14\"}]}}",
  "payloadType": "json",
  "x": 100,
  "y": 40,
  "wires": [
    [
      "3c17f3fa9efa7838"
    ]
  ],
  "_order": 103
}

module.exports = Node;