const Node = {
  "id": "a63c9eebe49c49ea",
  "type": "template",
  "z": "97cc6bce53027f96",
  "name": "JavaScript",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 870,
  "y": 540,
  "wires": [
    [
      "487b9a4158444856"
    ]
  ],
  "_order": 81
}

Node.template = `
const ruleWrapper_user = document.querySelector(".ruleWrapper_user");
const addRuleButton = document.querySelector(".addRuleButton");

const rules = _rules != null ? _rules : []; // Rules are defined in change node previous to this

const operators = [
    {
        "name": "= Skal være lig med",
        "value": "=="
    },
    {
        "name": "≠ Må ikke være lig med",
        "value": "!="
    },
    {
        "name": "< Skal være mindre end",
        "value": "<"
    },
    {
        "name": "> Skal være større end",
        "value": ">"
    },
    {
        "name": "{?} Indeholder",
        "value": "contains"
    },
    {
        "name": "{!} Indeholder ikke",
        "value": "!contains"
    },
    {
        "name": "[o] Skal være oplyst",
        "value": "!null"
    },
    {
        "name": "[...] Starter med",
        "value": ".startsWith"
    },
    {
        "name": "Slutter med [...]",
        "value": ".endsWith"
    }
]

function generateRule(index) {
	const obj_array = rules[index]; // rules[index] returnerer et array
    let returnHTML = \`
        <div>
        <h1>\${index}</h1>
        <h3></h3>
    \`;

	for (let i = 0; i < obj_array.length-1; i++) {
		const obj = obj_array[i]
		
        if (obj.value || obj.value1) {
            returnHTML += \`   
                    <h2>\${obj.name}</h2>
                    <select id="input_\${obj.name}_operator">
                \`;
            
            for (let i = 0; i < operators.length; i++) {
                let isSelected = obj.operator == operators[i].value;
                //console.log("Checking '" + obj.operator + "' against '" + operators[i].value + "' = " + isSelected);
                returnHTML += \`<option value="\${operators[i].value}"\${isSelected ? " selected" : ""}>\${operators[i].name}</option>\`;
            }
        
            returnHTML += \`
                    </select>
                    <input id="input_\${obj.name}_value" value="\${obj.value}" />
            \`;
            
            // virker ikke

            if (obj.Notat) {
                returnHTML += \`
                    <input id="description" value="\${obj.Notat}" />
                \`;
            }
        }
	}
    returnHTML += \`
			</div>
		\`;
    return returnHTML;
}

for (let i = 0; i < rules.length; i++) {
    ruleWrapper_user.innerHTML += generateRule(i);
}
for (let i = 0; i < rules.length; i++) {
    document.querySelector("#input_" + i + "_operator").addEventListener("focusout", () => {
        UpdateValue(document.querySelector("#input_" + i + "_operator"));
    });

    document.querySelector("#input_" + i + "_value").addEventListener("focusout", () => {
        UpdateValue(document.querySelector("#input_" + i + "_value"));
    });

    document.querySelector("#input_" + i + "_value").addEventListener("input", () => {
        OnInputChange(document.querySelector("#input_" + i + "_value"));
    });
}


// function generateNewRow
	


// document.querySelector("#addRuleButton").addEventListener("mouse", 
	

`

module.exports = Node;