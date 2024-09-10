const reduce = record => {
    if (record !== null) {
        return record.map(x => x.name);
    } else {
        return [];
    }
}

// CODE START ///////////////////////////////////////////////////////////////

const table = base.getTable('Authors');
const res = await table.selectRecordsAsync({
    fields: ["Name",  "Patrons", "Patron Snapshot"],
    sorts:  [{field: "ID"}],
});

let digest = "";
for (let record of res.records) {
    const patrons   = reduce(record.getCellValue("Patrons"));
    const patrons0  = reduce(record.getCellValue("Patron Snapshot"));
    const diffGain  = patrons.filter(x => ! patrons0.includes(x));
    const diffLoss  = patrons0.filter(x => ! patrons.includes(x));
    if (diffLoss.length + diffGain.length !== 0) {
        // do updateRecordAsync
        await table.updateRecordAsync(record, {"Patron Snapshot": record.getCellValue("Patrons")});
    }
}