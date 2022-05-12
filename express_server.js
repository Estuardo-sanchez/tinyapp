// REQUIREMENTS
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { checkForUserEmail, urlsForUser, generateRandomString } = require("./helpers");

//SETUP
const app = express();
app.set("view engine", "ejs");
const PORT = 8080;

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["key1 ,key2"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//USERS DATABASE
const users = {};

// URLS DATABASE
const urlDatabase = {};

// ALL ROUTES/ENDPOINTS
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// SHOW ALL URLS
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Login to access URLS");
  }
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[userID],
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

// ROUTE TO CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  console.log(req.body);
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = { longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// ROUTE TO UPDATE LONG URL'S SHORT URL
app.post("/urls/:shortURL/update", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.send("Please login");
    return;
  }
  const url = urlDatabase[req.params.shortURL];
  if (url.userID !== userID) {
    res.send("URL does not belong to you");
    return;
  }
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect('/urls');
});

// ROUTE TO DELETE URL
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

// ROUTE TO SHOW LOGIN
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

// ROUTE FOR LOGIN
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
    res.status(403).send("This email address is not registered.");
  }
});

//ROUTE FOR LOGOUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// ROUTE TO USE SHORT URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.send('Cannot do that.');
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// ROUTE TO SHOW NEW URL ADDED
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// ROUTE FOR A SHORT URL
app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.send("Please log in to view URL");
  }
  const url = urlDatabase[req.params.shortURL]
  console.log(url, req.session.user_id)
  if (url.userID !== req.session.user_id) {
    res.send("URL does not belong to you");
    return;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

// ROUTE FOR REGISTER PAGE
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_registration", templateVars);
});

//ROUTE FOR REGISTRATION DATA
app.post("/register", (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  if (!req.body.email && !req.body.password) {
    res.status(400).send("Enter email and password");
  } else if (checkForUserEmail(req.body.email, users)) {
    res.status(400).send("Email already registered");
  } else {
    let userID = generateRandomString();
    users[userID] = {
      userID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

// LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});