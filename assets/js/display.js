var height = 150;
var width = window.innerWidth;
var margin = {
    top: 20,
    right: 25,
    bottom: 25,
    left: 50
};
width = width - margin.left - margin.right - 25;
height = height - margin.top - margin.bottom;

var page_size = 25;

function display_initial(ol) {
    var x_scale = d3.scaleTime().range([0, width]);
    x_scale.domain(ol.date_range);

    var svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var y_scale = d3.scaleLinear()
        .domain([0, d3.max(ol.view(), function(d) {
            return +d.value;
        })])
        .range([height, 0]);

    var x_axis = d3.axisBottom(x_scale);
    var y_axis = d3.axisLeft(y_scale);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(y_axis);

    svg.append("g")
        .append("path")
        .datum(ol.view())
        .attr("class", "line")
        .attr("d", d3.line()
            .x(function(d) {
                return x_scale(new Date(d.timestamp));
            })
            .y(function(d) {
                return y_scale(d.value);
            })
        )

    var brush = d3.brushX()
        .extent([
            [0, 0],
            [width, height]
        ])
        .on("start brush end", brushmoved);

    var gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    var brushResizePath = function(d) {
        var e = +(d.type == "e"),
            x = e ? 1 : -1,
            y = height / 2;
        return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
    }

    var handle = gBrush.selectAll(".handle--custom")
        .data([{
            type: "w"
        }, {
            type: "e"
        }])
        .enter().append("path")
        .attr("class", "handle--custom")
        .attr("stroke", "#000")
        .attr("cursor", "ew-resize")
        .attr("d", brushResizePath);

    function brushmoved() {
        var s = d3.event.selection;
        if (s == null) {
            handle.attr("display", "none");
        } else {
            var sx = s.map(x_scale.invert);
            handle.attr("display", null).attr("transform", function(d, i) {
                return "translate(" + [s[i], -height / 4] + ")";
            });
            document.getElementById("date-range").innerHTML = moment(sx[0]).format(timestampFormat) + " to " + moment(sx[1]).format(timestampFormat);
            var minCursor = range_search(ol.data, sx[0], ol.date_field);
            var maxCursor = range_search(ol.data, sx[1], ol.date_field);
            var matches = maxCursor - minCursor;
            document.getElementById("record-count").innerHTML = matches + " of " + (ol.data.length - 1) + " records";
            date_range_wrapper(sx);
        }
    }

    function filter_date_range(date_range) {
        var minCursor = range_search(ol.data, date_range[0], ol.date_field);
        var maxCursor = range_search(ol.data, date_range[1], ol.date_field);
        //console.log(minCursor, maxCursor)
        var matches = maxCursor - minCursor;
        var filtered = range(minCursor, maxCursor);

        document.getElementById("record-count").innerHTML = matches + " of " + (ol.data.length - 1) + " records";

        if (matches === 0) {
            document.getElementById("tabular-data").innerHTML = "";
            return false;
        }
        document.getElementById("tabular-data").innerHTML = renderTable(ol.data, filtered, 0);
    }

    gBrush.call(brush.move, ol.date_range.map(x_scale));

    // this wrapper puts a slight delay on updating the table, this smooths selecting
    var timer = undefined;

    function date_range_wrapper(date_range) {
        if (timer !== null) {
            window.clearTimeout(timer);
        }
        timer = window.setTimeout(function() {
            filter_date_range(date_range);
            delete timer;
            timer = undefined;
        }, 250);
    }
}

function range_search(values, value, date_field) {
    value = new Date(value);
    var mid;
    let start = 0;
    let end = values.length - 1;
    if (new Date(values[start][date_field]) == value) { return start; }
    if (new Date(values[end][date_field]) == value) { return end; }
    while (start <= end) {
        mid = Math.floor((start + end) / 2);
        var ts = new Date(values[mid][date_field]);
        if (ts == value) {
            return mid;
        } else if (ts < value)
            start = mid + 1;
        else
            end = mid - 1;
    }
    return mid;
}

function range(start, end) {
    const length = end - start;
    return Array.from({ length }, (_, i) => start + i);
}

function htmlEncode(str) {
    return str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#' + i.charCodeAt(0) + ';'
    });
}

// TODO: Sort fields
// TODO: show/hide fields
function renderTable(data, indexes, page) {
    var row_data = ''
    row_data += "<tr>"
    for (var h = 0; h < data.columns.length; h++) {
        row_data += "<th>" + htmlEncode(data.columns[h]) + "<th>"
    }
    row_data += "</tr>"
    var max_rows = page_size;
    if (indexes.length < max_rows) { max_rows = indexes.length; }
    for (var i = 0; i < max_rows; i++) {
        row_data += "<tr>";
        var index = i + (page * page_size);
        for (var h = 0; h < data.columns.length; h++) {
            var cell_value = data[indexes[index]][data.columns[h]];
            if (is_date(cell_value)) {
                row_data += "<td>" + moment(data[indexes[index]][data.columns[h]]).format(timestampFormat) + "<td>"
            } else {
                row_data += "<td>" + htmlEncode(data[indexes[index]][data.columns[h]]) + "<td>"
            }
        }
        row_data += "</tr>";
    }

    return "<table class='table table-striped table-sm'>" + row_data + "</table>";
}