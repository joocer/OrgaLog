// ,

// TODO - select the timestamp format based on the range
var timestampFormat = "DD MMM YYYY HH:mm:ss"

class OrgaLog {

    constructor() {
        this._date_range = undefined;
        this._time_field = undefined;
        this._value_range = undefined;
        this._full_data = [];
        this._data_index = [];
    }

    static version() { return "0.0" }

    // from another OrgaLog instance, a file or an array
    acquire(source, callback) {
        console.log('TODO: detect the source type')
        this.acquire_file(source, callback);
        //        if (arguments.length == 1) { return arguments[0] }
        //        else if (arguments.length == 2) { return [arguments[0], arguments[1]] }
    }

    acquire_file(filename, callback) {
        let self = this;
        d3.csv(filename).then(function (data) {
            self._process(data);
            if (callback !== undefined) {
                callback();
            }
        });
    }

    _process(data) {

        // persist the full data
        this._full_data = data;

        // find the date field
        console.log('TODO: if the field has been specificed but isnt in the data, thrown an error');
        if (this._time_field !== undefined) {
            this._time_field = getTimefield(this._full_data);
        }

        // TODO: this is slow - would map() do this faster?
        // TODO: Change the timestamp format depending on grouping sizes
        var simplified = []
        for (var i = 0; i < this._full_data.length; i++) {
            simplified.push({
                timestamp: moment(this._full_data[i][this._time_field]).format(timestampFormat),
                value: 1
            });
        }

        // bin the events by timestamps
        var eventCount = d3.nest()
            .key(function (d) { return d.timestamp; })
            .rollup(function (v) { return v.length; })
            .entries(simplified);

        // rename the 'key' field to be 'timestamp'
        for (var i = 0; i < eventCount.length; i++) {
            eventCount[i].timestamp = new Date(eventCount[i]['key']);
            delete eventCount[i].key;
        }

        //
        this._data_index = eventCount.sort(function compare(a, b) {
            if (new Date(a.timestamp) < new Date(b.timestamp)) {
                return -1;
            }
            if (new Date(b.timestamp) < new Date(a.timestamp)) {
                return 1;
            }
            return 0;
        })

        var min_date = d3.min(this._data_index, function (d) {
            return new Date(d.timestamp);
        });
        var max_date = d3.max(this._data_index, function (d) {
            return new Date(d.timestamp);
        });
        this._date_range = [min_date, max_date];

        var max_value = d3.max(this._data_index, function (d) {
            return d.value;
        });
        var min_value = d3.min(this._data_index, function (d) {
            return d.value;
        });
        this._value_range = [min_value, max_value];
    }

    range(min, max) {
        console.log('range (', min, ', ', max, ')');
        return this;
    }

    filter(filters) {
        console.log('filter (filters)');
        return this;
    }

    sort(field, direction) {
        console.log('sort (', field, ',', direction, ')');
        return this;
    }


    //
    get time_field() { return this._time_field }
    set time_field(value) {
        this._time_field = value;
        this._process(this._full_data);
    }

    // range of dates from the data set
    get date_range() { return this._date_range }
    // range of values from the data set 
    get value_range() { return this._value_range }
    //
    get full_data() { return this._full_data }
    get index() { return this._data_index }
}


function isDate(sDate) {
    if (sDate.toString() == parseInt(sDate).toString()) return false;
    var tryDate = new Date(sDate);
    var m = moment(sDate, ['YYYY-MM-DD', 'YYYYMMDD', 'DD/MM/YYYY', moment.ISO_8601, 'L', 'LL', 'LLL', 'LLLL'], true);
    return (tryDate && tryDate.toString() != "NaN" && tryDate != "Invalid Date" && m.isValid());
}

function getTimefield(data) {
    var num_columns = data.columns.length;
    for (var h = 0; h < num_columns; h++) {
        var cell_value = data[0][data.columns[h]];
        if (isDate(cell_value)) {
            return data.columns[h];
        }
    }
    throw "No date field found"
}