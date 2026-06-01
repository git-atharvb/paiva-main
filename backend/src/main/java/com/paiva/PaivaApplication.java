package com.paiva;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class PaivaApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaivaApplication.class, args);
    }
}