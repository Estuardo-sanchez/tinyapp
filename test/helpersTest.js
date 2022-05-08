const { assert } = require('chai');

const { checkForUserEmail, generateRandomString, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "a"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "a"
  }
};

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

describe('checkForUserEmail', function() {
  it('should return a user with valid email', function() {
    const user = checkForUserEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it("returns undefined with an invalid email", function() {
    const user = checkForUserEmail("user5@example.com", testUsers);
    assert.strictEqual(user, undefined);
  });
});

describe('generateRandomString',() => {
  it('strings should not be the same', function() {
    const string0 = generateRandomString();
    const string1 = generateRandomString();
    assert.notEqual(string0, string1);
  });
});

describe('urlsForUser', function() {
  it('should return short urls from url database that match the user id', function() {
    const user = "user2RandomID";
    const urls = urlsForUser(user, testUrlDatabase);
    const expectedUrls = {
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "user2RandomID"
      }
    };
    assert.deepEqual(urls, expectedUrls);
  });
});