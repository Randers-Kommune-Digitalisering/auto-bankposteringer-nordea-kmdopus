const Node = {
  "id": "6a990ac4b4acd1b6",
  "type": "subflow",
  "name": "DB Connect",
  "info": "",
  "category": "",
  "in": [
    {
      "x": 80,
      "y": 100,
      "wires": [
        {
          "id": "eb3264254e84da01"
        }
      ]
    }
  ],
  "out": [
    {
      "x": 1250,
      "y": 100,
      "wires": [
        {
          "id": "651379f63fd851d5",
          "port": 0
        },
        {
          "id": "386522f404a71aca",
          "port": 0
        },
        {
          "id": "a0b0bae84337c4ad",
          "port": 0
        },
        {
          "id": "8891fbaffc9a8f8b",
          "port": 0
        }
      ]
    }
  ],
  "env": [],
  "meta": {},
  "color": "#3FADB5",
  "inputLabels": [
    "Query input"
  ],
  "outputLabels": [
    "Result output"
  ],
  "icon": "node-red/db.svg",
  "status": {
    "x": 1260,
    "y": 260,
    "wires": [
      {
        "id": "a0b0bae84337c4ad",
        "port": 0
      },
      {
        "id": "e5ecf125f5e51a6a",
        "port": 0
      }
    ]
  }
}

module.exports = Node;