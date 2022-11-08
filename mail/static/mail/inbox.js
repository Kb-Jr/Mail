document.addEventListener("DOMContentLoaded", function () {

  document
  .querySelector("#inbox")
  .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);


  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  //Load Inbox by default
  load_mailbox("inbox");
});

function send_email(event) {
  event.preventDefault();


  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  // Send data to db.
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
  //parse the returned data in JSON format.
    .then((response) => response.json())
    .then((result) => {
      load_mailbox("sent", result);
    })
    .catch((error) => console.log(error));
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox, message = "") {
  document.querySelector("#message-div").textContent = "";

  //Display message, if message.
  if (message !== "") {
    make_alert(message);
  }

  //Display mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#emails-view").innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

  //Retrieve mailbox from Db.
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((item) => {

        const parent_element = document.createElement("div");

        build_emails(item, parent_element, mailbox);

        parent_element.addEventListener("click", () => read_email(item["id"]));
        document.querySelector("#emails-view").appendChild(parent_element);

      });
    })
    .catch((error) => console.error(error));
}

//Display a bootstrap events alert
function make_alert(message) {
  const element = document.createElement("div");
  element.classList.add("alert");

  if (message["message"]) {
    element.classList.add("alert-success");
    element.innerHTML = message["message"];
  } else if (message["error"]) {
    element.classList.add("alert-danger");
    element.innerHTML = message["error"];
  }

  document.querySelector("#message-div").appendChild(element);
}



function build_emails(item, parent_element, mailbox) {
  if (mailbox === "inbox" && item["archived"]) {
    return;
  }
  else if (mailbox === "archive" && !item["archived"]) {
    return;
  }

  const content = document.createElement("div");

  const recipients = document.createElement("strong");
  if (mailbox === "sent") {
    recipients.innerHTML = item["recipients"].join(", ") + " ";
  }
  else {
    recipients.innerHTML = item["sender"] + " ";
  }
  content.appendChild(recipients);

  content.innerHTML += item["subject"];

  //date and styling.
  const date = document.createElement("div");
  date.innerHTML = item["timestamp"];
  date.style.display = "inline-block";
  date.style.float = "right";

  if (item["read"]) {
    parent_element.style.backgroundColor = "#CFD2CF";
    date.style.color = "black";
  } else {
    date.className = "text-muted";
  }
  content.appendChild(date);

  content.style.padding = "15px";
  parent_element.appendChild(content);


  //Style parent element.
  parent_element.style.borderStyle = "solid";
  parent_element.style.borderWidth = "0px";
  parent_element.style.margin = "5px";
}



function read_email(id) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";

  document.querySelector("#email-view").innerHTML = "";
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(result => {
      build_email(result);
    })
    .catch(error => console.log(error));

  //email status to 'read'.
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}



function build_email(data) {
  const from = document.createElement("div");
  const to = document.createElement("div");
  const subject = document.createElement("div");
  const timestamp = document.createElement("div");
  const reply_button = document.createElement("button");
  const archive_button = document.createElement("button");
  const body = document.createElement("div");

  from.innerHTML = `<strong>From: </strong> ${data["sender"]}`;
  to.innerHTML = `<strong>To: </strong> ${data["recipients"].join(", ")}`;
  subject.innerHTML = `<strong>Subject: </strong> ${data["subject"]}`;
  timestamp.innerHTML = `<strong>Timestamp: </strong> ${data["timestamp"]}`;
  body.innerHTML = data["body"];



//Archive and unarchive
  archive_button.innerHTML = ' ';
  if (data["archived"]) {
    archive_button.innerHTML += "Unarchive";
  } else {
    archive_button.innerHTML += "Archive";
  }
  archive_button.classList = "btn btn-primary m-2";
  archive_button.addEventListener("click", () => {
    archive_email(data);
    load_mailbox("inbox");
  });


  
//Reply
  reply_button.innerHTML = 'Reply';
  reply_button.classList = "btn btn-primary m-2";
  reply_button.addEventListener("click", () => compose_reply(data));

  document.querySelector("#email-view").appendChild(from);
  document.querySelector("#email-view").appendChild(to);
  document.querySelector("#email-view").appendChild(subject);
  document.querySelector("#email-view").appendChild(timestamp);
  document.querySelector("#email-view").appendChild(archive_button);
  document.querySelector("#email-view").appendChild(reply_button);
  document.querySelector("#email-view").appendChild(document.createElement("hr"));
  document.querySelector("#email-view").appendChild(body);
}



// archive or unarchive status
function archive_email(data) {
  fetch(`/emails/${data["id"]}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !data["archived"]
    })
  });
}


//Compose reply
function compose_reply(data) {
//Show the compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";



  document.querySelector("#compose-recipients").value = data["sender"];
  document.querySelector("#compose-subject").value = ((data["subject"].match(/^(Re:)\s/)) ? data["subject"] : "Re: " + data["subject"]);
  document.querySelector("#compose-body").value = `On ${data["timestamp"]} ${data["sender"]} Sent:\n${data["body"]}`;
}