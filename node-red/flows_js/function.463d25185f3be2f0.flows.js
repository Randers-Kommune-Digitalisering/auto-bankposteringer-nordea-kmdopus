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
  "x": 135,
  "y": 480,
  "wires": [
    [
      "405c31e7c368685d"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false,
  "info": ""
}

Node.info = `
Format: ISO 8601
`

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  function findDate(arg) {
      let startDate = dayjs().startOf('day');
      let endDate = dayjs().endOf('day').subtract(1, 'day');
  
      if (startDate.day() === 1) { // If today is Monday
          startDate = startDate.subtract(3, 'day');
      } else {
          startDate = startDate.subtract(1, 'day');
      }
  
      if (arg === "start") {
          return startDate.format('YYYY-MM-DD');
      } else if (arg === "end") {
          return endDate.format('YYYY-MM-DD');
      }
  }
  
  // Set global variables
  global.set("startdate", findDate("start"));
  global.set("enddate", findDate("end"));
  global.set("dateOfOrigin", dayjs().format('YYYYMMDD'));
  global.set("timeOfOrigin", dayjs().format('HHmmss'));
  global.set("accountStep", 0);
  global.set("bankAccounts", ["DK20005908764988-DKK"]);
  
  return msg;
  
}

module.exports = Node;