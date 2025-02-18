const Node = {
  "id": "da9d0b8038e2bfe1",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "202a6b173abfc606",
  "name": "Match postings with rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 155,
  "y": 80,
  "wires": [
    [
      "c49c5be7601cebc5",
      "5eacaf9ba681643d"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpPostings = [];
  let transactionsWithNoMatch = global.get("transactionsWithNoMatch") ? global.get("transactionsWithNoMatch") : [];
  const transactions = global.get("transactions").reverse();
  const transactionParameters = flow.get("transactionParameters");   // Has to match ruleParameters length
  const accountingRules = global.get("accountingRules");
  const ruleParameters = Object.keys(accountingRules[0]).slice(0, 4);
  const erpFileHeaders = flow.get("erpFileHeaders").split(", ");
  const bankAccounts = global.get("bankAccounts");
  const date = global.get("simpleDate");
  
  function sumOfParametersGiven(rule) {
      // Count the number of rule parameters where the value property is defined (truthy)
      return Object.keys(rule)
          .slice(0, 4)
          .filter(key => rule[key] || rule[key] || rule[key]).length;
  }
  
  function matchParameter(transaction, searchValue, key) {
      return transaction[key] ? transaction[key].toLowerCase().includes(searchValue) : false;
  }
  
  function matchAmount(transactionAmount, amountOperator, ruleAmount1, ruleAmount2) {
      switch (ruleAmount1) {
          case null:
              break;
          default:
              ruleAmount1 = parseFloat(ruleAmount1.replace(/\./g, '').replace(',', '.'));
              break;
      }
  
      switch (ruleAmount2) {
          case null:
              break;
          default:
              ruleAmount2 = parseFloat(ruleAmount2.replace(/\./g, '').replace(',', '.'));
              break;
      }
      
      switch (amountOperator) {
          case '><':
              return transactionAmount >= ruleAmount1 && transactionAmount <= ruleAmount2;
          case '>':
              return transactionAmount > ruleAmount1;
          case '<':
              return transactionAmount < ruleAmount1;
          case '==':
              return transactionAmount === ruleAmount1;
          default:
              return true;
      }
  }
  
  function textGeneration(textVariation, message, narrative, counterparty_name) {
      if (narrative && narrative.includes('BDP')) {
          return narrative.substring(narrative.indexOf('BDP'));
      } else if (narrative && narrative.includes('KSD')) {
          return narrative.substring(narrative.indexOf('KSD')) + (counterparty_name ? counterparty_name : '');
      }
  
      switch (textVariation.toLowerCase()) {
          case "tekst fra bank":
              return narrative;
          case "afsender fra bank":
              return counterparty_name || message;
          case "advis fra bank":
              return message || narrative;
          default:
              return textVariation;
      }
  }
  
  function generateErpPostings(statusAccount, landingAccount, statusDebetOrCredit, landingDebetOrCredit, text, amount, psp) {
      // Needs work. Length and placement of variables should be dynamic, based on headers.
      erpPostings.push([landingAccount, '', psp, '', '', landingDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      erpPostings.push([statusAccount, '', '', '', '', statusDebetOrCredit, amount, '', text, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  function processPosting(transaction, rules) {
      transaction.amount = parseFloat(transaction.amount);
      let absoulute_amount = Math.abs(transaction.amount);
      let cleanedAmount = String(transaction.amount).replace(/[^\d.-]/g, '').replace('-', '').replace('.', ',');
      let statusDebetOrCredit = transaction.amount > 0 ? "Debet" : "Kredit";
      let landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet";
      
      if (transaction.account.manual) {
          generateErpPostings(transaction.account.statusAccount, transaction.account.Artskonto, statusDebetOrCredit, landingDebetOrCredit, transaction.account.text, cleanedAmount, transaction.account.PSP);
      } else {
          let completeMatchBool = false;
  
          for (let rule of rules) {      
              let sumOfParametersMatched = 0;
              let psp = rule.PSP ? rule.PSP : '';
  
              if (completeMatchBool) {
                  continue
              } else {
                  for (let parameterIndex = 0; parameterIndex < transactionParameters.length; parameterIndex++) {
                      let searchValue = rule[ruleParameters[parameterIndex]] ? rule[ruleParameters[parameterIndex]].toLowerCase() : null;
  
                      if (searchValue && rule.ActiveBool && matchParameter(transaction, searchValue, transactionParameters[parameterIndex])) {
  
                          sumOfParametersMatched += 1;
                      }
                  }
  
                  let matchedAllParametersBool = sumOfParametersMatched === sumOfParametersGiven(rule);
                  let matchedAmountBool = matchAmount(absoulute_amount, rule.Operator, rule.Beløb1, rule.Beløb2)
  
                  if (matchedAllParametersBool && matchedAmountBool) {
                      if (!rule.ExceptionBool) {   // Don't write ERP postings if rule is an exception, but still count as match
                          let text = textGeneration(rule.Posteringstekst, transaction.message, transaction.narrative, transaction.counterparty_name);
                          generateErpPostings(transaction.account.statusAccount, rule.Artskonto, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, psp);
                      }
                      completeMatchBool = true;
                      rule.LastUsed = date;
                  }
              }
          }
          if (!completeMatchBool) {
              let text = transaction.transaction_id;
  
              generateErpPostings(transaction.account.statusAccount, transaction.account.intermediateAccount, statusDebetOrCredit, landingDebetOrCredit, text, cleanedAmount, '');
              
              if (transaction.account.bankAccountName != "Debitorkonto") {
                  transaction.amount = transaction.amount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  transactionsWithNoMatch.push(transaction);
              }
          }
  
          global.set("transactionsWithNoMatch", transactionsWithNoMatch);
  
      }   
      
  }
  
  transactions.forEach(transaction => {
      processPosting(transaction, accountingRules);
  });
  
  msg.payload = erpPostings;
  msg.columns = flow.get("erpFileHeaders");
  msg.filename = "/data/output/" + date + ".csv";
  
  return msg;
}

module.exports = Node;