const Node = {
  "id": "a5944093087bb38c",
  "type": "subflow",
  "name": "Set initial accountingRules",
  "info": "",
  "category": "",
  "in": [
    {
      "x": 40,
      "y": 60,
      "wires": [
        {
          "id": "4d849b4e859d6cc5"
        }
      ]
    }
  ],
  "out": [
    {
      "x": 470,
      "y": 20,
      "wires": [
        {
          "id": "3822931a2b22181a",
          "port": 0
        },
        {
          "id": "de3ee70ea79d0cec",
          "port": 0
        }
      ]
    },
    {
      "x": 460,
      "y": 80,
      "wires": [
        {
          "id": "7d4d923907a94317",
          "port": 1
        }
      ]
    }
  ],
  "env": [],
  "meta": {},
  "color": "#DDAA99",
  "outputLabels": [
    "import succes",
    "import error"
  ],
  "icon": "font-awesome/fa-cog",
  "status": {
    "x": 460,
    "y": 140,
    "wires": [
      {
        "id": "5701743d5d14d997",
        "port": 0
      }
    ]
  }
}

module.exports = Node;