const Node = {
  "id": "463d25185f3be2f0",
  "type": "function",
  "z": "62eaf4407ee85a3a",
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
  "x": 1035,
  "y": 400,
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
  let dates = global.get("dates");
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
  dates.bookingDate = findDate();
  dates.date = dayjs().format('YYYYMMDD');
  dates.simpleDate = dayjs().format('DD-MM-YYYY');
  dates.time = dayjs().format('HHmmss');
  
  global.set("dates", dates);
  
  return msg;
}

module.exports = Node;