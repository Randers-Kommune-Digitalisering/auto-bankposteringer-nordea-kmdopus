const Node = {
  "id": "9f0da9b309d12828",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "d": true,
  "g": "09ae44d941f2b3ed",
  "name": "Convert to XML compliance ",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "csv",
      "module": "csv-parser"
    },
    {
      "var": "xml2js",
      "module": "xml2js"
    }
  ],
  "x": 495,
  "y": 180,
  "wires": [
    [
      "ecaebc4d0cb38676"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv, xml2js) {
  const date = global.get("dateOfOrigin");
  const time = global.get("timeOfOrigin");
  const compCode = global.get("configs").ftp.compCode;
  const prodEnv = global.get("configs").ftp.prodEnv;
  const dataProviderId = global.get("configs").ftp.dataProviderId;
  const dataProviderIdCode = global.get("configs").ftp.dataProviderIdCode;
  const filename = global.get("configs").ftp.filename;
  const bankingDate = String(global.get("date"));
  let lineCounter = 0;
  let debetSum = 0;
  let kreditSum = 0;
  
  
  // ERP-data is currently an array, but needs to be an object for conversion to XML
  const dataArray = flow.get("erpArray");
  const headersString = flow.get("erpFileHeaders");
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
  
      console.log(posting);
  
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
      SENDERID: prodEnv + "CLNT" + dataProviderIdCode,
      RECEIVER: prodEnv + "CLNT" + dataProviderIdCode,
      FILE_NAME: filename,
      SEND_DATE: date,
      SEND_TIME: time
  };
  
  const HEADER = {
      'NO_DOC-POSITION': String(lineCounter),
      'BALANCE_DEBET': String(debetSum.toFixed(2)),
      'BALANCE_CREDIT': String(kreditSum.toFixed(2)),
      'MUNICIPALITY': dataProviderIdCode,
      'COMP_CODE': compCode,
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
  
  msg.payload = xmlObject;
  global.set("xmlObject", xmlObject);
  
  return msg;
}

module.exports = Node;