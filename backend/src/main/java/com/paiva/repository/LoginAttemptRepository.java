package com.paiva.repository;

import com.paiva.model.LoginAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface LoginAttemptRepository extends MongoRepository<LoginAttempt, String> {
    List<LoginAttempt> findByEmailAndAttemptTimeAfter(String email, Instant time);
}
