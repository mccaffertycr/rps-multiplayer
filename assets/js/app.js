// global vars

var player1 = null;
var player2 = null;
var player1Name = "";
var player2Name = "";
var yourPlayerName = "";
var player1Choice = "";
var player2Choice = "";
var turn = 1;

// database section

// Attach a listener to the database /players/ node to listen for any changes
database.ref("players").on("value", function(snap) {
	// Check for  player 1 in the database
	if (snap.child("player1").exists()) {
		console.log("Player 1 exists");

		// Record player1 data
		player1 = snap.val().player1;
		player1Name = player1.name;

		// Update player1 display
		$("#playerOneName").text(player1Name);
		$("#player1Stats").html("W: " + player1.win + "| L: " + player1.loss + "| Draw: " + player1.draw);
	} else {
		console.log("Player 1 does NOT exist");

		player1 = null;
		player1Name = "";

		// Update player1 display
		$("#playerOneName").text("Waiting for Player 1...");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("Multiplayer Rock Paper Scissors");
		$("#waitingNotice").html("");
		$("#player1Stats").html("W: 0 | L: 0 | Draw: 0");
	}

	// Check for player 2 in the database
	if (snap.child("player2").exists()) {
		console.log("Player 2 exists");

		// Record player2 data
		player2 = snap.val().player2;
		player2Name = player2.name;

		// Update player2 display
		$("#playerTwoName").text(player2Name);
		$("#player2Stats").html("W: " + player2.win + "| L: " + player2.loss + "| Draw: " + player2.draw);
	} else {
		console.log("Player 2 does NOT exist");

		player2 = null;
		player2Name = "";

		// Update player2 display
		$("#playerTwoName").text("Waiting for Player 2...");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("outcome").remove();
		$("#roundOutcome").html("Multiplayer Rock Paper Scissors");
		$("#name-info").html("");
		$("#player2Stats").html("W: 0 | L: 0 | Draw: 0");
	}

	// If both players are now present, it's player1's turn
	if (player1 && player2) {
		// Update the display with a green border around player 1
		$("#playerPanel1").addClass("playerPanelTurn");

		// Update the center display
		$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
	}

	// If both players leave the game, empty the chat
	if (!player1 && !player2) {
		database.ref("chat").remove();
		database.ref("turn").remove();
		database.ref("outcome").remove();

		$("#chatDisplay").empty();
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		$("#roundOutcome").html("Multiplayer Rock Paper Scissors");
		$("#waitingNotice").html("");
	}
});

// Attach a listener to the the chat node to listen for new messages
database.ref("chat").on("child_added", function(snap) {
    var chatMsg = snap.val();
    console.log(chatMsg);
    var chatRow = $("<tr>");
    var chatEntry = $("<td>" + chatMsg + "<td>");
    chatRow.append(chatEntry);

	// classes that change color of chat messages
	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("playerdc");
	} else if (chatMsg.includes("joined")) {
		chatEntry.addClass("playerjoin");
	} else if (chatMsg.startsWith(yourPlayerName)) {
		chatEntry.addClass("chatColor1");
	} else {
		chatEntry.addClass("chatColor2");
	}

	$("#chat-table").append(chatRow);
	$("tbody").scrollTop($("tbody")[0].scrollHeight);
});

// listen for disconnections
database.ref("players").on("child_removed", function(snap) {
	var msg = "[" + moment().format("HH:mm") + "](" + snap.val().name + "): has disconnected!";

	// Get a key for the disconnection chat entry
	var chatKey = database.ref().child("chat").push().key;

	// Save the disconnection chat entry
	database.ref("chat/" + chatKey).set(msg);
});

// listen for any changes to the turn node
database.ref("turn").on("value", function(snap) {
	// Check if it's player1's turn
	if (snap.val() === 1) {
		console.log("TURN 1");
		turn = 1;

		// Update the display if both players are in the game
		if (player1 && player2) {
			$("#playerPanel1").addClass("playerPanelTurn");
			$("#playerPanel2").removeClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
		}
	} else if (snap.val() === 2) {
		console.log("TURN 2");
		turn = 2;

		// Update the display if both players are in the game
		if (player1 && player2) {
			$("#playerPanel1").removeClass("playerPanelTurn");
			$("#playerPanel2").addClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player2Name + " to choose...");
		}
	}
});

// listen for the outcome 
database.ref("outcome").on("value", function(snap) {
	$("#roundOutcome").html(snap.val());
});

// button listeners

