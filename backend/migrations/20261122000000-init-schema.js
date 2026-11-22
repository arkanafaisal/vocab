'use strict';

const fs = require('fs');
const path = require('path');

exports.up = function(db) {
  const filePath = path.join(__dirname, 'V1__init_schema.sql');
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function(err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  }).then(function(sql) {
    return db.runSql(sql);
  });
};

exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS data; DROP TABLE IF EXISTS users;');
};

exports._meta = {
  "version": 1
};
