//-------------------------------------
//load google charts library
google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    // get arduino id
    currentChartId = document.getElementById("chart-idinput").value;

    // create data table with initial headers
    var data = new google.visualization.DataTable();
    data.addColumn('timeofday', 'Time');
    //set name for the legend
    data.addColumn('number', 'Arduino ' + currentChartId);

    // create line chart
    var chart = new google.visualization.LineChart(document.getElementById('realtime-chart'));

    // fetch and update data
    fetch(`/chartdata?arduino_id=${currentChartId}`)
        .then(response => response.json())
        .then(jsonData => {
            // clear existing data
            data.removeRows(0, data.getNumberOfRows());

            // add new data points
            jsonData.forEach(entry => {
                var timeParts = entry.time.split(':').map(Number);
                data.addRow([[timeParts[0], timeParts[1], timeParts[2]], entry.sensor_value]);
            });

            // draw the updated chart
            chart.draw(data, {
                hAxis: {
                    title: 'Time (hh:mm:ss)',
                    format: 'HH:mm:ss',
                },
                vAxis: {
                    title: 'Sensor Values (V)'
                }
            });
        });

}