CREATE DATABASE IF NOT EXISTS `chat` DEFAULT CHARSET=utf8 DEFAULT COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `username_uk` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 DEFAULT COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS `messages` (
    `user_id` int(11) NOT NULL,
    `text` text NOT NULL,
    `time` varchar(255) NOT NULL,
    FOREIGN KEY `users_fk` (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 DEFAULT COLLATE=utf8_general_ci;
