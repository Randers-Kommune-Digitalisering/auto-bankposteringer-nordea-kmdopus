const Node = {
  "id": "3ca6eb1c92b68606",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "2c7913f560d4d1e7",
  "name": "Er der gemt regler i csv-fil som skal importeres til løsningen?",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.rulesToImportFromFile",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 280,
  "y": 100,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-pencil",
  "info": ""
}

Node.info = `
To import rules there needs to be a csv-file placed inside the node-red directory.
A template specific to each ERP can be found in the "konteringsregler" folder.

Once you've filled out the template with your rules, upload the file as a csv-file.
Upload to the "konteringsregler" folder to ease the configuration of filepaths.

The first time the program runs, rules will be empty.
You need to initiate the "CSV overwrite" flow to import the rules.

Once the rules have been overwritten, you may delete the csv-file from the directory.
`

module.exports = Node;