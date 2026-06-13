package com.paiva.repository;

import com.paiva.model.Note;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends MongoRepository<Note, String> {
    List<Note> findByUserIdOrderByUpdatedAtDesc(String userId);
    void deleteByUserId(String userId);
}
