const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
const { redirect } = require("express/lib/response");
const res = require("express/lib/response");
const req = require("express/lib/request");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
  let randomString = ' ';
  let charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return randomString;
};

const checkForUserEmail = function(email, database) {
  for (const user in users) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
}

const urlsForUser = (id, database) => {
  let usersUrl = {};

  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      usersUrl[shortURL] = database[shortURL];
    }
  }
  return usersUrl;
};

const users = {
  "userRandomID": {
    userID: "userRandomID",
    email: "user@example.com",
    password: "a"
  },
  "user2RandomID": {
    userID: "user2RandomID",
    email: "user2@example.com",
    password: "a"
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[userID],
    urls: userUrls
  }
  if (!userID) {
    res.send("Login to access URLS");
    return;
  }
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  if (!req.cookies["user_id"]) {
    return res.redirect("/login")
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {longURL, userID: req.cookies["user_id"]};
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send("no");
    return;
  }
  const url = urlDatabase[req.params.shortURL];
  if (url.userID !== req.cookies["user_id"]) {
    res.send("no2");
    return;
  }
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL}
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send("No");
    return;
  }
  const url = urlDatabase[req.params.shortURL];
  if (url.userID !== req.cookies["user_id"]) {
    res.send("No2");
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const user = checkForUserEmail(req.body.email, users);
  if (user) {
    if (req.body.password === user.password) {
      res.cookie("user_id", user.userID);
      res.redirect("/urls");
    } else {
      res.status(403).send("Incorrect password. Please try agin.");
    }
  } else {
    res.status(403).send("This email address is not registered.")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(!urlDatabase[shortURL]) {
    res.send('CHILL')
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    }
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});
    
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
   };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email && !req.body.password){
    res.status(400).send("Enter email and password");
  } else if (checkForUserEmail(req.body.email, users)) {
    res.status(400).send("Email already registered");
  } else {
    let userID = generateRandomString();
    users[userID] = {
      userID,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});