const timestampFormat = "DD MMM YYYY HH:mm"

class OrgaLog {

    constructor() {

        try {
            if (moment === undefined) { throw ('Missing Library: moment.js') }
        } catch (error) {
            console.error(error);
            throw ('Missing Library: moment.js')
        }

        try {
            if (d3 === undefined) { throw ('Missing Library: d3.js') }
        } catch (error) {
            console.error(error);
            throw ('Missing Library: d3.js')
        }

        this._date_range = undefined;
        this._date_field = undefined;
        this._value_range = undefined;
        this._data = [];
        this._data_index = [];
        this._date_fields = [];
    }

    static version() { return "0.0" }

    process(data) {
        // persist the full data, clone it to prevent problems if the original dataset changes
        this._data = data;

        // find the date field
        console.log('TODO: if the field has been specificed but isnt in the data, thrown an error');
        this._date_fields = get_date_fields(this._data);
        if (this._date_field === undefined) {
            if (this.date_fields.length > 0) {
                this._date_field = this._date_fields[0];
            } else {
                throw ("No columns contain a known date format")
            }
        } else if (!this._date_fields.includes(this._date_field)) {
            throw ("No columns contain a known date format")
        }
        console.log('DEBUG: using ', this._date_field, ' as data column');

        console.log('TODO: this is slow - would map() do this faster?');
        var simplified = []
        for (var i = 0; i < this._data.length; i++) {
            simplified.push({
                timestamp: moment(this._data[i][this._date_field]).format(timestampFormat),
                value: 1
            });
        }

        // bin the events by timestamps
        var eventCount = d3.nest()
            .key(function(d) { return d.timestamp; })
            .rollup(function(v) { return v.length; })
            .entries(simplified);

        console.log(eventCount);

        console.log('TODO: see if theres anything that can be done to limit the number of new Date() calls needed');
        // rename the 'key' field to be 'timestamp' (changed by the nest function above)
        for (var i = 0; i < eventCount.length; i++) {
            eventCount[i].timestamp = new Date(eventCount[i]['key']);
            delete eventCount[i].key;
        }

        // sort the data by the timestamps
        this._data_index = eventCount.sort(function compare(a, b) {
            //if (a.Display < b.Display) { return -1; } return 1;
            if (new Date(a.timestamp) < new Date(b.timestamp)) {
                return -1;
            }
            if (new Date(b.timestamp) < new Date(a.timestamp)) {
                return 1;
            }
            return 0;
        })

        var min_date = d3.min(this._data_index, function(d) {
            return new Date(d.timestamp);
        });
        var max_date = d3.max(this._data_index, function(d) {
            return new Date(d.timestamp);
        });
        this._date_range = [min_date, max_date];

        var max_value = d3.max(this._data_index, function(d) {
            return d.value;
        });
        var min_value = d3.min(this._data_index, function(d) {
            return d.value;
        });
        this._value_range = [min_value, max_value];
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
            console.log('date_range:', this._date_range);
            return this._date_range;
        }
        // range of values from the data set 
    get value_range() { return this._value_range }
        //
    get data() { return this._data }
    get data_index() { return this._data_index }

    view() {
        var olv = new OrgaLogView(this);
        return olv;
    }
}

class OrgaLogView {
    constructor() {}

    dedupe() {
        console.log('dedupe()');
        var response = Object.create(this);

        // do action on 'response.data'
        return response;
    }

    range(min, max) {
        console.log('range (', min, ', ', max, ')');
        var response = Object.create(this);
        // do action on 'response.data'
        return response;
    }

    filter(filters) {
        console.log('filter (filters)');
        var response = Object.create(this);
        // do action on 'response.data'
        return response;
    }

    sort(field, direction) {
        console.log('sort (', field, ',', direction, ')');
        var response = Object.create(this);
        // do action on 'response.data'
        return response;
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