// =========================================================
// CHECK LOGIN
// =========================================================

async function checkLogin() {

    try {

        const response = await fetch(
            "/api/me",
            {
                method: "GET",
                credentials: "include"
            }
        );


        const userInfo =
            document.getElementById("userInfo");

        const loginLink =
            document.getElementById("loginLink");

        const logoutButton =
            document.getElementById("logoutButton");

        const adminSection =
            document.getElementById("adminSection");

        const myRegistrationsButton =
            document.getElementById(
                "myRegistrationsButton"
            );


        if (response.ok) {

            const user =
                await response.json();


            userInfo.innerHTML = `
                <h3>
                    Welcome, ${user.username}
                </h3>

                <p>
                    Role: ${user.role}
                </p>
            `;


            loginLink.style.display =
                "none";

            logoutButton.style.display =
                "inline-block";


            if (user.role === "admin") {

                adminSection.style.display =
                    "block";

                myRegistrationsButton.style.display =
                    "none";

            }

            else {

                adminSection.style.display =
                    "none";

                myRegistrationsButton.style.display =
                    "inline-block";

            }

        }

        else {

            userInfo.innerHTML =
                "<p>You are not logged in.</p>";

            loginLink.style.display =
                "inline-block";

            logoutButton.style.display =
                "none";

            adminSection.style.display =
                "none";

            myRegistrationsButton.style.display =
                "none";

        }

    }

    catch (error) {

        console.error(
            "Login check error:",
            error
        );

    }

}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    try {

        const response = await fetch(
            "/api/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );


        if (response.ok) {

            window.location.href =
                "login.html";

        }

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        logout
    );


// =========================================================
// GET ALL EVENTS
// =========================================================

async function getEvents() {

    try {

        const userResponse =
            await fetch(
                "/api/me",
                {
                    credentials: "include"
                }
            );


        let user = null;


        if (userResponse.ok) {

            user =
                await userResponse.json();

        }


        const response =
            await fetch(
                "/api/events"
            );


        const events =
            await response.json();


        const eventsDiv =
            document.getElementById("events");


        eventsDiv.innerHTML = "";


        for (let event of events) {

            let registerButton = "";


            if (
                user &&
                user.role === "student"
            ) {

                registerButton = `

                    <button
                        onclick="registerForEvent(${event.id})"
                    >
                        Register
                    </button>

                `;

            }


            eventsDiv.innerHTML += `

                <div>

                    <h2>
                        ${event.name}
                    </h2>

                    <p>
                        ID: ${event.id}
                    </p>

                    <p>
                        Date: ${event.date}
                    </p>

                    <p>
                        Venue: ${event.venue}
                    </p>

                    ${registerButton}

                </div>

                <hr>

            `;

        }

    }

    catch (error) {

        console.error(
            "Get events error:",
            error
        );

    }

}


// =========================================================
// ADD EVENT
// =========================================================

function showAddEventForm() {

    document
        .getElementById("addEventForm")
        .style.display = "block";

}


function hideAddEventForm() {

    document
        .getElementById("addEventForm")
        .style.display = "none";

    document
        .getElementById("eventForm")
        .reset();

}


document
    .getElementById("eventForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "eventName"
                ).value;

            const date =
                document.getElementById(
                    "eventDate"
                ).value;

            const venue =
                document.getElementById(
                    "eventVenue"
                ).value;


            try {

                const response =
                    await fetch(
                        "/api/events",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "include",

                            body: JSON.stringify({

                                name: name,
                                date: date,
                                venue: venue

                            })
                        }
                    );


                const result =
                    await response.json();


                if (response.ok) {

                    alert(
                        "Event added successfully!"
                    );

                    hideAddEventForm();

                    getEvents();

                }

                else {

                    alert(
                        result.message
                    );

                }

            }

            catch (error) {

                console.error(
                    "Add event error:",
                    error
                );

            }

        }
    );


// =========================================================
// EDIT EVENT
// =========================================================

