const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* Link Datastructure */
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.bleh.com", userID: "userRandomID" },
  "b2xVn1": { longURL: "http://www.blah.ca", userID: "user2RandomID" },
  "9sm5xd": { longURL: "http://www.blop.com", userID: "user2RandomID" },
  "9sm5xd": { longURL: "http://www.bloop.com", userID: "asdf" },
};

/* Users datastruct */
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "asdf": {
    id: "asdf",
    email: "asdf@asdf",
    password: "asdf"
  }
};

/*
generates a random string of 6 alphanumeric chars and returns
*/
let generateRandomString = () => {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charLength = chars.length;
  let shortUrl = [];
  chars = chars.split("");

  for (let i = 0; i < 6; i++) {
    let randomNum = Math.floor(Math.random() * charLength);
    shortUrl.push(chars[randomNum]);
  }

  return shortUrl.join("");
};

/* checks whether the email exists in our datastructure */
let checkEmailExists = (lookup) => {
  for (const id in users) {
    if (users[id].email === lookup)
      return true;
  }
  return false;
};

/* returns the user_id from user data using the email */
let getUserIdfromEmail = (lookup) => {
  for (const id in users) {
    if (users[id].email === lookup)
      return id;
  }
  return null;
};

/* returns the objects related to the user */
let getUserObjects = (user) => {
  if (!user) {
    return {};
  }
  let returnObj = {};
  for (let obj in urlDatabase) {
    if (urlDatabase[obj].userID === user) {
      returnObj[obj] = urlDatabase[obj];
    }
  }
  return returnObj;
};

//listens to port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Home page sends hello
app.get("/", (req, res) => {
  res.send("Hello!");
});

//get page for new url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    userId: req.cookies.userId,
    users: users,
  };

  if (req.cookies.userId) {
    res.render("urls_new", templateVars);
  }
  res.render("login", templateVars);

});

//record view for link
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userId: req.cookies.userId,
    users: users,
  };
  if (req.cookies.userId) {
    res.render("urls_show", templateVars);
  }

  res.status(403).send('Forbidden: you are unable to access this information.');
});

//allow to change link
app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies.userId === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL] = {
      longURL: req.body.newLongUrl,
      userID: req.cookies.userId
    };
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userId: req.cookies.userId,
    users: users,
  };

  res.render("urls_show", templateVars);
});

//deletes url
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.userId === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];

    const templateVars = {
      urls: getUserObjects(req.cookies.userId),
      userId: req.cookies.userId,
      users: users,
    };
    res.render("urls_index", templateVars);
  }

  res.status(403).send('Error 403: You do not have permission to delete this entry');

});


//returns list of urls for the logged in user 
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: getUserObjects(req.cookies.userId),
    userId: req.cookies.userId,
    users: users,
  };
  res.render("urls_index", templateVars);
});

//new url
app.post("/urls", (req, res) => {
  let shortLink = generateRandomString();

  urlDatabase[shortLink] = {
    longURL: req.body.longURL,
    userID: req.cookies.userId
  };

  const templateVars = {
    shortURL: shortLink,
    longURL: urlDatabase[shortLink].longURL,
    userId: req.cookies.userId,
    users: users,
  };

  res.render("urls_show", templateVars);
});

//get registration page
app.get("/register", (req, res) => {
  const templateVars = {
    userId: req.body.userId,
    users: users,
  };

  res.render("register", templateVars);
});

//post: register user
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = generateRandomString();

  if (checkEmailExists(email) || !email || !password) {
    res.status(403).send('Email already exists or a field is empty');
  }
  else if (req.body.email && req.body.password) {
    users[id] = {
      id: id,
      email: email,
      password: password
    };

    res.cookie("userId", id);
    res.redirect("/urls");
  }

});

//gets login page
app.get("/login", (req, res) => {
  let id = false;

  if (req.body.userId) {
    id = req.body.userId;
  }
  const templateVars = {
    userId: id,
    users: users,
    status: res.statusCode
  };
  res.render("login", templateVars);
});

//post: handles login
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = false;

  if (email) {
    if (checkEmailExists(email) && password === users[getUserIdfromEmail(email)].password) { //happy path :)
      id = getUserIdfromEmail(email);
      res.cookie("userId", id);
      res.redirect("/urls");
    }
  }
  res.status(403).send('user doesnt exist or a field is empty');
});

//handles logout
app.post("/logout", (req, res) => {
  res.clearCookie("userId");

  const templateVars = {
    userId: req.body.userId,
    urls: getUserObjects(req.cookies.userId),
    users: users,
  };

  res.render("urls_index", templateVars);
});

//edit
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});