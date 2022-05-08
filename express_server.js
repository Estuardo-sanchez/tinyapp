const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
const { redirect } = require("express/lib/response");
const res = require("express/lib/response");
const req = require("express/lib/request");
const bcrypt = require("bcryptjs");

app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");

app.use(cookieSession({
  name: "session",
  keys: ["key1 ,key2"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");

const { checkForUserEmail, urlsForUser, generateRandomString } = require("./helpers");

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
  const userID = req.session.user_id;
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
  if (!req.session.user_id) {
    return res.redirect("/login")
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (!req.session.user_id) {
    res.send("URL does not belong to you");
    return;
  }
  const url = urlDatabase[req.params.shortURL];
  if (url.userID !== req.session.user_id) {
    res.send("URL does not belong to you");
    return;
  }
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL}
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id) {
    res.send("URL does not belong to you");
    return;
  }
  const url = urlDatabase[req.params.shortURL];
  if (url.userID !== req.session.user_id) {
    res.send("URL does not belong to you");
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const user = checkForUserEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID;
      res.redirect("/urls");
    } else {
      res.status(403).send("Incorrect password. Please try agin.");
    }
  } else {
    res.status(403).send("This email address is not registered.")
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(!urlDatabase[shortURL]) {
    res.send('Cannot do that.')
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
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
    user: users[req.session.user_id]
   };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  }
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  if (!req.body.email && !req.body.password){
    res.status(400).send("Enter email and password");
  } else if (checkForUserEmail(req.body.email, users)) {
    res.status(400).send("Email already registered");
  } else {
    let userID = generateRandomString();
    users[userID] = {
      userID,
      email: req.body.email,
      password: hashedPassword
    }
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});