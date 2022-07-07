module.exports = (startDate, endDate, startTime, endTime) => {
    // add one hour to the time hour to account for daylight savings
    const startHour = startTime.split(':')[0];
    const startMinute = startTime.split(':')[1];
    startTime = startHour+ ':' + startMinute;
    const sda = startDate.split('-');
    const startTimeArray = [Number(sda[0]), Number(sda[1])-1, Number(sda[2]), Number(startHour)+1, Number(startMinute), 0];

    const endHour = endTime.split(':')[0];
    const endMinute = endTime.split(':')[1];
    endTime = endHour+ ':' + endMinute;
    const eda = endDate.split('-');
    const endtTimeArray = [Number(eda[0]), Number(eda[1])-1, Number(eda[2]), Number(endHour)+1, Number(endMinute), 0];

    let start = new Date(...startTimeArray);
    let end = new Date(...endtTimeArray);
    // logic to flip time based on which one is greater
    if (start > end) {
        const hold = start;
        start = end;
        end = hold;
    }
    return {start, end};
}
