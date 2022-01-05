import {IssueJira} from './IssueJira';
import fetch from 'node-fetch';


export class Issues {
    
    
    jiraSite:string;
    username:string;
    password:string;
    issues:IssueJira[];
    projects:string[][]; 
    partnersList:string[][];

    constructor(keys, projects?:string[][], partners?:string[][]) {
        this.jiraSite = keys.jiraSite;
        this.username = keys.username;
        this.password = keys.password;
        this.issues = [];
        if(partners === undefined) {
            this.partnersList = [
                [
                    'All'
                ],
                [
                    'All', 'ClockRite', 'TimePro'
                ],
                [
                    'All','Heartland'
                ],
                [
                    'All','DeluxeCA','DeluxeUSA'
                ],
                [
                    'All','PayEntry'
                ]
            ];
        }
        else {
            this.partnersList = partners;
        }
        if(projects === undefined) {
            this.projects = [
                [
                    'COM','TS'
                ],
                [
                    'COM','BEN'
                ]
            ]
        }
        else {
            this.projects = projects;
        }
        
    }

    /**
     * 
     * @param jql Used to build the Jira search query.  If it's a string, use it directly.  If an array, assume it's an array of labels and use
     * it to build the search string.  Don't worry about whether it's properly formatted, that's on the user calling it.
     */
    fetchIssues(jql:string|Array<string>):Promise<IssueJira[]> {
        this.issues.length = 0;
        let jqlString:string = '';
        if(Array.isArray(jql)) {
            //this is an array of *labels*.
            jqlString = `labels in (${jql.toString()}) and cf[10045] = Production`;
            // console.log(`Using array: ${jqlString}`);
        }
        else 
            jqlString = jql;
        //now get the issues
        
        let body = {
            jql: jqlString,
            fieldsByKeys: true,
            maxResults: 1000,
            fields: [
                "status"
            ]
        };
        // console.log(`URL: ${this.jiraSite}/rest/api/3/search`);
        // console.log(`JQL: ${jqlString}`);
        // console.log(`body: ${JSON.stringify(body)}`);
        return fetch(`${this.jiraSite}/rest/api/3/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(this.username+':'+this.password
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(json => {
            let pages:number = Math.floor(json.total / 100);
            var bodies:any[] = [];
            console.log(`Pages: ${pages}`);
            while(pages > -1) {
                bodies.push({
                    jql: jqlString,
                    fieldsByKeys: true,
                    maxResults: 1000,
                    fields: [
                        "customfield_10042",
                        "customfield_10043",
                        "customfield_10047",
                        "issuetype",
                        "customfield_10046",
                        "customfield_10044",
                        "project"
                    ],
                    startAt: (pages-- * 100)
                })
            }
            // console.log(`Bodies: ${JSON.stringify(bodies)}`);
            return Promise.all(bodies.flatMap(issueBody => this.fetchIssue(issueBody)))
            .then(issuesArray => {return issuesArray.flat(1)});
            // this.fetchIssue(bodies[0]);
            // return bodies;
        })
        .then(issues => {
            // console.log(`issues: ${JSON.stringify(issues.flat())}`);
            // issues.forEach(issue => {
            //     console.log(`Issue Project: ${issue.fields.project.key}`);
            // })
            issues.forEach(issue => this.issues.push(new IssueJira(issue)));
            return this.issues;
            
        })
        .catch(error => {
            console.log(`fetchIssues: ${error}`);
        });
    }

    /**
     * 
     * @param jql Used to build the Jira search query.  If it's a string, use it directly.  If an array, assume it's an array of labels and use
     * it to build the search string.  Don't worry about whether it's properly formatted, that's on the user calling it.
     */
    fetchUpcomingIssues():Promise<IssueJira[]> {
        // this.issues.length = 0;
        let jqlString:string = `fixVersion = 'Upcoming Release'`;
        //we only care about the upcoming releases here
        // if(Array.isArray(jql)) {
        //     //this is an array of *labels*.
        //     jqlString = `fixVersion = 'Upcoming Release'`;
        //     // console.log(`Using array: ${jqlString}`);
        // }
        // else 
        //     jqlString = jql;
        //now get the issues
        
        let body = {
            jql: jqlString,
            fieldsByKeys: true,
            maxResults: 1000,
            fields: [
                "status"
            ]
        };
        // console.log(`URL: ${this.jiraSite}/rest/api/3/search`);
        // console.log(`JQL: ${jqlString}`);
        // console.log(`body: ${JSON.stringify(body)}`);
        return fetch(`${this.jiraSite}/rest/api/3/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(this.username+':'+this.password
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(json => {
            let pages:number = Math.floor(json.total / 100);
            var bodies:any[] = [];
            console.log(`Pages: ${pages}`);
            while(pages > -1) {
                bodies.push({
                    jql: jqlString,
                    fieldsByKeys: true,
                    maxResults: 1000,
                    fields: [
                        "customfield_10042",
                        "customfield_10043",
                        "customfield_10047",
                        "issuetype",
                        "customfield_10046",
                        "customfield_10044",
                        "project"
                    ],
                    startAt: (pages-- * 100)
                })
            }
            // console.log(`Bodies: ${JSON.stringify(bodies)}`);
            return Promise.all(bodies.flatMap(issueBody => this.fetchIssue(issueBody)))
            .then(issuesArray => {return issuesArray.flat(1)});
            // this.fetchIssue(bodies[0]);
            // return bodies;
        })
        .then(issues => {
            // console.log(`issues: ${JSON.stringify(issues.flat())}`);
            // issues.forEach(issue => {
            //     console.log(`Issue Project: ${issue.fields.project.key}`);
            // })
            issues.forEach(issue => this.issues.push(new IssueJira({...issue, upcoming: true})));
            return this.issues;
            
        })
        .catch(error => {
            console.log(`fetchIssues: ${error}`);
        });
    }

    fetchIssue(body):Promise<IssueJira> {
        // console.log(`Starting FetchIssue.`);
        // console.log(`Jira: ${this.jiraSite}/rest/api/3/search`);
        // console.log(`Body: ${JSON.stringify(body)}`)

        return fetch(`${this.jiraSite}/rest/api/3/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(this.username+':'+this.password
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(json => {
            // console.log(`JSON: ${JSON.stringify(json)}`);

            return json.issues;
            
        });
    }

    equalarray(as:string[], bs:string[]) {
        //compare two string arrays
        //if the length aren't equal, they aren't equal
        // if (as.length !== bs.length) 
        //     return false;
        //loop through the first array.  If there's any elements that aren't in the second, they aren't equal.
        as.forEach(a => {
            if(bs.indexOf(a) == -1)
                return false;
        });
        return true;
    }

    /**
     * Return of the release notes based on:
     *      The Project
     *      The Issue Type (not-bugs, bugs)
     *      the Partner array
     */
    GetReleaseNotesDocuments():{ title: string, releaseNotes: string }[] {
        let releaseNotes:{ title: string, releaseNotes: string }[] = [];
        this.partnersList.forEach(partners => {
            //get the issues related to the Partners
            // let partnerIssues:IssueJira[] = this.issues.filter(issue => {
            //     if(this.eqSet(issue.partners, partners)) {
            //         return issue;
            //     }
            // });
            let partnerIssues:IssueJira[] = this.issues.filter(issue => {
                if(partners.some(partner => issue.partners.indexOf(partner) != -1))
                {
                    return issue;
                }
            });
            if(partnerIssues.length != 0) {
                // issue.partners.some(partner => partners.includes(partner)));
                //we have the issues that are just for this partner list.  Now get the projects.
            this.projects.forEach(projectList => {
                let projectIssues:IssueJira[] = partnerIssues.filter(issue => projectList.indexOf(issue.project) != -1);
                releaseNotes.push({
                    title: `${partners.join('_')}_${projectList.join('_')}`,
                    releaseNotes: this.CreateReleaseNotes(projectIssues, projectList, partners)
                });
            });
            }
        })
        return releaseNotes;
    }

    CreateReleaseNotes(issues:IssueJira[], projects:string[], partners:string[], displayPartners:boolean = false):string {
        //now split them up by type: Bugs and Non Bugs

        let issueImprovements:IssueJira[] = issues.filter(issue => {
            if(issue.issuetype !== 'Bug' && issue.upcoming !== true) {
                return issue;
            }
        });

        let issueBugs:IssueJira[] = issues.filter(issue => {
            if(issue.issuetype === 'Bug') {
                return issue;
            }
        });

        let issueUpcoming:IssueJira[] = issues.filter(issue => {
            if(issue.upcoming === true) {
                return issue;
            }
        })

        return `
            <h1>Release Notes for ${projects.join('_')} ${partners.join('_')}</h1>
            ${this.DisplayCategory(issueImprovements)}
            ${this.DisplayBugs(issueBugs)}
            ${this.DisplayUpcoming(issueUpcoming)}
        `.trim();
    }

    DisplayUpcoming(issues:IssueJira[], displayPartners:boolean = false):string {
        let platforms:Set<string> = new Set(issues.map(issue => issue.platform));
        //get the categories from this release
        // console.log(`Bugs: ${issues.length}`);
        let returnString = '';
        if(issues.length > 0)
        {
            returnString += `
                <h2>Upcoming Releases</h2>
                <p>Releases expected to be released within the next 30 days</p>
            `.trim();
            platforms.forEach(platform => {
                let platformIssues = issues.filter(issue => {
                    if(issue.platform === platform) {
                        return issue;
                    }
                });
                if(platformIssues.length != 0) {
                    returnString += `
                        <h3>${platform}</h3>
                        <table border="1" width="100%">
                        <tr>
                        <th style="background-color:#b8cce5;width:33%">Feature / Functionality</th>
                        <th style="background-color:#b8cce5;width:auto">Description</th>
                        ${displayPartners ? `<th style="background-color:#b8cce5;width:33%">Partners</th>` : ''}
                        </tr>
                    `.trim();
                    platformIssues.forEach(issue => {
                        returnString += `
                            <tr>
                            <td>${issue.partnerSummary}</td>
                            <td>${issue.partnerDescription}</td>
                            ${displayPartners ? `<td>${issue.partners.toString()}</td>` : ''}
                            </tr>
                        `.trim();
                    });
                    returnString += `
                        </table>
                    `.trim();
                }                    
            });
        }
        return returnString;
    }

    DisplayBugs(issues:IssueJira[], displayPartners:boolean = false):string {
        let platforms:Set<string> = new Set(issues.map(issue => issue.platform));
        //get the categories from this release
        // console.log(`Bugs: ${issues.length}`);
        let returnString = '';
        if(issues.length > 0)
        {
            returnString += `
                <h2>Bug Fixes</h2>
            `.trim();
            platforms.forEach(platform => {
                let platformIssues = issues.filter(issue => {
                    if(issue.platform === platform) {
                        return issue;
                    }
                });
                if(platformIssues.length != 0) {
                    returnString += `
                        <h3>${platform}</h3>
                        <table border="1" width="100%">
                        <tr>
                        <th style="background-color:#b8cce5;width:33%">Feature / Functionality</th>
                        <th style="background-color:#b8cce5;width:auto">Description</th>
                        ${displayPartners ? `<th style="background-color:#b8cce5;width:33%">Partners</th>` : ''}
                        </tr>
                    `.trim();
                    platformIssues.forEach(issue => {
                        returnString += `
                            <tr>
                            <td>${issue.partnerSummary}</td>
                            <td>${issue.partnerDescription}</td>
                            ${displayPartners ? `<td>${issue.partners.toString()}</td>` : ''}
                            </tr>
                        `.trim();
                    });
                    returnString += `
                        </table>
                    `.trim();
                }                    
            });
        }
        return returnString;
    }
    
    DisplayCategory(issues:IssueJira[], displayPartners:boolean = false) {
        let platforms:Set<string> = new Set(issues.map(issue => issue.platform));
        let categories:Set<string> = new Set(issues.map(issue => issue.category));

        let returnString = '';
        
        if(issues.length != 0) {
            
            platforms.forEach(platform => {
                let platformIssues:IssueJira[] = issues.filter(issue => {
                    if(issue.platform === platform)
                        return issue;
                });
                if(platformIssues.length > 0) {
                    returnString += `
                        <h2>Features and Enhancements: ${platform}</h2>
                    `.trim();
                    categories.forEach(category => {
                        let categoryIssues:IssueJira[] = platformIssues.filter(issue => {
                            if(issue.category === category)
                                return issue;
                        });
                        if(categoryIssues.length != 0) {
                            returnString += `
                                <h3>${category}</h3>
                                <table border="1" width="100%">
                                <tr>
                                <th style="background-color:#b8cce5;width:33%">Feature / Functionality</th>
                                <th style="background-color:#b8cce5;width:auto">Description</th>
                                ${displayPartners ? `<th style="background-color:#b8cce5;width:33%">Partners</th>` : ''}
                                </tr>
                            `.trim();
                            categoryIssues.forEach(issue => {
                                returnString += `
                                    <tr>
                                    <td>${issue.partnerSummary}</td>
                                    <td>${issue.partnerDescription}</td>
                                    ${displayPartners ? `<td>${issue.partners.toString()}</td>`: ''}
                                    </tr>
                                `.trim()
                            });
                            returnString += `
                                </table>
                            `.trim();
                        }
                    });
                    
                }
            });

        }
        return returnString;
    }

}