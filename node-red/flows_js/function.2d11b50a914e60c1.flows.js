const Node = {
  "id": "2d11b50a914e60c1",
  "type": "function",
  "z": "8c354b8d2ca56b7b",
  "g": "9b2beb35be5bbb31",
  "name": "set banking date",
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
  "x": 175,
  "y": 60,
  "wires": [
    [
      "497a8a8d75494096"
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
  let dates = global.get("dates") || [] ;
  
  function findDate() {
      let date = dayjs().startOf('day');
  
      if (date.day() === 1) { // If today is Monday
          date = date.subtract(4, 'day');
      } else {
          date = date.subtract(2, 'day');
      }
  
      return date.format('YYYY-MM-DD');
  }
  
  // Set global variables
  dates.bookingDate = findDate();
  global.set("dates", dates);
  
  return msg;
}

module.exports = Node;