const timestampFormat = "DD MMM YYYY HH:mm"

class OrgaLog {

    constructor() {
        this._date_range = undefined;
        this._date_field = undefined;
        this._value_range = undefined;
        this._data = [];
        this._data_index = [];
        this._date_fields = [];
        this._deduped = false;
        this._columns = [];
    }

    static version() { return "0.1" }

    process(data, deduplicate) {

        let self = this;
        if (data.columns !== undefined) { this._columns = data.columns }

        var stime = Date.now();
        if (deduplicate) {
            var unique = {};
            data.forEach(function(x) {
                let rowhash = JSON.stringify(x).hashCode();
                if (!unique[rowhash]) {
                    self._data.push(x);
                    unique[rowhash] = true;
                }
            });
            unique = undefined;
            self._data.columns = self._columns;
            self._deduped = true;
        } else {
            self._data = data;
        }
        console.log('DEDUPE: ', Date.now() - stime);

        // find the date field
        console.log('TODO: if the field has been specificed but isnt in the data, thrown an error');
        self._date_fields = get_date_fields(data);
        if (self._date_field === undefined) {
            if (self.date_fields.length > 0) {
                self._date_field = self._date_fields[0];
            } else {
                throw ("No columns contain a known date format")
            }
        } else if (!self._date_fields.includes(self._date_field)) {
            throw ("No columns contain a known date format")
        }
        console.log('DEBUG: using ', self._date_field, ' as data column');

        const date_field = self._date_field;
        // sort by the date field
        self._data = self._data.sort(function compare(a, b) {
            return new Date(a[date_field]) - new Date(b[date_field]);
        });

        let interval = get_interval(self._data[0][date_field], self._data[self._data.length - 1][date_field]);
        var simplified = self._data.map(function(value) {
            return ({ timestamp: interval.floor(new Date(value[date_field])).getTime(), value: 1 })
        });

        // bin the events by timestamps
        var eventCount = d3.nest()
            .key(function(d) { return d.timestamp; })
            .rollup(function(v) { return v.length; })
            .entries(simplified);

        var stime = Date.now();
        // rename the 'key' field to be 'timestamp' (changed by the nest function above)
        eventCount = eventCount.map(function(value) {
            return ({
                timestamp: Number(value['key']), // this feels like a hack, why is this a string?
                value: value['value']
            })
        });
        console.log('MAP: ', Date.now() - stime);

        // sort the data by the timestamps
        self._data_index = eventCount.sort(function compare(a, b) {
            return a.timestamp - b.timestamp;
        });

        var min_date = d3.min(self._data_index, function(d) {
            return d.timestamp;
        });
        var max_date = d3.max(self._data_index, function(d) {
            return d.timestamp;
        });
        self._date_range = [new Date(min_date), new Date(max_date)];

        var max_value = d3.max(self._data_index, function(d) {
            return d.value;
        });
        var min_value = d3.min(self._data_index, function(d) {
            return d.value;
        });
        self._value_range = [min_value, max_value];
    }

    // expose this data so it can be user selected
    get date_field() { return this._date_field }
    set date_field(value) {
        this._date_field = value;
        this._process(this._data);
    }
    get date_fields() { return this._date_fields }

    // range of dates from the data set
    get date_range() {
            return this._date_range;
        }
        // range of values from the data set 
    get value_range() { return this._value_range }
    get data() { return this._data }
        //get data_index() { return this._data_index }

    // this limits the range, applies filters and orders entries
    // the data is not affected, it returns indices to the data
    view(range, filters, order) {
        let self = this;

        if (range === undefined) { range = this._date_range }
        if (filters === undefined) { filters = [] }
        if (order === undefined) { order = this._date_field }
        // apply range and filters, 

        // sort by field
        // reverse if the fist character is '-' (ascii 45)
        let modifier = 1;
        if (order.charCodeAt[0] = 45) { modifier = -1 }


        return this._data_index;
    }
}

function is_date(sDate) {
    if (sDate.toString() == parseInt(sDate).toString()) return false;
    var tryDate = new Date(sDate);
    var m = moment(sDate, ['YYYY-MM-DD', 'YYYYMMDD', 'DD/MM/YYYY', moment.ISO_8601, 'L', 'LL', 'LLL', 'LLLL'], true);
    return (tryDate && tryDate.toString() != "NaN" && tryDate != "Invalid Date" && m.isValid());
}

// find all of the fields that appear to have dates in them
function get_date_fields(data) {
    console.log('TODO: check the first five rows')
    var date_fields = [];
    var num_columns = data.columns.length;
    for (var h = 0; h < num_columns; h++) {
        var cell_value = data[0][data.columns[h]];
        if (is_date(cell_value)) {
            date_fields.push(data.columns[h]);
        }
    }
    console.log("DEBUG: get_date_fields found " + date_fields.length + " date fields", date_fields)
    return date_fields;
}

// slightly faster than the copy from Stack Overflow, but still slow 
// about 2x faster than MD5, but this has more clashes
String.prototype.hashCode = function() {
    let hash = 0
    for (var i = this.length, chr; i > 0; i--) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}

function get_interval(date1, date2) {
    let difference = Math.abs(Date.parse(date2) - Date.parse(date1));
    const time_formats = [
        [1000, 'milliseconds', d3.timeMillisecond], // 1
        [60000, 'milliseconds', d3.timeMillisecond], // 60
        [3600000, 'seconds', d3.timeSecond], // 60*60
        [86400000, 'minutes', d3.timeMinute], // 60*60*24
        [604800000, 'hours', d3.timeHour], // 60*60*24*7
        [2629800000, 'days', d3.timeDay], // 60*60*24*30.4375
        [31557600000, 'weeks', d3.timeWeek], // 60*60*24*365.25
        [3155760000000, 'months', d3.timeMonth], // 60*60*24*365.25*100
        [31557600000000, 'years', d3.timeYear] // 60*60*24*365.25*100*10
    ];

    var i = 0;
    let format;
    while (format = time_formats[i++]) {
        if (difference < format[0]) {
            console.log('DEBUG: interval units:', format[1]);
            return format[2]
        }
    }
    throw new error("Dates too far apart");
}