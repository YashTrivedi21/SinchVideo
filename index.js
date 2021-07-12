// this will be used for setting username after user had logged in/signed up
let global_username = "";

// once user has signed up/ logged in we show them the calling form
const render = function() {
    $("div#call").show();
    $("form#userForm").css("display", "none");
    $("div#userInfo").css("display", "inline");
    $("h3#login").css("display", "none");
    // currently empty space will be reserved for incoming/outgoing videos
    $("video").show();
    $("span#username").text(global_username);
};

// for unsuccessful try or when page is loaded again
// show the login interface again
const renderLoginUI = function() {
    $("form#userForm").css("display", "block");
};

// Set up sinchClient object

sinchClient = new SinchClient({
    applicationKey: KEY,
    // we need both video and audio for connection
    capabilities: { calling: true, video: true },
    supportActiveConnection: true,
    //below function is for logging purpose
    onLogMessage: function(message) {
        console.log(message);
    }
});

sinchClient.startActiveConnection();

// Set name of session
// name can be anything
const sessionName = "sinchSessionVIDEO-" + sinchClient.applicationKey;

// Check for valid session
const objSession = JSON.parse(localStorage[sessionName] || "{}");
if (objSession.userId) {
    sinchClient.start(objSession).then(() => {
        global_username = objSession.userId;
        //On success, show the UI
        render();
    })
        .fail(() =>  {
            // for failed session return to login screen
            renderLoginUI();
        });
} else {
    renderLoginUI();
}

// Handle errors but show UI anyway
const handleError = function(error) {
    //Enable buttons
    $("button#createUser").prop("disabled", false);
    $("button#loginUser").prop("disabled", false);

    //Show error
    $("div.error").text(error.message);
    $("div.error").show();
};
// clear errors
const logErrors = function() {
    $("div.error").hide();
};

// Create user and start sinch for that user and save session in localStorage
$("button#createUser").on("click", function(event) {
    event.preventDefault();
    $("button#loginUser").attr("disabled", true);
    $("button#createUser").attr("disabled", true);
    logErrors();

    // taking username and password and binding it to sinch object
    const signUpObj = {};
    signUpObj.username = $("input#username").val();
    signUpObj.password = $("input#password").val();

    //Using Sinch SDK to create a new user
    sinchClient
        .newUser(signUpObj, function(ticket) {
            //On success, start the client
            sinchClient
                .start(ticket, function() {
                    global_username = signUpObj.username;
                    //On success, show the UI
                    render();

                    //Store session
                    localStorage[sessionName] = JSON.stringify(sinchClient.getSession());
                })
                .fail(handleError);
        })
        .fail(handleError);
});

// Login user and save session in localStorage
// also after login/signup disable the login/create buttons

$("button#loginUser").on("click", function(event) {
    event.preventDefault();
    $("button#loginUser").attr("disabled", true);
    $("button#createUser").attr("disabled", true);
    logErrors();

    // make a object name signInObj which will be used to add values to sinchClient object
    // again take values and use it for sinch user
    const signInObj = {};
    signInObj.username = $("input#username").val();
    signInObj.password = $("input#password").val();

    //Use Sinch SDK to authenticate a user
    sinchClient
        .start(signInObj, function() {
            global_username = signInObj.username;
            //On success, show the UI
            render();
            //Store session
            localStorage[sessionName] = JSON.stringify(sinchClient.getSession());
        })
        .fail(handleError);
});

// using ringtones for audio and binding video
const audioStats = document.createElement("audio");
const audioTone = document.createElement("audio");
const userVideo = document.getElementById("videoincoming");
const guestVideo = document.getElementById("videooutgoing");


// Define listener for managing calls, adding ringtones to call
const callListeners = {
    onCallProgressing: function(call) {
        audioStats.src = "style/ringback.wav";
        audioStats.loop = true;
        audioStats.play();
        guestVideo.srcObject = call.outgoingStream;
    },
    // set video and audio when call is connected
    onCallEstablished: function(call) {
        guestVideo.srcObject = call.outgoingStream;
        userVideo.srcObject = call.incomingStream;
        audioStats.pause();
        audioTone.pause();
    },
    // when the call is ended set values of video and audio to null
    onCallEnded: function(call) {
        audioStats.pause();
        audioTone.pause();
        userVideo.srcObject = null;
        guestVideo.srcObject = null;
        // remove styles of cal as well
        $("button").removeClass("incall");
        $("button").removeClass("callwaiting");
    }
};

