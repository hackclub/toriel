const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN }).base(process.env.AIRTABLE_API_BASE);
module.exports = {
    createInviteRecord: function ({
        email,
        name,
        reason,
        continent,
        ip = '0.0.0.0',
        teen = true,
        invitee
    }) {
        base('Join Requests').create([
            {
                "fields": {
                    "Full Name": name,
                    "Email Address": email,
                    "Minor": teen,
                    "Reason": reason,
                    "Denied": false,
                    "IP": ip,
                    "Referred by": invitee || "Unknown WA",
                    "Notes": `Invited using /toriel-invite by ${invitee}`,
                    "Continent":continent
                }
            }
        ], function (err, records) {
            if (err) {
                console.error(err);
                return;
            }
            records.forEach(function (record) {
                console.log(record.getId());
            });
        });
    }
}