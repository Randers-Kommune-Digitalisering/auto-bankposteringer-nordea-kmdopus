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
  "y": 860,
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
  let closedDates = JSON.parse(env.get("BANKING_CLOSED_DATES"));
  const offset = 2; // offset = 2 until Nordea fixes date issue on server
  
  function isBankClosed(date) {
      return date.day() === 0 || date.day() === 6 || closedDates.includes(date.format('YYYY-MM-DD'));
  }
  
  function findBookingDate() {
      let date = dayjs();
      let bankDaysFound = 0;
  
      while (bankDaysFound < offset) {
          date = date.subtract(1, 'day');
          if (!isBankClosed(date)) {
              bankDaysFound++;
          }
      }
  
      return date.format('YYYY-MM-DD');
  }
  
  // Brug dagens dato i forskellige formater
  dates.date = dayjs().format('YYYYMMDD');
  dates.simpleDate = dayjs().format('DD-MM-YYYY');
  dates.time = dayjs().format('HHmmss');
  
  // Sæt bookingdato baseret på restart-flag
  dates.bookingDate = global.get("runs").restart ? global.get("runs").originDate : findBookingDate();
  
  global.set("dates", dates);
  return msg;
}

module.exports = Node;