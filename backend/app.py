from flask import Flask, jsonify, request, session
from flask_cors import CORS
import mysql.connector
import re
import os
from werkzeug.security import generate_password_hash, check_password_hash


# Create Flask application
app = Flask(__name__)

# Secret key for sessions
app.secret_key = os.environ.get(
    "SECRET_KEY",
    "college-event-secret-key"
)

# Session security
if os.environ.get("VERCEL") == "1":
    app.config["SESSION_COOKIE_SECURE"] = True

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


# CORS for local development
CORS(
    app,
    origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    supports_credentials=True
)

# Secure session settings for production.
# Local Docker can still use normal HTTP.
if os.environ.get("VERCEL") == "1":
    app.config["SESSION_COOKIE_SECURE"] = True

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


# =========================================================
# CORS
# =========================================================

CORS(
    app,
    origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    supports_credentials=True
)


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "mysql"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "2468"),
        database=os.environ.get("DB_NAME", "college_event_db"),
        ssl_verify_cert=True,
        ssl_verify_identity=True,
        connection_timeout=10
    )


# =========================================================
# CHECK ADMIN
# =========================================================

def is_admin():

    return (
        "user_id" in session
        and session.get("role") == "admin"
    )


# =========================================================
# VALIDATE EVENT DATA
# =========================================================

def validate_event_data(data):

    if not data:

        return "Request data is required"


    name = data.get("name", "")

    date = data.get("date", "")

    venue = data.get("venue", "")


    # Make sure values are strings

    if not isinstance(name, str):

        return "Event name must be text"

    if not isinstance(date, str):

        return "Event date must be text"

    if not isinstance(venue, str):

        return "Event venue must be text"


    name = name.strip()

    date = date.strip()

    venue = venue.strip()


    # =====================================================
    # NAME
    # =====================================================

    if not name:

        return "Event name is required"


    if len(name) < 3:

        return (
            "Event name must contain "
            "at least 3 characters"
        )


    if len(name) > 100:

        return (
            "Event name cannot exceed "
            "100 characters"
        )


    # =====================================================
    # DATE
    # =====================================================

    if not date:

        return "Event date is required"


    # =====================================================
    # VENUE
    # =====================================================

    if not venue:

        return "Event venue is required"


    if len(venue) < 2:

        return (
            "Venue must contain "
            "at least 2 characters"
        )


    if len(venue) > 100:

        return (
            "Venue cannot exceed "
            "100 characters"
        )


    return None


# =========================================================
# VALIDATE EVENT ID
# =========================================================

def validate_event_id(event_id):

    if event_id <= 0:

        return False

    return True


# =========================================================
# GET ALL EVENTS
# =========================================================

@app.route("/api/events", methods=["GET"])
def get_events():

    db = get_db_connection()

    cursor = db.cursor(dictionary=True)


    cursor.execute("""
        SELECT *
        FROM events
        ORDER BY id
    """)


    events = cursor.fetchall()


    cursor.close()
    db.close()


    return jsonify(events)


# =========================================================
# GET ONE EVENT
# =========================================================

