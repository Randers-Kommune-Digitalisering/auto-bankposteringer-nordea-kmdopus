const Node = {
  "id": "5f9e38222a832d18",
  "type": "function",
  "z": "8c354b8d2ca56b7b",
  "g": "5259773178769a53",
  "name": "set global dates",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "dayjs",
      "module": "dayjs"
    }
  ],
  "x": 105,
  "y": 60,
  "wires": [
    [
      "e14610f0a8d9018e"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false,
  "info": ""
}

Node.info = `
Format: ISO 8601
`

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  global.set("dateOfOrigin", dayjs().format('YYYYMMDD'));
  global.set("timeOfOrigin", dayjs().format('HHmmss'));
  global.set("simpleDate", dayjs().format('DD-MM-YYYY'));
  
  return msg;
}

module.exports = Node;