const Node = {
  "id": "8c8ffe06f7c8cbf0",
  "type": "function",
  "z": "f91accb007eed9a2",
  "name": "restructure data",
  "func": "",
  "outputs": 1,
  "noerr": 22,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "csv",
      "module": "csv-parser"
    }
  ],
  "x": 280,
  "y": 160,
  "wires": [
    []
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  const xmlObject = [];
  const date = String(global.get("dateOfOrigin"));
  const time = String(global.get("timeOfOrigin"));
  const dateTime = date + "_" + time;
  const transactionsDate = String(global.get("enddate"));
  
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
  
  let debetSum = 0;
  let kreditSum = 0;
  
  function makeid(length) {
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
  
  const documentId = makeid(16);
  
  let docType = 
  xmlObject.push()
  
  let CONTROL_FIELDS = [];
  CONTROL_FIELDS.push({ SENDERID: "P04CLNT730" });
  CONTROL_FIELDS.push({ RECEIVER: "P04CLNT730" });
  CONTROL_FIELDS.push({ FILE_NAME: "ZFIR_KMD_Opus_Posteringer_IND_730_RAND_" + dateTime + ".xml" });
  CONTROL_FIELDS.push({ SEND_DATE: date });
  CONTROL_FIELDS.push({ SEND_TIME: time });
  xmlObject.push(CONTROL_FIELDS);
  
  for (let posting of erpObject) {
      
  }
  
  flow.set("erpObject", erpObject);
  
  return msg;
  
  for (let posting of global.get("transactions")) {
      let sumOfErpPostings = 0;
      let sumOfRulesChecked = 0;
      let matchedAllParametersBool = false;
  
      let postingAmount = parseFloat(posting.amount);
      let cleanedAmount = posting.amount.replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let statusDebetOrCredit = postingAmount > 0 ? "Debet" : "Kredit";
      let bookDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet"
  
      for (let rule of sortedRules) {
          let matches = 0;
  
          let artskonto = rule[6].Artskonto;
          let psp = rule[6].PSP ? rule[6].PSP : '';
          let textVariation = rule[6].Posteringstekst?.toLowerCase() ? rule[6].Posteringstekst.toLowerCase() : undefined;
          let exceptionBool = rule[9].exception;
          let amountOperator = rule[5].operator;
          let ruleAmount1 = rule[5]?.value1 ? parseFloat(rule[5].value1.replace(',', '.')) : undefined;
          let ruleAmount2 = rule[5]?.value2 ? parseFloat(rule[5].value2.replace(',', '.')) : undefined;
  
          if (sumOfRulesChecked > 1 && sumOfErpPostings > 0) {
              continue
          } else {
              for (let i = 0; i < postingParameters.length; i++) {
                  let searchValue = rule[i]?.value ? String(rule[i].value).toLowerCase() : null;
  
                  if (searchValue !== null && rule[7].active && matchParameter(posting, searchValue, postingParameters[i])) {
                      matches += 1;
                      break
                  }
              }
  
              if (matches === calculateSpecificity(rule)) {
                  matchedAllParametersBool = true;
              }
  
              let matchedAmountBool = matchAmount(postingAmount, amountOperator, ruleAmount1, ruleAmount2)
  
              if (matchedAllParametersBool && matchedAmountBool) {
                  if (!exceptionBool) {   // Don't write ERP postings if rule is an exception
                      let text = textGeneration(textVariation, posting.message, posting.narrative, posting.counterparty_name);
  
                      generateErpPostings(currentStatusAccount, artskonto, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, psp);
                  }
  
                  sumOfErpPostings += 1;
              }
          }
  
          sumOfRulesChecked += 1;
      }
  
      if (sumOfErpPostings === 0) {
          sumOfPostingsWithNoMatch += 1;
          let text = posting.transaction_id;
  
          generateErpPostings(currentStatusAccount, currentLandingAccount, statusDebetOrCredit, bookDebetOrCredit, text, cleanedAmount, '');
  
          postingsWithNoMatch.push(posting);
          sumOfErpPostings += 1;
      }
}

module.exports = Node;