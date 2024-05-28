const Node = {
  "id": "73d7d240a587aa11",
  "type": "subflow",
  "name": "DB Try Connect",
  "info": "",
  "category": "",
  "in": [
    {
      "x": 80,
      "y": 140,
      "wires": [
        {
          "id": "17ac97a92e2a2cd9"
        }
      ]
    }
  ],
  "out": [
    {
      "x": 1140,
      "y": 140,
      "wires": [
        {
          "id": "eabaa0f75e59e9e9",
          "port": 0
        }
      ]
    },
    {
      "x": 990,
      "y": 260,
      "wires": [
        {
          "id": "9ff9b55590eb551b",
          "port": 1
        }
      ]
    }
  ],
  "env": [],
  "meta": {},
  "color": "#3FADB5",
  "outputLabels": [
    "Success",
    "Error"
  ],
  "status": {
    "x": 460,
    "y": 420,
    "wires": [
      {
        "id": "adb714bcd6c341b5",
        "port": 0
      }
    ]
  }
}

module.exports = Node;