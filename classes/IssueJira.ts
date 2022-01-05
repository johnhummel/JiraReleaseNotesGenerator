export class IssueJira {
    key:string;
    partnerSummary: string;
    partnerDescription: string;
    category:string;
    issuetype:string;
    platform:string;
    partners: string[];
    project: string;
    upcoming?: boolean;

    constructor(issue) {
        if(issue) {
            this.key = issue.key;
            this.partnerDescription = issue.fields.customfield_10043 ? this.GetPartnerDescription(issue.fields.customfield_10043.content):'None';
            this.partnerSummary = issue.fields.customfield_10042 ? issue.fields.customfield_10042:'None';
            this.category = issue.fields.customfield_10047 ? issue.fields.customfield_10047.value:['None'];
            this.issuetype = issue.fields.issuetype.name;
            this.platform = issue.fields.customfield_10046 ? issue.fields.customfield_10046.value:['None'];
            this.partners = issue.fields.customfield_10044 ? issue.fields.customfield_10044.map(partner => partner.value):['None'];
            this.project = issue.fields.project.key;
            //if upcoming is included, give it the value.  Otherwise, it's false.
            this.upcoming = issue.upcoming ? issue.upcoming : false;
        }
    }

    GetPartnerDescription(partnerDescription):string{
    
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
}