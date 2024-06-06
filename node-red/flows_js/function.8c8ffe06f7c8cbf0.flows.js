const Node = {
  "id": "8c8ffe06f7c8cbf0",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "1fb8657a805b873c",
  "name": "restructure data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "csv",
      "module": "csv-parser"
    }
  ],
  "x": 180,
  "y": 160,
  "wires": [
    [
      "6ffee308afcf6013"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  const date = global.get("dateOfOrigin");
  const time = global.get("timeOfOrigin");
  const dateTime = date + "_" + time;
  const bankingDate = String(global.get("enddate"));
  const dataProviderId = "RAND";
  const filename = "ZFIR_KMD_Opus_Posteringer_IND_730_RAND_" + dateTime + ".xml";
  let lineCounter = 0;
  let debetSum = 0;
  let kreditSum = 0;
  
  
  // ERP-data is currently an array, but needs to be an object for conversion to XML
  const dataArray = flow.get("erp_array");
  const headersString = flow.get("erp_file_headers");
  const headersArray = headersString.split(", ");
  const erpObject = dataArray.map((item) => {
      return headersArray.reduce((obj, header, index) => {
          obj[header] = item[index];
          return obj;
      }, {});
  });
  
  function makeId(length) {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      let counter = 0;
      while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
      }
      return result;
  }
  
  const docId = makeId(16);
  
  const LINES = {};
  for (let posting of erpObject) {
      lineCounter++;
  
      let cleanedAmount = posting['Beløb'].replace(',', '.');
      let amount = posting['Debet/kredit'] === "Debet" ? cleanedAmount : cleanedAmount * -1;
      let psp = posting['PSP-element'] !== "" ? posting['PSP-element'] : undefined;
  
      let line = {
          DEB_CRED_IND: posting['Debet/kredit'],
          AMT_DOCCUR: String(amount),
          ITEM_TEXT: posting['Tekst'],
          GL_ACCOUNT: posting['Artskonto'],
          WBS_ELEMENT: psp,
          REF_KEY_3: String(lineCounter),
          ZZCSYSIDN: dataProviderId
      }
  
      // Remove keys with undefined values
      Object.keys(line).forEach(key => line[key] === undefined && delete line[key]);
  
      switch (posting['Debet/kredit']) {
          case 'Debet':
              debetSum += parseFloat(cleanedAmount);
              console.log("new debet sum = " + debetSum)
              break;
          case 'Kredit':
              kreditSum += parseFloat(cleanedAmount);
              console.log("new kredit sum = " + kreditSum)
              break;
          default:
              break;
      };
  
      LINES['LINE_' + lineCounter + '_'] = line;
  }
  
  const CONTROL_FIELDS = {
      SENDERID: "P04CLNT730",
      RECEIVER: "P04CLNT730",
      FILE_NAME: filename,
      SEND_DATE: date,
      SEND_TIME: time
  };
  
  const HEADER = {
      'NO_DOC-POSITION': String(lineCounter),
      'BALANCE_DEBET': String(debetSum.toFixed(2)),
      'BALANCE_CREDIT': String(kreditSum.toFixed(2)),
      'MUNICIPALITY': '730',
      'COMP_CODE': '0020',
      'DOC_DATE': bankingDate,
      'PSTNG_DATE': bankingDate,
      'RECEIV_DOC': docId,
      'HEADER_TXT': dataProviderId,
      'XREF1_HD': dataProviderId
  };
  
  const secondIndentationObject = {
      'HEADER': HEADER,
      'LINES': LINES
  };
  
  const firstIndentationObject = {
      'CONTROL_FIELDS': CONTROL_FIELDS,
      'POSTING_DOCUMENT': secondIndentationObject
  };
  
  const xmlObject = {
      'n1:FinancePostingRequest': firstIndentationObject
  };
  
  flow.set("erpObject", xmlObject);
  
  flow.set("filenameFTPlocal", "/data/output/" + filename)
  flow.set("filenameFTPremote", "/some/folder/" + filename)
  
  return msg;
}

module.exports = Node;