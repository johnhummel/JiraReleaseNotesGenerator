/*
    1. Import the JSON array from ./data/[release].json.
    2. Process through the array and download the release notes for each Issue.
*/

import keys from './config/keys.json';

import fetch from 'node-fetch';

import * as fs from 'fs-extra';

var editIssueURL:string = '/rest/api/3/issue/';

//put the label here
var label:string = 'PROD-31DEC20';

const bodyData = {
  "update": {
    "labels": [
      {
        "add": label
      }
    ]
  }
};

// const bodyData = {
//   "update": {
//     "labels": [
//       {
//         "add": label
//       }
//     ],
//     "fixVersions" : [
//       {
//         "add":  {
//             "name": label
//           }
//       }
//     ]
//   }
// };

// const bodyData = {
//   "update": {
//     "labels": [
//       {
//         "remove": label
//       }
//     ]
//   }
// };

//go through the keys and add the label to them
//add the label here
fs.readFile(`./data/${label}.json`,(error, data) => {
  try {
    if(error) throw error;
    let issues = JSON.parse(data);
    issues.keyId.forEach(issue => 
      delay(5000)
      .then(() => addLabel(issue, `${label}`))
    );
    console.log(`Issues: ${JSON.stringify(issues)}`);
  } catch(error) {
    console.log(`Read file error: ${error}`);
  }
});


//randomly set when to expire the request.
function delay(ms) {
  let min = Math.ceil(0);
  let max = Math.floor(ms);
  let finalDelay = Math.floor(Math.random() * (max - min)) + min;
  return new Promise(resolve => setTimeout(resolve, finalDelay));
}

// import(`./data/PROD-19AUG20.json`)
// .then(issues => issues.keyId.forEach(issue => addLabel(issue, `${label}`)));

//use the Jira API and assign the label to the tickets above.
function addLabel(issueKey:string, label:string) {
    
    delay(10000)
    .then(() => {
      fetch(keys.jiraSite + editIssueURL + issueKey, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${Buffer.from(keys.username+':'+keys.password
          ).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })
      .then(response => {
        console.log(
          `Response: ${issueKey}: ${response.status} ${response.statusText}`
        );
      })
    })
    .catch(err => {
        console.error(`addLabel issues: ${err}`);
    });
}