function showEditEventForm() {

    document
        .getElementById("editEventForm")
        .style.display = "block";

}


function hideEditEventForm() {

    document
        .getElementById("editEventForm")
        .style.display = "none";

    document
        .getElementById("editDetails")
        .style.display = "none";

    document
        .getElementById("editForm")
        .reset();

}


async function loadEventForEdit() {

    const id =
        document.getElementById(
            "editEventId"
        ).value;


    if (!id) {

        alert(
            "Please enter an event ID."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/events/${id}`
            );


        const event =
            await response.json();


        if (!response.ok) {

            alert(
                event.message
            );

            return;

        }


        document.getElementById(
            "editEventName"
        ).value = event.name;


        document.getElementById(
            "editEventDate"
        ).value = event.date;


        document.getElementById(
            "editEventVenue"
        ).value = event.venue;


        document.getElementById(
            "editDetails"
        ).style.display = "block";

    }

    catch (error) {

        console.error(
            "Get event error:",
            error
        );

    }

}


document
    .getElementById("editForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const id =
                document.getElementById(
                    "editEventId"
                ).value;

            const name =
                document.getElementById(
                    "editEventName"
                ).value;

            const date =
                document.getElementById(
                    "editEventDate"
                ).value;

            const venue =
                document.getElementById(
                    "editEventVenue"
                ).value;


            try {

                const response =
                    await fetch(
                        `/api/events/${id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "include",

                            body: JSON.stringify({

                                name: name,
                                date: date,
                                venue: venue

                            })
                        }
                    );


                const result =
                    await response.json();


                if (response.ok) {

                    alert(
                        "Event updated successfully!"
                    );

                    hideEditEventForm();

                    getEvents();

                }

                else {

                    alert(
                        result.message
                    );

                }

            }

            catch (error) {

                console.error(
                    "Update event error:",
                    error
                );

            }

        }
    );


// =========================================================
// DELETE EVENT
// =========================================================

function showDeleteEventForm() {

    document
        .getElementById("deleteEventForm")
        .style.display = "block";

}


function hideDeleteEventForm() {

    document
        .getElementById("deleteEventForm")
        .style.display = "none";

    document
        .getElementById("deleteDetails")
        .style.display = "none";

    document
        .getElementById("deleteForm")
        .reset();

}


// GET EVENT BEFORE DELETE

