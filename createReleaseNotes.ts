import keys from './config/keys.json';

import fetch from 'node-fetch';

import * as fs from 'fs-extra';

/*
    John Hummel
    This will generate the release notes into an HTML file that can be imported directly into Zendesk or other HTML based system.

    We'll start with the Time and Attendance based system.
*/

//set the Project, the Release, and the Partners.
var project:string = 'ATS';
var projects:string[] = ['ATS', 'Onboarding', 'COM'];
// project = 'ATS';

var label:string = `PROD-07DEC20`;
var labels:string[] = ['PROD-07DEC20'];

var displayPartners:boolean = true;

//there will at least be All.
var partners:string[] = ['All'];
//partners = ['All','ClockRite','TimePro'];
// partners = ['All','Heartland'];
// partners = ['All','DeluxeCA','DeluxeUSA'];
// partners = ['All','PayEntry'];



//This is the base JQL - everything else gets added into here.
var jqlBase:string = `(project = '${project}' OR project='COM') AND labels in (${labels.toString()}) AND cf[10045]=Production AND cf[10044] In (${partners.toString()})`;
// jqlBase = `labels in (${labels.toString()}) AND cf[10045]=Production AND cf[10044] In (${partners.toString()})`;
// jqlBase = `labels in (PROD-16AUG20)`;
jqlBase = `project in (${projects.toString()}) AND labels in (${labels.toString()})`;
console.log(jqlBase);

// jqlBase = `issue=BEN-5288`;

//create our file based on the Project, and release label.
var releaseNotesFile:string = `./data/${project}_${label}.html`;

var releaseNotesFileBase:string = `${project}_${label}.html`;


//create our file
fs.outputFile(releaseNotesFile, `<h1>Release Notes for ${label}</h1>\n`, err => {
    if(err)
        console.log(err);
});

var streamFile = fs.createWriteStream(releaseNotesFile, {flags:'a'});

interface Issue {
    key: string,
    partnerSummary: string,
    partnerDescription: string,
    category:string,
    issuetype:string,
    platform:string,
    partners: string[],
    project: string
}

function DecodeIssue(json):Issue {
    // console.log(`key:`);
    // console.log(`partnerDescription`);
    // console.log(`partnerSummary`);
    // console.log(`category:`);
    // console.log(`issuetype:`);
    // console.log(`platform`);
    // console.log(`partners:`);
    // console.log(`project: ${json.fields.project.key}`);


    return {
        key: json.key,
        partnerDescription: json.fields.customfield_10043 ? GetPartnerDescription(json.fields.customfield_10043.content):'None',
        partnerSummary : json.fields.customfield_10042 ? json.fields.customfield_10042:'None',
        category: json.fields.customfield_10047 ? json.fields.customfield_10047.value:['None'],
        issuetype: json.fields.issuetype.name,
        platform: json.fields.customfield_10046 ? json.fields.customfield_10046.value:['None'],
        partners: json.fields.customfield_10044 ? json.fields.customfield_10044.map(partner => partner.value):['None'],
        project: json.fields.project.key ? json.fields.project.key:['None']
    }
}

//give it just the content section.
function GetPartnerDescription(partnerDescription):string{
    
    let returnString = '';
    partnerDescription.forEach(content => {
        if(content.type === 'text')
        {
            returnString += `${content.text}\n`;
        }
        if(content.type === 'paragraph') {
            content.content.forEach(paragraph => {
                if(paragraph.type === 'text') 
                    returnString += `${paragraph.text}\n`;
            })
        }
    });

    return returnString;
}

GetIssues(jqlBase);


function WriteReleaseNotes(issues:Issue[]) {
    //we now have an array of all the issues.
    
    //start with the improvements
    let issuesImprovements = issues.filter(issue => {
        if(issue.issuetype != 'Bug') {
            return issue;
        }
    });

    //get the platforms from this release
    let platformsImprovements:Set<string> = new Set(issuesImprovements.map(issue => issue.platform));
    //get the categories from this release
    let categoriesImprovements:Set<string> = new Set(issuesImprovements.map(issue => issue.category));

    let projectImprovements:Set<string> = new Set(issuesImprovements.map(issue => issue.project));

    /*
        This update before we reorganize this sucker:  

        Create a separate file, or perhaps a separate section in the one file?  Separate files would be best:
            1. By Project AND COM.
            2. By the partner - we'll have to separate out partners better for deluxe or companies with multiple partners.
            3. By the Issue - Non-Bugs, then Bugs.
            4. By the Platform.
    */


    platformsImprovements.forEach(platform => {
        streamFile.write(`<h2>Features and Enhancements: ${platform}</h2>\n`);
        categoriesImprovements.forEach(category => {
            //filter by the platforms and category
            
            DisplayCategory(category, issuesImprovements.filter(issue => {
                if(issue.platform === platform && issue.category === category) return issue;
        }));
        })
    })

    //now use the bugs
    let issuesBugs = issues.filter(issue => {
        if(issue.issuetype === 'Bug') {
            return issue;
        }
    });
    if(issuesBugs.length != 0) {
        streamFile.write(`<h2>Bug Fixes</h2>\n`);
        let platformsBugs:Set<string> = new Set(issuesBugs.map(issue => issue.platform));
        platformsBugs.forEach(platform => {
            DisplayBugs(platform, issuesBugs.filter(issue => {
                if(issue.platform===platform) {
                    return issue;
                }
            }));
        });
    }    
}