@app.route("/api/events/<int:event_id>", methods=["GET"])
def get_event(event_id):

    if not validate_event_id(event_id):

        return jsonify({
            "message": "Invalid event ID"
        }), 400


    db = get_db_connection()

    cursor = db.cursor(dictionary=True)


    cursor.execute(
        """
        SELECT *
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )


    event = cursor.fetchone()


    cursor.close()
    db.close()


    if event is None:

        return jsonify({
            "message": "Event not found"
        }), 404


    return jsonify(event)


# =========================================================
# ADD EVENT - ADMIN ONLY
# =========================================================

@app.route("/api/events", methods=["POST"])
def add_event():

    if not is_admin():

        return jsonify({
            "message": "Admin access required"
        }), 403


    data = request.get_json()


    error = validate_event_data(data)


    if error:

        return jsonify({
            "message": error
        }), 400


    name = data["name"].strip()

    date = data["date"].strip()

    venue = data["venue"].strip()


    db = get_db_connection()

    cursor = db.cursor()


    cursor.execute(
        """
        INSERT INTO events
        (name, date, venue)
        VALUES (%s, %s, %s)
        """,
        (
            name,
            date,
            venue
        )
    )


    db.commit()


    cursor.close()
    db.close()


    return jsonify({
        "message": "Event added successfully"
    }), 201


# =========================================================
# EDIT EVENT - ADMIN ONLY
# =========================================================

@app.route(
    "/api/events/<int:event_id>",
    methods=["PUT"]
)
def update_event(event_id):

    if not is_admin():

        return jsonify({
            "message": "Admin access required"
        }), 403


    if not validate_event_id(event_id):

        return jsonify({
            "message": "Invalid event ID"
        }), 400


    data = request.get_json()


    error = validate_event_data(data)


    if error:

        return jsonify({
            "message": error
        }), 400


    name = data["name"].strip()

    date = data["date"].strip()

    venue = data["venue"].strip()


    db = get_db_connection()

    cursor = db.cursor()


    # First check event exists

    cursor.execute(
        """
        SELECT id
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )


    event = cursor.fetchone()


    if event is None:

        cursor.close()
        db.close()

        return jsonify({
            "message": "Event not found"
        }), 404


    cursor.execute(
        """
        UPDATE events
        SET name = %s,
            date = %s,
            venue = %s
        WHERE id = %s
        """,
        (
            name,
            date,
            venue,
            event_id
        )
    )


    db.commit()


    cursor.close()
    db.close()


    return jsonify({
        "message": "Event updated successfully"
    })


# =========================================================
# DELETE EVENT - ADMIN ONLY
# =========================================================

@app.route(
    "/api/events/<int:event_id>",
    methods=["DELETE"]
)
def delete_event(event_id):

    if not is_admin():

        return jsonify({
            "message": "Admin access required"
        }), 403


    if not validate_event_id(event_id):

        return jsonify({
            "message": "Invalid event ID"
        }), 400


    db = get_db_connection()

    cursor = db.cursor()


    cursor.execute(
        """
        SELECT id
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )


    event = cursor.fetchone()


    if event is None:

        cursor.close()
        db.close()

        return jsonify({
            "message": "Event not found"
        }), 404


    cursor.execute(
        """
        DELETE FROM events
        WHERE id = %s
        """,
        (event_id,)
    )


    db.commit()


    cursor.close()
    db.close()


    return jsonify({
        "message": "Event deleted successfully"
    })


# =========================================================
# REGISTER USER
# =========================================================

@app.route(
    "/api/register",
    methods=["POST"]
)
def register():

    data = request.get_json()


    if not data:

        return jsonify({
            "message": "Request data is required"
        }), 400


    username = data.get(
        "username",
        ""
    )


    password = data.get(
        "password",
        ""
    )


    # Make sure correct types were sent

    if not isinstance(username, str):

        return jsonify({
            "message": "Username must be text"
        }), 400


    if not isinstance(password, str):

        return jsonify({
            "message": "Password must be text"
        }), 400


    username = username.strip()


    # =====================================================
    # USERNAME
    # =====================================================

    if not username:

        return jsonify({
            "message": "Username is required"
        }), 400


    if len(username) < 3:

        return jsonify({
            "message":
            "Username must contain at least 3 characters"
        }), 400


    if len(username) > 30:

        return jsonify({
            "message":
            "Username cannot exceed 30 characters"
        }), 400


    if not re.match(
        r"^[A-Za-z0-9_]+$",
        username
    ):

        return jsonify({
            "message":
            "Username can contain only letters, "
            "numbers and underscore"
        }), 400


    # =====================================================
    # PASSWORD
    # =====================================================

    if not password:

        return jsonify({
            "message": "Password is required"
        }), 400


    if len(password) < 6:

        return jsonify({
            "message":
            "Password must contain at least 6 characters"
        }), 400


    if len(password) > 100:

        return jsonify({
            "message":
            "Password cannot exceed 100 characters"
        }), 400


    # =====================================================
    # ROLE
    # =====================================================

    # Public registration always creates student.
    # Never trust role from the browser.

    role = "student"


    # =====================================================
    # HASH PASSWORD
    # =====================================================

    password_hash = generate_password_hash(
        password
    )


    # =====================================================
    # DATABASE
    # =====================================================

    db = get_db_connection()

    cursor = db.cursor()


    try:

        cursor.execute(
            """
            INSERT INTO users
            (username, password_hash, role)
            VALUES (%s, %s, %s)
            """,
            (
                username,
                password_hash,
                role
            )
        )


        db.commit()


    except mysql.connector.IntegrityError:

        cursor.close()
        db.close()

        return jsonify({
            "message":
            "Username already exists"
        }), 409


    cursor.close()
    db.close()


    return jsonify({
        "message":
        "User registered successfully"
    }), 201


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/api/login",
    methods=["POST"]
)
def login():

    data = request.get_json()


    if not data:

        return jsonify({
            "message": "Request data is required"
        }), 400


    username = data.get(
        "username",
        ""
    )


    password = data.get(
        "password",
        ""
    )


    if not isinstance(username, str):

        return jsonify({
            "message": "Username must be text"
        }), 400


    if not isinstance(password, str):

        return jsonify({
            "message": "Password must be text"
        }), 400


    username = username.strip()


    if not username:

        return jsonify({
            "message": "Username is required"
        }), 400


    if not password:

        return jsonify({
            "message": "Password is required"
        }), 400


    db = get_db_connection()

    cursor = db.cursor(dictionary=True)


    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE username = %s
        """,
        (username,)
    )


    user = cursor.fetchone()


    cursor.close()
    db.close()


    if user is None:

        return jsonify({
            "message":
            "Invalid username or password"
        }), 401


    if not check_password_hash(
        user["password_hash"],
        password
    ):

        return jsonify({
            "message":
            "Invalid username or password"
        }), 401


    # =====================================================
    # SESSION
    # =====================================================

    session["user_id"] = user["id"]

    session["username"] = user["username"]

    session["role"] = user["role"]


    return jsonify({
        "message": "Login successful",
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"]
    })


