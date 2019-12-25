// ,

class OrgaLog {

    constructor() {
        this._date_range = undefined;
        this._time_field = undefined;
        this._value_range = undefined;
        this._full_data = [];
    }

    static version() { return "0.0" }

    // from another OrgaLog instance, a file or an array
    acquire(source) {
        this.acquire_file(source);
//        if (arguments.length == 1) { return arguments[0] }
//        else if (arguments.length == 2) { return [arguments[0], arguments[1]] }
    }

    acquire_file(filename) {
        console.log(filename);
        d3.csv(filename).then(function(data) {
            console.log(data);
            interpret(data);
        });
    }

    interpret(data) {
        this._full_data = data;
        console.log(getTimefield(this._full_data))
    }

abc() {
    d3.csv(filename).then(function (rawdata) {
        // TODO: work out the range and then change the timestamp format accordingly
        var time_field = getTimefield(rawdata);

        // TODO: this is slow - would map() do this faster?
        for (var i = 0; i < rawdata.length; i++) {
            data.push({
                timestamp: moment(rawdata[i][time_field]).format(timestampFormat), // <- timestamp format will change depending on grouping sizes
                value: 1
            });
        }


        var eventCount = d3.nest()
            .key(function (d) { return d.timestamp; })
            .rollup(function (v) { return v.length; })
            .entries(data);
        for (var i = 0; i < eventCount.length; i++) {
            eventCount[i].timestamp = new Date(eventCount[i]['key']);
            delete eventCount[i].key;
        }
        data = eventCount.sort(function compare(a, b) {
            if (new Date(a.timestamp) < new Date(b.timestamp)) {
                return -1;
            }
            if (new Date(b.timestamp) < new Date(a.timestamp)) {
                return 1;
            }
            return 0;
        })

        min_date = d3.min(data, function (d) {
            return new Date(d.timestamp);
        });
        max_date = d3.max(data, function (d) {
            return new Date(d.timestamp);
        });
        max_value = d3.max(data, function (d) {
            return d.value;
        });
    })
    }
//
get time_field() { return this._time_field }
set time_field(value) {
    console.log('TODO: rebuild timestamp index')
    this._time_field = value;
}

// range of dates from the data set
get date_range() { return this._date_range }
// range of values from the data set 
get value_range() { return this._value_range }
//
get full_data() { return this._full_data }
}


function isDate(sDate) {
    if (sDate.toString() == parseInt(sDate).toString()) return false;
    var tryDate = new Date(sDate);
    var m = moment(sDate, ['YYYY-MM-DD', 'YYYYMMDD', 'DD/MM/YYYY', moment.ISO_8601, 'L', 'LL', 'LLL', 'LLLL'], true);
    return (tryDate && tryDate.toString() != "NaN" && tryDate != "Invalid Date" && m.isValid());
}

function getTimefield(data) {
    for (var h = 0; h < data.columns.length; h++) {
        var cell_value = data[0][data.columns[h]];
        if (isDate(cell_value)) {
            return data.columns[h];
        }
    }
    throw "No date field found"
}