function DisplayBugs(platform:string, issues:Issue[]) {
    console.log(`Bugs: ${issues.length}`);
    streamFile.write(`<h3>${platform}</h3>\n`);
    streamFile.write(`<table border="1" width="100%">\n`);
    streamFile.write(`<tr>\n`);
    streamFile.write(`\t<th style="background-color:#b8cce5;width:33%">Feature / Functionality</th>\n`);
    streamFile.write(`\t<th style="background-color:#b8cce5;width:auto">Description</th>\n`);
    if(displayPartners == true) {
        streamFile.write(`\t<th style="background-color:#b8cce5;width:33%">Partners</th>\n`);
    }
    streamFile.write(`</tr>\n`);
    issues.forEach(issue => {
        streamFile.write(`<tr>\n`);
        streamFile.write(`\t<td>${issue.partnerSummary}</td>\n\t<td>${issue.partnerDescription}</td>`);
        if(displayPartners == true) {
            streamFile.write(`\t<td>${issue.partners.toString()}</td>`);
        }
        streamFile.write(`\n`);
        streamFile.write(`</tr>\n`);
    });
    streamFile.write(`</table>\n`);
}

function DisplayCategory(category:string,issues:Issue[]) {
    if(issues.length != 0) {
        streamFile.write(`<h3>${category}</h3>\n`);
        streamFile.write(`<table border="1" width="100%">\n`);
        streamFile.write(`<tr>\n`);
        streamFile.write(`\t<th style="background-color:#b8cce5;width:33%">Feature / Functionality</th>\n`);
        streamFile.write(`\t<th style="background-color:#b8cce5;width:auto">Description</th>\n`);
        if(displayPartners == true) {
            streamFile.write(`\t<th style="background-color:#b8cce5;width:33%">Partners</th>\n`);
        }
        streamFile.write(`</tr>\n`);
        issues.forEach(issue => {
            streamFile.write(`<tr>\n`);
            streamFile.write(`\t<td>${issue.partnerSummary}</td>\n`);
            streamFile.write(`\t<td>${issue.partnerDescription}</td>\n`);
            if(displayPartners == true) {
                streamFile.write(`\t<td>${issue.partners.toString()}</td>\n`);
            }
            streamFile.write(`</tr>\n`);
        });

    streamFile.write(`</table>\n`);
}

}

function GetIssues(jql:string):Promise<Issue[]>{
    //first, how many issues do we have
    return fetch(`${keys.jiraSite}/rest/api/3/search`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(keys.username+':'+keys.password
            ).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
        body: JSON.stringify({
            jql: jql,
            "fieldsByKeys": true,
            "maxResults": 1000,
            "fields": [
                "status",
            ],
        })
    })
    .then(response => response.json())
    .then(json => {
        //this gives us how many "pages" we need to get
        var totalNumberOfIssues:number = Math.floor(json.total / 100);
        var bodies:object[] = [];
        while(totalNumberOfIssues > -1){
            bodies.push({
                jql: jql,
                "fieldsByKeys": true,
                "maxResults": 1000,
                "fields": [
                    "customfield_10042",
                    "customfield_10043",
                    "customfield_10047",
                    "issuetype",
                    "customfield_10046",
                    "customfield_10044",
                    "project"           
                ],
                "startAt": (totalNumberOfIssues-- * 100)
            })
        };
        return bodies;
    })
    .then(bodyArray => {
        Promise.all(bodyArray.map(FetchIssues))
        .then(allIssues => allIssues.flat(1))
        .then(issues => issues.map(DecodeIssue))
        .then(issues => { 
            console.log(`Issues Total: ${issues.length}`);
            // console.log(`Issues: ${JSON.stringify(issues)}`);
            WriteReleaseNotes(issues);
        });
    });

}

function FetchIssues(bodyData:object):Promise<Issue[]> {
    return fetch(`${keys.jiraSite}/rest/api/3/search`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(keys.username+':'+keys.password
            ).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
    })
    .then(response => response.json())
    .then(json => {
        // console.log(JSON.stringify(json));
        return json.issues;
    });
    
}