const reduce = record => {
    if (record !== null) {
        return record.map(x => x.name);
    } else {
        return [];
    }
}

const signage = n => (n <=0 ? "" : "+") + n;

const patronTable = base.getTable('Patrons');
const patronRes = await patronTable.selectRecordsAsync({fields: ["Library Card #",  "Last Name", "First Name"]});
const nameLookup = async (barcode) => {
    const [record]  = patronRes.records.filter(record => record.name === barcode);
    const lastName  = record.getCellValue("Last Name");
    const firstName = record.getCellValue("First Name");
    return `${lastName}, ${firstName}`
}

// CODE START ///////////////////////////////////////////////////////////////

let shouldSend = true;

const table = base.getTable('Authors');
const res = await table.selectRecordsAsync({
    fields: ["Name",  "Record Set", "Patrons", "Patron Snapshot"],
    sorts:  [{field: "ID"}],
});

let digest = "";
for (let record of res.records) {
    const name      = record.getCellValue("Name");
    const recordSet = record.getCellValue("Record Set");
    const patrons   = reduce(record.getCellValue("Patrons"));
    const patrons0  = reduce(record.getCellValue("Patron Snapshot"));
    const diffGain  = patrons.filter(x => !patrons0.includes(x));
    const diffLoss  = patrons0.filter(x => !patrons.includes(x));
    const diffStr   = signage(diffGain.length - diffLoss.length);
    if (diffLoss.length + diffGain.length !== 0) {
        digest += `## [${name}](${recordSet})\n`;
        digest += `*${patrons.length} total ${patrons.length === 1 ? "patron" : "patrons"}, ${diffStr} since last digest*\n\n`;
        for (let patron of diffGain) {
            digest += `  \+ **${patron}** (${await nameLookup(patron)})\n`;
        }
        for (let patron of diffLoss) {
            digest += `  \- **${patron}** (${await nameLookup(patron)})\n`;
        }
        digest += "\n";
    }
}
if (digest === "") {
    shouldSend = false;
}

output.set('digest', digest);
output.set('shouldSend', shouldSend);