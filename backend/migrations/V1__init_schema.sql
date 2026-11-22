CREATE TABLE IF NOT EXISTS users (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)     NOT NULL UNIQUE,
    email       VARCHAR(100)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    score       INT             NOT NULL DEFAULT 0,
    streak      INT             NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    vocab       VARCHAR(13)     NOT NULL UNIQUE,
    meaning     VARCHAR(15)     NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