// Setting up callClient
const callClient = sinchClient.getCallClient();
callClient.initStream().then(function() {

    // Directly init stream
    $("div.frame").not("#chromeFileWarning").show();
});
let call;

callClient.addEventListener({
    onIncomingCall: function(incomingCall) {
        //Play some groovy tunes
        audioTone.src = "style/phone_ring.wav";
        audioTone.loop = true;
        audioTone.play();
        // add incall class to button
        $("button").addClass("incall");

        //Manage the call object, add call listner to incoming call
        call = incomingCall;
        call.addEventListener(callListeners);
        $("button").addClass("callwaiting");
    }
});

// when answer button is pressed add the videos and remove callWaiting class
$("button#answer").click(function(event) {
    event.preventDefault();
    // the button will have a callwaiting class so remove it and add incall class
    if ($(this).hasClass("callwaiting")) {
        logErrors();

        try {
            call.answer();
            $("button").removeClass("callwaiting");
        } catch (error) {
            handleError(error);
        }
    }
});

// Make a new data call

$("button#call").click(function(event) {
    event.preventDefault();

    // if button doesn't have incall and callWaiting class then we can continue adding incall class to it
    if (!$(this).hasClass("incall") && !$(this).hasClass("callwaiting")) {
        logErrors();
        // add incall class to button
        $("button").addClass("incall");

        console.log("Placing call to: " + $("input#callUserName").val());
        call = callClient.callUser($("input#callUserName").val());

        call.addEventListener(callListeners);
    }
});

// Hang up a call

$("button#hangup").click(function(event) {
    event.preventDefault();

    // button will be having incall class when during the call, at the hangup remove it and reload window
    if ($(this).hasClass("incall")) {
        logErrors();

        console.info("Will request hangup..");

        call && call.hangup();
    }
});

// Log out user

$("button#logOut").on("click", function(event) {
    event.preventDefault();
    logErrors();

    //Stop the sinchClient
    sinchClient.terminate();

    //Destroy the session info
    delete localStorage[sessionName];

    //Allow re-login and show buttons
    $("button#loginUser").attr("disabled", false);
    $("button#createUser").attr("disabled", false);

    //Reload page
    window.location.reload();
});

// Chrome check for file
if (location.protocol == "file:" && navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
    $("div#chromeFileWarning").show();
}

$("button").prop("disabled", false); //Solve Firefox issue, ensure buttons always clickable after load


// Firebase configuration
const firebaseConfig = {
    apiKey: APIKEY,
    authDomain: AUTHDOMAIN,
    databaseURL: DATABASEURL,
    projectId: PROJECTID,
    storageBucket: STORAGEBUCKET,
    messagingSenderId: MESSAGINGSENDERID,
    appId: APPID,
    measurementId: MEASUREMENTID
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// initialize database
const db = firebase.database();

// get user's data, for anonymous messages empty field is also accepted
const username = prompt("Please Tell Us Your Name");

// submit form
// listen for submit event on the form and call the postChat function
document.getElementById("message-form").addEventListener("submit", sendMessage);

// send message to db
function sendMessage(e) {
    e.preventDefault();

    // get values to be submitted
    const timestamp = Date.now();
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value;

    // clear the input box
    messageInput.value = "";

    //auto scroll to bottom
    document
        .getElementById("messages")
        .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

    // create db collection and send in the data
    db.ref("messages/" + timestamp).set({
        username,
        message,
    });
}

// display the messages
// reference the collection created earlier
const fetchChat = db.ref("messages/");

// fetch the message from the db and serve them to html page
// check for new messages using the onChildAdded event listener
fetchChat.on("child_added", function (snapshot) {
    const messages = snapshot.val();
    // create li tag and append it in ul tag
    // here we take extra care for sent and receive type messages because of their styling
    const message = `<li class=${
        username === messages.username ? "sent" : "receive"
    }><span>${messages.username}: </span>${messages.message}</li>`;
    // append the message on the page
    document.getElementById("messages").innerHTML += message;
});
// take the reference to main db for deleting chat
const mes = db.ref("/")
// function to mute the participant  audio, select the video element and mute the audio
function Mute(){
    document.getElementById("videoincoming").muted=true;
}
// function to unmute the participant  audio, select the video element and unmute the audio
function unMute(){
    document.getElementById("videoincoming").muted=false;
}
// function to clear chat
function rem(){
    mes.remove();
}