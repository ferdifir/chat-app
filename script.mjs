import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJbOB8y83tOLqFXDSrOoT4OuMrvd39BiU",
  authDomain: "chatapp-4c5d0.firebaseapp.com",
  projectId: "chatapp-4c5d0",
  storageBucket: "chatapp-4c5d0.appspot.com",
  messagingSenderId: "801765317923",
  appId: "1:801765317923:web:2b74bc5d6a3e5303458096",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const chatCollection = collection(db, "chat");
var noChatSelected = true;
var selectedUserId = "";
var selectedChat = [];

document.addEventListener("DOMContentLoaded", function () {
  var usernameSelected = document.getElementById("selected-username");
  var imgSelected = document.getElementById("selected-user-image");
  var totalMsg = document.getElementById("selected-total-message");
  var onlineIcon = document.getElementById("online-status");
  var sendBtn = document.getElementById("send-message-btn");
  const contactList = document.getElementById("contact-list");
  const chatQuery = query(chatCollection);
  const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
    console.log(querySnapshot.docs.length);
    querySnapshot.forEach((doc) => {
      contactList.innerHTML = "";
      const listItem = document.createElement("li");
      const userData = doc.data();
      const lastSeen = formatTimestampToAgoOrLastSeen(userData.lastSeen);

      listItem.innerHTML = `
            <div class="d-flex bd-highlight">
                <div class="img_cont">
                    <img src="${
                      userData.imgSrc
                    }" class="rounded-circle user_img">
                    <span id="online-status-icon" class="online_icon"></span>
                </div>
                <div class="user_info">
                    <span>${userData.name}</span>
                    <p>${userData.onlineStatus ? "Online" : lastSeen}</p>
                </div>
            </div>
        `;
      var onlineStatus = listItem.querySelector("#online-status-icon");
      if (!userData.onlineStatus) {
        onlineStatus.classList.remove("online_icon");
        onlineStatus.classList.add("offline");
      }
      listItem.addEventListener("click", function () {
        usernameSelected.innerHTML = "Chat with " + userData.name;
        selectedUserId = userData.id;
        selectedChat = userData.chats;
        imgSelected.src = userData.imgSrc;
        totalMsg.innerHTML = userData.chats.length + " messages";
        noChatSelected = false;
        if (!userData.onlineStatus) {
          onlineIcon.classList.remove("online_icon");
          onlineIcon.classList.add("offline");
        }
        changeSelectedChat(userData.imgSrc, userData.name);
      });
      contactList.appendChild(listItem);
    });
  });

  sendBtn.addEventListener("click", sendMessage);
});

function sendMessage() {
  var messageInput = document.getElementById("message-input");
  const message = messageInput.value;
  if (message !== "") {
    const documentRef = doc(db, "chat", selectedUserId);
    const newMessage = {
      message: message,
      sender: "You",
      timestamp: new Date(),
    };
    selectedChat.push(newMessage);
    updateDoc(documentRef, {
      chats: selectedChat,
    }).then(() => {
      messageInput.value = "";
    });
  } else {
    alert("Please enter a message, before sending");
  }
}

function changeSelectedChat(imgSrc, selectedUser) {
  const noChatSelectedDiv = document.getElementById("illustration-container");
  if (noChatSelectedDiv !== null) {
    noChatSelectedDiv.remove();
  }
  const messageContainer = document.getElementById("message-container");
  const chatQuery = query(chatCollection);
  const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.id === selectedUserId) {
        messageContainer.innerHTML = "";
        userData.chats.forEach((data) => {
          const messageDiv = document.createElement("div");
          const state = data.sender === selectedUser;
          messageDiv.className = `d-flex justify-content-${
            state ? "start" : "end"
          } mb-4`;

          messageDiv.innerHTML = state
            ? `
        <div class="img_cont_msg">
            <img src="${imgSrc}" class="rounded-circle user_img_msg">
        </div>
        <div class="msg_cotainer${state ? "" : "_send"}">
            ${data.message}
            <span class="msg_time${state ? "" : "_send"}">${data.timestamp
                .toDate()
                .toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
        </div>
        `
            : `
        <div class="msg_cotainer${state ? "" : "_send"}">
            ${data.message}
            <span class="msg_time${state ? "" : "_send"}">${data.timestamp
                .toDate()
                .toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
        </div>
        <div class="img_cont_msg">
            <img src="${imgSrc}" class="rounded-circle user_img_msg">
        </div>
        `;

          messageContainer.appendChild(messageDiv);
        });
      }
    });
  });
}

function formatTimestampToAgoOrLastSeen(firestoreTimestamp) {
  const jsDate = firestoreTimestamp.toDate();

  const currentDate = new Date();
  const currentTime = currentDate.getTime();
  const timeDifference = currentTime - jsDate.getTime();

  const minutesAgo = Math.floor(timeDifference / (1000 * 60));

  if (minutesAgo < 1) {
    return "Just now";
  } else if (minutesAgo < 60) {
    return `${minutesAgo} minutes ago`;
  } else {
    const lastSeenTime = jsDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (
      jsDate.getDate() === currentDate.getDate() &&
      jsDate.getMonth() === currentDate.getMonth() &&
      jsDate.getFullYear() === currentDate.getFullYear()
    ) {
      return `Last seen at ${lastSeenTime}`;
    } else {
      // Format last seen as "Last Seen (Day, Time)"
      const options = { weekday: "long" };
      const dayOfWeek = jsDate.toLocaleDateString(undefined, options);
      return `Last Seen ${dayOfWeek}, ${lastSeenTime}`;
    }
  }
}
