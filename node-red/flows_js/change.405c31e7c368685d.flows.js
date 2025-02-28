const Node = {
  "id": "405c31e7c368685d",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "85a5e54522cd21cc",
  "name": "sample transactions",
  "rules": [
    {
      "t": "set",
      "p": "transactions.add",
      "pt": "global",
      "to": "[{\"currency\":\"DKK\",\"narrative\":\"Cap NKS-KY\",\"status\":\"billed\",\"amount\":\"-1639.65\",\"transaction_id\":\"H59087649880000864980\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"CAP\",\"counterparty_account\":\"9036970984\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110300801.53\"},{\"currency\":\"DKK\",\"narrative\":\"Bgs Ydelseskontor 121271           -\",\"message\":\"Ydelseskontor 121271\",\"status\":\"billed\",\"amount\":\"2100.00\",\"transaction_id\":\"H59087649880000864979\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"BGS\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110299161.88\"},{\"currency\":\"DKK\",\"narrative\":\"Cap Sygedagpenge\",\"status\":\"billed\",\"amount\":\"-1996.00\",\"transaction_id\":\"H59087649880000864978\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"CAP\",\"counterparty_account\":\"0008513562\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110301261.88\"},{\"currency\":\"DKK\",\"narrative\":\"Gebyr udland 3404309049GEB   NCHG\",\"status\":\"billed\",\"amount\":\"-4.00\",\"transaction_id\":\"H59087649880000864977\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"GEBYR UDLAND\",\"counterparty_account\":\"0\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110299265.88\"},{\"currency\":\"DKK\",\"narrative\":\"Udenl. overf. 3404309049      NTRF\",\"message\":\"10692647\",\"status\":\"billed\",\"amount\":\"-547.41\",\"transaction_id\":\"H59087649880000864976\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"UDENLANDSK OVERFØRSEL\",\"counterparty_account\":\"NL38ABNA0495139092\",\"transaction_date\":\"2024-02-12\",\"payment_date\":\"2024-02-12\",\"original_currency\":\"EUR\",\"original_currency_amount\":\"73.21\",\"currency_rate\":\"747.731400\",\"balance_after_transaction\":\"-110299261.88\"},{\"currency\":\"DKK\",\"narrative\":\"Gebyr udland 3404309037GEB   NCHG\",\"status\":\"billed\",\"amount\":\"-4.00\",\"transaction_id\":\"H59087649880000864975\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"GEBYR UDLAND\",\"counterparty_account\":\"0\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110298714.47\"},{\"currency\":\"DKK\",\"narrative\":\"Udenl. overf. 3404309037      NTRF\",\"message\":\"10692648\",\"status\":\"billed\",\"amount\":\"-696.66\",\"transaction_id\":\"H59087649880000864974\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"UDENLANDSK OVERFØRSEL\",\"counterparty_account\":\"NL38ABNA0495139092\",\"transaction_date\":\"2024-02-12\",\"payment_date\":\"2024-02-12\",\"original_currency\":\"EUR\",\"original_currency_amount\":\"93.17\",\"currency_rate\":\"747.731400\",\"balance_after_transaction\":\"-110298710.47\"},{\"currency\":\"DKK\",\"narrative\":\"Cap NKS-KY\",\"status\":\"billed\",\"amount\":\"-8398.23\",\"transaction_id\":\"H59087649880000864973\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"CAP\",\"counterparty_account\":\"0001080222\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110298013.81\"},{\"currency\":\"DKK\",\"narrative\":\"Bgs møbler klub 85\",\"message\":\"                    møbler indkøbt til klublokalerne\",\"status\":\"billed\",\"amount\":\"-6720.00\",\"transaction_id\":\"H59087649880000864972\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"BGS\",\"own_message\":\"møbler klub 85\",\"counterparty_account\":\"0000728691\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110289615.58\"},{\"currency\":\"DKK\",\"narrative\":\"NKS-KY\",\"status\":\"billed\",\"amount\":\"-17212.23\",\"transaction_id\":\"H59087649880000864971\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"CAP\",\"counterparty_account\":\"0\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110282895.58\"},{\"currency\":\"DKK\",\"narrative\":\"Cap NKS-KY\",\"status\":\"billed\",\"amount\":\"-2155.88\",\"transaction_id\":\"H59087649880000864970\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"CAP\",\"counterparty_account\":\"4710677980\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110265683.35\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 11.02 5247969 691484\",\"status\":\"billed\",\"amount\":\"189.00\",\"transaction_id\":\"H59087649880000864969\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110263527.47\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 10.02 5247969 691483\",\"status\":\"billed\",\"amount\":\"30.00\",\"transaction_id\":\"H59087649880000864968\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110263716.47\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 11.02 4922735 208904\",\"status\":\"billed\",\"amount\":\"120.00\",\"transaction_id\":\"H59087649880000864967\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110263746.47\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 10.02 4922735 208904\",\"status\":\"billed\",\"amount\":\"179.00\",\"transaction_id\":\"H59087649880000864966\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110263866.47\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 10.02 4922735 208608\",\"status\":\"billed\",\"amount\":\"826.00\",\"transaction_id\":\"H59087649880000864965\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110264045.47\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 11.02 4922735 208535\",\"status\":\"billed\",\"amount\":\"120.00\",\"transaction_id\":\"H59087649880000864964\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110264871.47\"},{\"currency\":\"DKK\",\"narrative\":\"Dankort-salg 10.02 4922735 208535\",\"status\":\"billed\",\"amount\":\"942.00\",\"transaction_id\":\"H59087649880000864963\",\"booking_date\":\"2024-02-12\",\"value_date\":\"2024-02-12\",\"type_description\":\"DANKORT-SALG\",\"transaction_date\":\"2024-02-12\",\"balance_after_transaction\":\"-110264991.47\"}]",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "transactions.accountStep",
      "pt": "global",
      "to": "1",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "statusCode",
      "pt": "msg",
      "to": "200",
      "tot": "num"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1085,
  "y": 400,
  "wires": [
    [
      "53b00b686c170d67"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;