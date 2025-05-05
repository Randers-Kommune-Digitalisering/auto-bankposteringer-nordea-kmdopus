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
      let date = dayjs();
  
      // Subtract offset days first (1 = second latest banking day)
      date = date.subtract(offset, 'day');
  
      // Then subtract 1 more day if today is Monday (to skip weekend)
      if (date.day() === 1) {
          date = date.subtract(3, 'day'); // Monday → back to Friday
      } else {
          date = date.subtract(1, 'day'); // Other weekdays → back 1 day
      }
  
      // Skip weekends
      while (date.day() === 0 || date.day() === 6) {
          date = date.subtract(1, 'day');
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