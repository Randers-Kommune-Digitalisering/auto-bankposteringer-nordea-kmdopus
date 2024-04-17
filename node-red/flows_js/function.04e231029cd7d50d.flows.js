const Node = {
  "id": "04e231029cd7d50d",
  "type": "function",
  "z": "debc38a0513e22c1",
  "g": "b4ef161cb64fdf9d",
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
  "x": 260,
  "y": 60,
  "wires": [
    [
      "639fe74c5b6d7b2b",
      "0e0827ef35888613"
    ]
  ],
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
  global.set("dateOfOrigin", dayjs().format('YYYY-MM-DD'));
  
  return msg;
  
}

module.exports = Node;