async function loadEventForDelete() {

    const id =
        document.getElementById(
            "deleteEventId"
        ).value;


    if (!id) {

        alert(
            "Please enter an event ID."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/events/${id}`
            );


        const event =
            await response.json();


        if (!response.ok) {

            alert(
                event.message
            );

            return;

        }


        // Display event details

        document.getElementById(
            "deleteId"
        ).textContent = event.id;


        document.getElementById(
            "deleteName"
        ).textContent = event.name;


        document.getElementById(
            "deleteDate"
        ).textContent = event.date;


        document.getElementById(
            "deleteVenue"
        ).textContent = event.venue;


        document.getElementById(
            "deleteDetails"
        ).style.display = "block";

    }

    catch (error) {

        console.error(
            "Get event error:",
            error
        );

    }

}


// ACTUAL DELETE

document
    .getElementById("deleteForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const id =
                document.getElementById(
                    "deleteEventId"
                ).value;


            const confirmed =
                confirm(
                    "Are you sure you want to delete this event?"
                );


            if (!confirmed) {

                return;

            }


            try {

                const response =
                    await fetch(
                        `/api/events/${id}`,
                        {
                            method: "DELETE",
                            credentials: "include"
                        }
                    );


                const result =
                    await response.json();


                if (response.ok) {

                    alert(
                        "Event deleted successfully!"
                    );

                    hideDeleteEventForm();

                    getEvents();

                }

                else {

                    alert(
                        result.message
                    );

                }

            }

            catch (error) {

                console.error(
                    "Delete event error:",
                    error
                );

            }

        }
    );


// =========================================================
// VIEW REGISTRATIONS
// =========================================================

function showRegistrationsForm() {

    document
        .getElementById("registrationsForm")
        .style.display = "block";

}


function hideRegistrationsForm() {

    document
        .getElementById("registrationsForm")
        .style.display = "none";

    document
        .getElementById(
            "registrationsFormElement"
        )
        .reset();

}


document
    .getElementById(
        "registrationsFormElement"
    )
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const eventId =
                document.getElementById(
                    "registrationEventId"
                ).value;


            try {

                const response =
                    await fetch(
                        `/api/events/${eventId}/registrations`,
                        {
                            method: "GET",
                            credentials: "include"
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.message
                    );

                    return;

                }


                const eventsDiv =
                    document.getElementById(
                        "events"
                    );


                eventsDiv.innerHTML = `

                    <h2>
                        Registrations for
                        ${result.event.name}
                    </h2>

                    <p>
                        Event ID:
                        ${result.event.id}
                    </p>

                    <p>
                        Date:
                        ${result.event.date}
                    </p>

                    <p>
                        Venue:
                        ${result.event.venue}
                    </p>

                    <h3>
                        Registered Students
                    </h3>

                `;


                if (
                    result.registrations.length === 0
                ) {

                    eventsDiv.innerHTML +=
                        "<p>No students registered.</p>";

                    hideRegistrationsForm();

                    return;

                }


                for (
                    let registration
                    of result.registrations
                ) {

                    eventsDiv.innerHTML += `

                        <div>

                            <p>
                                Student ID:
                                ${registration.user_id}
                            </p>

                            <p>
                                Username:
                                ${registration.username}
                            </p>

                            <p>
                                Registered At:
                                ${registration.registered_at}
                            </p>

                        </div>

                        <hr>

                    `;

                }


                hideRegistrationsForm();

            }

            catch (error) {

                console.error(
                    "View registrations error:",
                    error
                );

            }

        }
    );


// =========================================================
// STUDENT REGISTRATION
// =========================================================

async function registerForEvent(eventId) {

    try {

        const response =
            await fetch(
                `/api/events/${eventId}/register`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );


        const result =
            await response.json();


        if (response.ok) {

            alert(
                "Registered for event successfully!"
            );

        }

        else {

            alert(
                result.message
            );

        }

    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );

    }

}


// =========================================================
// MY REGISTRATIONS
// =========================================================

async function getMyRegistrations() {

    try {

        const response =
            await fetch(
                "/api/my-registrations",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        const registrations =
            await response.json();


        if (!response.ok) {

            alert(
                registrations.message
            );

            return;

        }


        const eventsDiv =
            document.getElementById("events");


        eventsDiv.innerHTML =
            "<h2>My Registered Events</h2>";


        if (
            registrations.length === 0
        ) {

            eventsDiv.innerHTML +=
                "<p>You have not registered for any events.</p>";

            return;

        }


        for (
            let event of registrations
        ) {

            eventsDiv.innerHTML += `

                <div>

                    <h3>
                        ${event.name}
                    </h3>

                    <p>
                        Event ID:
                        ${event.id}
                    </p>

                    <p>
                        Date:
                        ${event.date}
                    </p>

                    <p>
                        Venue:
                        ${event.venue}
                    </p>

                    <p>
                        Registered At:
                        ${event.registered_at}
                    </p>

                    <button
                        onclick="cancelRegistration(${event.id})"
                    >
                        Cancel Registration
                    </button>

                </div>

                <hr>

            `;

        }

    }

    catch (error) {

        console.error(
            "My registrations error:",
            error
        );

    }

}


// =========================================================
// CANCEL REGISTRATION
// =========================================================

async function cancelRegistration(eventId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this registration?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/events/${eventId}/register`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const result =
            await response.json();


        if (response.ok) {

            alert(
                "Registration cancelled successfully!"
            );

            getMyRegistrations();

        }

        else {

            alert(
                result.message
            );

        }

    }

    catch (error) {

        console.error(
            "Cancel registration error:",
            error
        );

    }

}


// =========================================================
// START
// =========================================================

checkLogin();