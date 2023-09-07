from flask import Flask, render_template, request, jsonify
import sqlite3
import requests
import time
from datetime import datetime, timedelta
import threading

app = Flask(__name__)

# set path to database file
db_path = "flask_app/data.db"

# arduino list
arduinos = [
    # {"id": 1, "ip": "xxx.xxx.x.xx"},
    # {"id": 2, "ip": "xxx.xxx.x.xx"},
    # {"id": 3, "ip": "xxx.xxx.x.xx"},
    # {"id": 4, "ip": "xxx.xxx.x.xx"},
]

# time before the same arduino is prompted for data again (large time to accumulate large data packet)
gap_seconds = 150


# establish database connection
def getDbConnection():
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


# -------------------------------Initialize Table--------------------------
# create the database table if it doesn't exist
def create_table():
    # establish connection
    connection = getDbConnection()

    # set cursor
    cursor = connection.cursor()

    # set columns and value types
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS data_table (
            id TEXT,
            date TEXT,
            time TEXT,
            sensor_value REAL,
            sensor_unit TEXT
        )
        """
    )
    # commit transaction
    connection.commit()
    connection.close()


# create table
create_table()


# -------------------------------Fetch and store data from Arduino--------------------------
# send GET request to arduino API server and store data in database
def fetch_and_store_data(id, arduino_ip):
    # get current date and time
    timestamp = datetime.now()

    # separate and format the date and time
    date = timestamp.date().strftime("%Y-%m-%d")

    # get data from arduino
    response = requests.get("http://" + arduino_ip + "/sensordata")

    # store data in database
    if response.ok:
        # get response from arduino
        data = response.content.decode("utf-8")

        # get object with each time and data entry
        values = [tuple(entry.split("-")) for entry in data.split(",")]

        # set connection and cursor
        connection = getDbConnection()
        cursor = connection.cursor()

        # get set unit
        sensor_unit = "V"

        # filter last null character
        filtered_values = [
            (id, date, value[0], value[1], sensor_unit)
            for value in values
            if len(value) >= 2
        ]

        # insert data onto table
        cursor.executemany(
            """
            INSERT INTO data_table (id, date, time, sensor_value, sensor_unit)
            VALUES (?, ?, ?, ?, ?)
            """,
            filtered_values,
        )

        # commit transaction and close
        connection.commit()
        connection.close()

        print("Sensor data added to the database")
    else:
        print("Error retrieving sensor data from the Arduino")


# ------------------------------Fetch filtered data from data.db-------------------------
# fetch and send SQLite data to HTML and apply filters
def read_database_data(id_filter=None, date_filter=None):
    # connect to the SQLite database
    connection = sqlite3.connect("data.db")
    cursor = connection.cursor()

    # read data from the database
    sql = "SELECT * FROM data_table WHERE 1"
    # apply filters
    if id_filter:
        sql += f" AND id = {id_filter}"
    if date_filter:
        sql += f" AND date = '{date_filter}'"

    cursor.execute(sql)
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]

    # convert data to a list of dictionaries
    sensor_data = []
    for row in rows:
        data_entry = {}
        for i, column in enumerate(row):
            data_entry[column_names[i]] = column
        sensor_data.append(data_entry)

    # close the database connection
    cursor.close()
    connection.close()

    return sensor_data


# -------------------------------Repeated fetching from Arduino--------------------------
# fetch from an arduino every minute
def repeated_fetch():
    while True:
        for arduino in arduinos:
            # fetch data
            fetch_and_store_data(arduino["id"], arduino["ip"])

            # delay before retrieving from next arduino
            time.sleep(gap_seconds / len(arduinos))


# start the data fetching process in a separate thread
data_fetch_thread = threading.Thread(target=repeated_fetch)
data_fetch_thread.start()


# ------------------------------Route to send realtime chart data to Javascript-----
# update realtime chart
@app.route("/chartdata", methods=["GET"])
def get_chartdata():
    # retrieve parameter value of arduino_id
    arduino_id = request.args.get("arduino_id")

    # error checking for blank arduino_id
    if not arduino_id:
        return jsonify({"error": "Arduino ID not provided"}), 400

    # get current date
    currentdate = datetime.now().date().strftime("%Y-%m-%d")
    # calculate the time interval (i.e. for retrieving data from the last 6 minutes, hours = 0.10)
    timeinterval = datetime.now() - timedelta(hours=0.10)

    # retrieve data values for the half an hour (time is more than current time minus -0.5 hour)
    conn = sqlite3.connect("data.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT time, sensor_value FROM data_table WHERE id=? AND date=? AND time > ? ORDER BY time DESC",
        (arduino_id, currentdate, timeinterval.strftime("%H:%M:%S")),
    )
    rows = cursor.fetchall()
    conn.close()

    # convert data to a list of dictionaries
    data = [{"time": row[0], "sensor_value": row[1]} for row in rows]
    # send data to javascript
    return jsonify(data)


# -------------------------------Pages render--------------------------
# route to render the data table with filter
@app.route("/")
def index():
    id_filter = request.args.get("id")
    date_filter = request.args.get("date")

    sensor_data = read_database_data(id_filter, date_filter)
    return render_template("sensordata.html", sensor_data=sensor_data)


# render realtime chart page
@app.route("/realtimechart")
def realtimechart():
    return render_template("realtimechart.html")


# render sensor control page
@app.route("/sensorcontrol")
def sensorcontrol():
    return render_template("sensorcontrol.html")


# ---------------------------------Run app------------------------------
if __name__ == "__main__":
    app.run()
