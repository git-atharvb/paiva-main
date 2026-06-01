package com.paiva.repository;

import com.paiva.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Custom method to find a user by their email address.
     * Wrapped in an Optional to handle cases where the user might not exist safely.
     */
    Optional<User> findByEmail(String email);

    // Checks if an email is already registered in the database
    Boolean existsByEmail(String email);
}