# =========================================================
# CURRENT USER
# =========================================================

@app.route(
    "/api/me",
    methods=["GET"]
)
def get_current_user():

    if "user_id" not in session:

        return jsonify({
            "message": "Not logged in"
        }), 401


    return jsonify({
        "user_id": session["user_id"],
        "username": session["username"],
        "role": session["role"]
    })


# =========================================================
# LOGOUT
# =========================================================

@app.route(
    "/api/logout",
    methods=["POST"]
)
def logout():

    session.clear()


    return jsonify({
        "message": "Logout successful"
    })


# =========================================================
# REGISTER FOR EVENT
# =========================================================

@app.route(
    "/api/events/<int:event_id>/register",
    methods=["POST"]
)
def register_for_event(event_id):

    # -----------------------------------------------------
    # LOGIN CHECK
    # -----------------------------------------------------

    if "user_id" not in session:

        return jsonify({
            "message": "Login required"
        }), 401


    # -----------------------------------------------------
    # EVENT ID
    # -----------------------------------------------------

    if not validate_event_id(event_id):

        return jsonify({
            "message": "Invalid event ID"
        }), 400


    user_id = session["user_id"]


    db = get_db_connection()

    cursor = db.cursor(dictionary=True)


    # =====================================================
    # CHECK EVENT
    # =====================================================

    cursor.execute(
        """
        SELECT *
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )


    event = cursor.fetchone()


    if event is None:

        cursor.close()
        db.close()

        return jsonify({
            "message": "Event not found"
        }), 404


    # =====================================================
    # CHECK DUPLICATE REGISTRATION
    # =====================================================

    cursor.execute(
        """
        SELECT *
        FROM event_registrations
        WHERE user_id = %s
        AND event_id = %s
        """,
        (
            user_id,
            event_id
        )
    )


    existing_registration = (
        cursor.fetchone()
    )


    if existing_registration is not None:

        cursor.close()
        db.close()

        return jsonify({
            "message":
            "Already registered for this event"
        }), 409


    # =====================================================
    # INSERT REGISTRATION
    # =====================================================

    try:

        cursor.execute(
            """
            INSERT INTO event_registrations
            (user_id, event_id)
            VALUES (%s, %s)
            """,
            (
                user_id,
                event_id
            )
        )


        db.commit()


    except mysql.connector.IntegrityError:

        cursor.close()
        db.close()

        return jsonify({
            "message":
            "Registration already exists"
        }), 409


    cursor.close()
    db.close()


    return jsonify({
        "message":
        "Registered for event successfully"
    }), 201


# =========================================================
# GET MY REGISTRATIONS
# =========================================================

@app.route(
    "/api/my-registrations",
    methods=["GET"]
)
def my_registrations():

    if "user_id" not in session:

        return jsonify({
            "message": "Login required"
        }), 401


    user_id = session["user_id"]


    db = get_db_connection()

    cursor = db.cursor(
        dictionary=True
    )


    cursor.execute(
        """
        SELECT
            events.id,
            events.name,
            events.date,
            events.venue,
            event_registrations.registered_at

        FROM event_registrations

        JOIN events
            ON event_registrations.event_id
            = events.id

        WHERE event_registrations.user_id = %s

        ORDER BY events.date
        """,
        (user_id,)
    )


    registrations = cursor.fetchall()


    cursor.close()
    db.close()


    return jsonify(registrations)


# =========================================================
# ADMIN - VIEW EVENT REGISTRATIONS
# =========================================================

@app.route(
    "/api/events/<int:event_id>/registrations",
    methods=["GET"]
)
def get_event_registrations(event_id):

    # -----------------------------------------------------
    # ADMIN CHECK
    # -----------------------------------------------------

    if not is_admin():

        return jsonify({
            "message": "Admin access required"
        }), 403


    # -----------------------------------------------------
    # EVENT ID
    # -----------------------------------------------------

    if not validate_event_id(event_id):

        return jsonify({
            "message": "Invalid event ID"
        }), 400


    db = get_db_connection()

    cursor = db.cursor(
        dictionary=True
    )


    # =====================================================
    # CHECK EVENT
    # =====================================================

    cursor.execute(
        """
        SELECT *
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )


    event = cursor.fetchone()


    if event is None:

        cursor.close()
        db.close()

        return jsonify({
            "message": "Event not found"
        }), 404


    # =====================================================
    # GET REGISTRATIONS
    # =====================================================

    cursor.execute(
        """
        SELECT
            users.id AS user_id,
            users.username,
            event_registrations.registered_at

        FROM event_registrations

        JOIN users
            ON event_registrations.user_id
            = users.id

        WHERE event_registrations.event_id = %s

        ORDER BY event_registrations.registered_at
        """,
        (event_id,)
    )


    registrations = cursor.fetchall()


    cursor.close()
    db.close()


    return jsonify({
        "event": event,
        "registrations": registrations
    })


# =========================================================
# CANCEL MY REGISTRATION
# =========================================================

@app.route(
    "/api/events/<int:event_id>/register",
    methods=["DELETE"]
)
def cancel_registration(event_id):

    # -----------------------------------------------------
    # LOGIN CHECK
    # -----------------------------------------------------

    if "user_id" not in session:

        return jsonify({
            "message": "Login required"
        }), 401


    # -----------------------------------------------------
    # EVENT ID
    # -----------------------------------------------------

    if not validate_event_id(event_id):

        return jsonify({
            "message": "Invalid event ID"
        }), 400


    user_id = session["user_id"]


    db = get_db_connection()

    cursor = db.cursor()


    # =====================================================
    # DELETE ONLY CURRENT USER'S REGISTRATION
    # =====================================================

    cursor.execute(
        """
        DELETE FROM event_registrations

        WHERE user_id = %s
        AND event_id = %s
        """,
        (
            user_id,
            event_id
        )
    )


    db.commit()


    deleted = cursor.rowcount


    cursor.close()
    db.close()


    if deleted == 0:

        return jsonify({
            "message":
            "You are not registered for this event"
        }), 404


    return jsonify({
        "message":
        "Registration cancelled successfully"
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)