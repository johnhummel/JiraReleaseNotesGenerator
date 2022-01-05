import keys from './config/keys.json';
import {Issues} from './classes/Issues';
import * as fs from 'fs-extra';

let labels:string[] = ['PROD-01DEC20','PROD-03DEC20','PROD-10DEC20','PROD-31DEC20'];

let partners:string[][] = [
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

// partners = [
//     [
//         'All'
//     ]
// ];

let projects = [
    [
        'COM','BEN'
    ],
    [
        'COM','TS'
    ]
];

// let projects = [
//     [
//         'COM','TS'
//     ]
// ];

// let getHiredReleaseNotes = new Issues(keys, partners);
let getHiredReleaseNotes = new Issues(keys, projects, partners);
// console.log(`labels in (${labels.toString()})`)




SaveReleaseNotes(labels);

function SaveReleaseNotes(releaseLabels, releasePartners?:string[][]) {
    // console.log(`We have items?`);
    getHiredReleaseNotes.fetchIssues(releaseLabels)
    // .then(issues => {
    //     issues.splice(-5).forEach(issue => {
    //         console.log(`Issue Key: ${issue.key}`);
    //         console.log(`Issue Partners: ${issue.partners.toString()}`);
    //         console.log(`Issue Partner Summary: ${issue.partnerSummary}`);
    //     })
    // })
    .then(issues => getHiredReleaseNotes.fetchUpcomingIssues())
    .then(issues => {
        // issues = getHiredReleaseNotes.issues;
        console.log(`Total Issues: ${issues.length}`);
        issues.forEach(issue => {
            console.log(issue.key)
            console.log(issue.partnerSummary);
        });

        return getHiredReleaseNotes.GetReleaseNotesDocuments();
    })
    .then(releaseNotes => {
        releaseNotes.forEach(release => {
            // console.log(`Release: ${release.title}`);
            // console.log(`Release File: ${release.releaseNotes}`);
            fs.outputFile(`./data/releasenotes/${release.title}.html`, `
                <html><body>${release.releaseNotes}</body></html>
                `.trim(), err => {
                if(err) {
                    console.log(`Outfile issue: ${err}`);
                }
            });
        })
    })

}
