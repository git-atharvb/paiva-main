package com.paiva.controllers;

import com.paiva.model.Note;
import com.paiva.repository.NoteRepository;
import com.paiva.security.service.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @GetMapping
    public ResponseEntity<List<Note>> getAllNotes() {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(noteRepository.findByUserIdOrderByUpdatedAtDesc(userId));
    }

    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Note noteRequest) {
        String userId = getCurrentUserId();
        Note note = new Note(userId, noteRequest.getTitle(), noteRequest.getContent(), noteRequest.getIsPinned(), noteRequest.getTags(), noteRequest.getColor());
        return ResponseEntity.ok(noteRepository.save(note));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable String id, @RequestBody Note noteRequest) {
        String userId = getCurrentUserId();
        Optional<Note> optNote = noteRepository.findById(id);
        
        if (optNote.isPresent()) {
            Note note = optNote.get();
            if (!note.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("Unauthorized");
            }
            note.setTitle(noteRequest.getTitle());
            note.setContent(noteRequest.getContent());
            note.setIsPinned(noteRequest.getIsPinned());
            if (noteRequest.getTags() != null) {
                note.setTags(noteRequest.getTags());
            }
            if (noteRequest.getColor() != null) {
                note.setColor(noteRequest.getColor());
            }
            return ResponseEntity.ok(noteRepository.save(note));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable String id) {
        String userId = getCurrentUserId();
        Optional<Note> optNote = noteRepository.findById(id);
        
        if (optNote.isPresent()) {
            Note note = optNote.get();
            if (!note.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("Unauthorized");
            }
            noteRepository.delete(note);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }
}
