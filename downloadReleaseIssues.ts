import keys from './config/keys.json';

import fetch from 'node-fetch';

import * as fs from 'fs-extra';

//fetch all issues by a specific label

//Jira API:
//POST /rest/api/3/search
//https://developer.atlassian.com/cloud/jira/platform/rest/v3/#api-rest-api-3-search-post
//uses a JQL expression. 

//set the project here
var project:string = 'BEN';
//set the label here
var label: string = 'PROD-31DEC20';
// label='TEST';
var labels: string[] = ['PROD-31DEC20'];

var jql:string = `(project = ${project} OR project='COM') AND labels in (${labels.toString()})`;
// jql = `(project = BEN OR project='COM') AND labels in (PROD-04MAY20,PROD-07MAY20,PROD-19MAY20,PROD-22MAY20) AND cf[10045]=Production AND cf[10044] In (All)`;
//jql = 'project=TS AND labels = PROD-04JUN20';
// jql = `issue = TS-5875`;
// jql = `labels in (${labels.toString()})`;
console.log(jql);
GetIssues();

// const bodyData = {
//     jql: jql,
//     "fieldsByKeys": true,
//     "maxResults": 1000,
//     "fields": ["*all"],
//     "startAt": 0
// };

//console.log(JSON.stringify(bodyData));
interface Issue {
    id: number,
    key: string,
    summary: string,
    issuetype: string,
    project: string,
    status: string,
    priority: string,
    assignee: string,
    reporter: string,
    creator: string,
    created: Date,
    updated: Date,
    lastViewed: Date,
    components: string[],
    labels: string[],
    partnerSummary: string,
    partners: string[],
    environment: string,
    platform: string,
    category: string
}

function DecodeIssue(json):Issue {
    // let lastViewed:string = json.fields.lastViewed;
    // console.log(lastViewed);
    // let created:string = json.fields.created;
    // let updated:string = json.fields.updated;
    return {
        id: json.id,
        key: json.key,
        summary: json.fields.summary,
        issuetype: json.fields.issuetype.name,
        project: json.fields.project.name,
        status: json.fields.status.name,
        priority: json.fields.priority.name,
        assignee: json.fields.assignee ? json.fields.assignee.displayName:'None',
        reporter: json.fields.reporter ? json.fields.reporter.displayName:'None',
        creator: json.fields.creator ? json.fields.creator.displayName: 'None',
        created: new Date(json.fields.created),
        updated: new Date(json.fields.updated),
        lastViewed: new Date(json.fields.lastViewed),
        components: json.fields.components.map(component => component.name),
        labels: json.fields.labels,
        partnerSummary: json.fields.customfield_10042 ? json.fields.customfield_10042:'None',
        partners: json.fields.customfield_10044 ? json.fields.customfield_10044.map(partner => partner.value):['None'],
        environment: json.fields.customfield_10045 ? json.fields.customfield_10045.value:['None'],
        platform: json.fields.customfield_10046 ? json.fields.customfield_10046.value:['None'],
        category: json.fields.customfield_10047 ? json.fields.customfield_10047.value:['None']
    }
}




function GetIssues(){
    //first, get just the number of issues.
    fetch(`${keys.jiraSite}/rest/api/3/search`, {
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
        //set up all of our bodies
        var bodies:object[] = [];
        while(totalNumberOfIssues > -1){
            bodies.push({
                jql: jql,
                "fieldsByKeys": true,
                "maxResults": 1000,
                "fields": [
                    "summary",
                    "issuetype",
                    "status",
                    "priority",
                    "assignee",
                    "reporter",
                    "creator",
                    "created",
                    "updated",
                    "lastViewed",
                    "components",
                    "labels",
                    "project",
                    "customfield_10042",
                    "customfield_10044",
                    "customfield_10045",
                    "customfield_10046",
                    "customfield_10047"
                ],
                "startAt": (totalNumberOfIssues-- * 100)
            })
        };
        //now we have our bodies.
        console.log(JSON.stringify(bodies));
        let totalIssues:Issue[] = [];
        Promise.all(bodies.map(FetchIssues))
        .then(allIssues => allIssues.flat(1))
        .then(issues => {
            //console.log(JSON.stringify(issues));
            //we should now have an array of all the issues
            let labelsSizes:number[] = issues.map(issue => issue.labels.length);
            let componentSizes:number[] = issues.map(issue => issue.components.length);
            let partnerSizes:number[] = issues.map(issue => issue.partners.length);
            // console.log(JSON.stringify(Math.max(...labelsSizes)));
            // console.log(JSON.stringify(Math.max(...componentSizes)));
            issues.forEach(issue => {
                issue.labels.length = Math.max(...labelsSizes);
                issue.components.length = Math.max(...componentSizes);
                issue.partners.length = Math.max(...partnerSizes);
            });
            SaveFile(ReleaseCSV(issues, Math.max(...labelsSizes), Math.max(...componentSizes), Math.max(...partnerSizes)), `${project}_${label}.csv`);
            
        })

        
    })
}

//Fetch all of the issues from this body, and return that array.
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
    .then(json => {return json.issues.map(DecodeIssue)});
    
}

//save the file
function SaveFile(fileData:string, fileName:string):Promise<any> {
    return fs.outputFileSync(`./data/${fileName}`, fileData, err => {
          if (err) {
            console.error(err);
            return err;
          }
          else {
            console.log("Creating file "+fileName);
            return "Creating File "+fileName;
          }
        });
  }


//take the JSON array and make it into a nice CSV format
function ReleaseCSV(issues:Issue[], labelSize:number, componentSize:number, partnerSize:number):string {
    //we will have to adjust based on how many categories we get and labels?
    let components:string[] = Array(componentSize).fill("Component");
    let labels:string[] = Array(labelSize).fill("Label");
    let partners:string[] = Array(partnerSize).fill("Partner");
    //console.log(labels.toString());


    let csvResponse = `Issue key,Summary,${partners.length == 0 ? '': partners.toString()+','}Environment,Platform,Category,Issue id,Issue Type,Project,Status,Priority,Assignee,Reporter,Creator,Created,Updated,Last Viewed,${components.length > 1 ? components.toString()+',': components.length == 0 ? '': components.toString()+','}${labels.length > 0 ? labels.toString():''}\n`;
    issues.forEach(issue => {
        csvResponse += `${issue.key},${issue.summary.replace(/,/gi, '_')},${issue.partners.length == 0 ? '': issue.partners.toString()+','}${issue.environment},${issue.platform},${issue.category},${issue.id},${issue.issuetype},${issue.project},${issue.status},${issue.priority},${issue.assignee},${issue.reporter},${issue.creator},${issue.created},${issue.updated},${issue.lastViewed},${issue.components.length > 1 ? issue.components.toString()+',': issue.components.length == 0 ? '': issue.components.toString()+','}${issue.labels.length > 1 ? issue.labels.toString(): issue.labels.length == 0 ? '': issue.labels.toString()}\n`;
    });
    return csvResponse;
}
