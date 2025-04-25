const Node = {
  "id": "641a17ea099f1738",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "92e532a45306c14a",
  "name": "set system dates",
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
  "y": 580,
  "wires": [
    [
      "d2e3d87b68569e12"
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
  let dates = global.get("dates") || [];
  const offset = 1; // offset = 1 until Nordea fixes date issue on server
  
  function findBookingDate() {
      let date = dayjs().startOf('day');
  
      if (date.day() === (1 + offset)) {
          date = date.subtract((3 + offset), 'day');
      } else {
          date = date.subtract((1 + offset), 'day');
      }
  
      return date.format('YYYY-MM-DD');
  }
  
  dates.date = dayjs().format('YYYYMMDD');
  dates.simpleDate = dayjs().format('DD-MM-YYYY');
  dates.time = dayjs().format('HHmmss');
  
  dates.bookingDate = global.get("runs").restart ? global.get("runs").originDate : findBookingDate();
  
  global.set("dates", dates);
  
  return msg;
}

module.exports = Node;