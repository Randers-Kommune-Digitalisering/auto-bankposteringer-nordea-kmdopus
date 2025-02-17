const Node = {
  "id": "463d25185f3be2f0",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "85a5e54522cd21cc",
  "name": "set global vars",
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
  "x": 125,
  "y": 460,
  "wires": [
    [
      "405c31e7c368685d"
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
  function findDate() {
      let date = dayjs().startOf('day');
  
      if (date.day() === 1) { // If today is Monday
          date = date.subtract(3, 'day');
      } else {
          date = date.subtract(1, 'day');
      }
  
      return date.format('YYYY-MM-DD');
  }
  
  // Set global variables
  global.set("date", findDate());
  global.set("dateOfOrigin", dayjs().format('YYYYMMDD'));
  global.set("timeOfOrigin", dayjs().format('HHmmss'));
  global.set("simpleDate", dayjs().format('DD-MM-YYYY'));
  
  return msg;
}

module.exports = Node;