// event listener that adds a new player to the database
$("#add-name").on("click", function(event) {
	event.preventDefault();

	// First, make sure that the name field is non-empty and we are still waiting for a player
	if ( ($("#name-input").val().trim() !== "") && !(player1 && player2) ) {
		// Adding player1
		if (player1 === null) {
			console.log("Adding Player 1");

			yourPlayerName = $("#name-input").val().trim();
			player1 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				draw: 0,
				choice: ""
			};

			// Add player1 to the database
			database.ref("players/player1").set(player1);


			// Set the turn value to 1, as player1 goes first
			database.ref("turn").set(1);

			// If this user disconnects by closing or refreshing the browser, remove the user from the database
			database.ref("players/player1").onDisconnect().remove();
		} else if( (player1 !== null) && (player2 === null) ) {
			// Adding player2
			console.log("Adding Player 2");

			yourPlayerName = $("#name-input").val().trim();
			player2 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				draw: 0,
				choice: ""
			};

			// Add player2 to the database
			database.ref("players/player2").set(player2);

			// If this user disconnects by closing or refreshing the browser, remove the user from the database
			database.ref("players/player2").onDisconnect().remove();
        }
        
        
		// Add a user joining message to the chat
		var msg = "[" + moment().format("HH:mm") + "](" + yourPlayerName + "): has joined!";
		console.log(msg);

		// Get a key for the join chat entry
        var chatKey = database.ref("chat").push().key;

		// Save the join chat entry
		database.ref("chat/" + chatKey).set(msg);

		// Reset the name input box
		$("#name-input").val("");	
	}
});

// Attach an event handler to the chat "Send" button to append the new message to the conversation
$("#chat-send").on("click", function(event) {
	event.preventDefault();

	// First, make sure that the player exists and the message box is non-empty
	if ( (yourPlayerName !== "") && ($("#chat-input").val().trim() !== "") ) {
		// Grab the message from the input box and subsequently reset the input box
		var msg = "[" + moment().format("HH:mm") + "](" + yourPlayerName + "): " + $("#chat-input").val().trim();
        $("#chat-input").val("");

		// Get a key for the new chat entry
		var chatKey = database.ref("chat").push().key;

		// Save the new chat entry
        database.ref("chat/" + chatKey).set(msg);
        
	}
});

// Monitor Player1's selection
$(".p1option").on("click", function(event) {
	event.preventDefault();

	// Make selections only when both players are in the game
	if (player1 && player2 && (yourPlayerName === player1.name) && (turn === 1)) {
        // Record player1's choice
        var choice = $(this).attr('data');

		// Record the player choice into the database
		player1Choice = choice;
        database.ref("players/player1/choice").set(player1Choice);


		// Set the turn value to 2, as it is now player2's turn
		turn = 2;
		database.ref("turn").set(2);
	}
});

// Monitor Player2's selection
$(".p2option").on("click", function(event) {
	event.preventDefault();

	// Make selections only when both players are in the game
	if (player1 && player2 && (yourPlayerName === player2.name) && (turn === 2) ) {
		// Record player2's choice
		var choice = $(this).attr('data');

		// Record the player choice into the database
		player2Choice = choice;
		database.ref("players/player2/choice").set(player2Choice);

		// Compare player1 and player 2 choices and record the outcome
		rps();
	}
});

// rpsCompare is the main rock/paper/scissors logic to see which player wins
function rps() {
	if (player1.choice === "r") {
		if (player2.choice === "r") {
			// draw
			console.log("draw");

			database.ref("outcome").set("it's a draw!");
			database.ref("players/player1/draw").set(player1.draw + 1);
			database.ref("players/player2/draw").set(player2.draw + 1);
		} else if (player2.choice === "p") {
			// Player2 wins
			console.log("paper wins");

			database.ref("outcome").set("paper wins!");
			database.ref("players/player1/loss").set(player1.loss + 1);
			database.ref("players/player2/win").set(player2.win + 1);
		} else { // scissors
			// Player1 wins
			console.log("rock wins");

			database.ref("outcome").set("rock wins!");
			database.ref("players/player1/win").set(player1.win + 1);
			database.ref("players/player2/loss").set(player2.loss + 1);
		}

	} else if (player1.choice === "p") {
		if (player2.choice === "r") {
			// Player1 wins
			console.log("paper wins");

			database.ref("outcome").set("Paper wins!");
			database.ref("players/player1/win").set(player1.win + 1);
			database.ref("players/player2/loss").set(player2.loss + 1);
		} else if (player2.choice === "p") {
			// draw
			console.log("draw");

			database.ref("outcome").set("it's a draw!");
			database.ref("players/player1/draw").set(player1.draw + 1);
			database.ref("players/player2/draw").set(player2.draw + 1);
		} else { // Scissors
			// Player2 wins
			console.log("scissors win");

			database.ref("outcome").set("scissors win!");
			database.ref("players/player1/loss").set(player1.loss + 1);
			database.ref("players/player2/win").set(player2.win + 1);
		}

	} else if (player1.choice === "s") {
		if (player2.choice === "r") {
			// Player2 wins
			console.log("rock wins");

			database.ref("outcome").set("rock wins!");
			database.ref("players/player1/loss").set(player1.loss + 1);
			database.ref("players/player2/win").set(player2.win + 1);
		} else if (player2.choice === "p") {
			// Player1 wins
			console.log("scissors win");

			database.ref("outcome").set("scissors win!");
			database.ref("players/player1/win").set(player1.win + 1);
			database.ref("players/player2/loss").set(player2.loss + 1);
		} else {
			// draw
			console.log("draw");

			database.ref("outcome").set("it's a draw!");
			database.ref("players/player1/draw").set(player1.draw + 1);
			database.ref("players/player2/draw").set(player2.draw + 1);
		}

	}

	// Set the turn value to 1, as it is now player1's turn
	turn = 1;
	database.ref("turn").set(1);
}