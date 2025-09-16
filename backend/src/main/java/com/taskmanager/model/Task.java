package com.taskmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Alias dla frontendu
    public String get_id() {
        return id != null ? id.toString() : null;
    }

    @NotBlank
    @Size(max = 500, message = "Tytuł nie może być dłuższy niż 500 znaków")
    @Column(length = 500)
    private String title;

    @Size(max = 3000, message = "Opis nie może być dłuższy niż 3000 znaków")
    @Column(name = "description_text", columnDefinition = "text")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.DO_ZROBIENIA;

    @NotNull
    @Enumerated(EnumType.STRING)
    private TaskPriority priority = TaskPriority.SREDNI;

    @NotNull
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private User user;

    // Clerk User ID - dla integracji z Clerk
    @Column(name = "clerk_user_id")
    private String clerkUserId;

    // Przypisani użytkownicy (Clerk User IDs) - JSON array
    @Column(name = "assigned_to", columnDefinition = "text")
    private String assignedTo;

    // Notatka od przypisanego użytkownika
    @Size(max = 1000, message = "Notatka nie może być dłuższa niż 1000 znaków")
    @Column(name = "assigned_user_note", columnDefinition = "text")
    @JsonProperty("assignedUserNote")
    private String assignedUserNote;

    // ID użytkownika który dodał notatkę
    @Column(name = "assigned_user_note_author")
    @JsonProperty("assignedUserNoteAuthor")
    private String assignedUserNoteAuthor;

    // Tagi jako JSON string
    @Column(name = "tags", columnDefinition = "text")
    private String tags;

    // Zdjęcia jako JSON string (ścieżki do plików)
    @Column(name = "images", columnDefinition = "text")
    private String images;

    // Pola dla systemu udostępniania
    @Column(name = "shared_with", columnDefinition = "text")
    private String sharedWith; // JSON array z ID użytkowników

    @Column(name = "share_requests", columnDefinition = "text")
    private String shareRequests; // JSON array z ID użytkowników

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @Column(name = "is_shared_with_me")
    private Boolean isSharedWithMe = false;

    // Pola dla frontendu
    public String getUserId() {
        return user != null ? user.getId().toString() : null;
    }

    public String getCreatedAt() {
        return createdAt != null ? createdAt.toString() : null;
    }

    public String getUpdatedAt() {
        return java.time.LocalDateTime.now().toString();
    }

    @JsonProperty("dueDate")
    public String getDueDateForFrontend() {
        return dueDate != null ? dueDate.toString() : null;
    }

    public String getCompletedAt() {
        return status == TaskStatus.ZAKONCZONE ? java.time.LocalDateTime.now().toString() : null;
    }

    // Parsowanie tagów JSON
    @JsonProperty("tags")
    public String[] getTags() {
        if (tags == null || tags.trim().isEmpty()) {
            return new String[0];
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(tags, String[].class);
        } catch (Exception e) {
            return new String[0];
        }
    }

    public void setTags(String[] tagsArray) {
        if (tagsArray == null || tagsArray.length == 0) {
            this.tags = null;
        } else {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                this.tags = mapper.writeValueAsString(tagsArray);
            } catch (Exception e) {
                this.tags = null;
            }
        }
    }

    // Parsowanie zdjęć JSON
    @JsonProperty("images")
    public String[] getImages() {
        if (images == null || images.trim().isEmpty()) {
            return new String[0];
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(images, String[].class);
        } catch (Exception e) {
            return new String[0];
        }
    }

    public void setImages(String[] imagesArray) {
        if (imagesArray == null || imagesArray.length == 0) {
            this.images = null;
        } else {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                this.images = mapper.writeValueAsString(imagesArray);
            } catch (Exception e) {
                this.images = null;
            }
        }
    }

    // Parsowanie sharedWith JSON
    @JsonProperty("sharedWith")
    public String[] getSharedWith() {
        if (sharedWith == null || sharedWith.trim().isEmpty()) {
            return new String[0];
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(sharedWith, String[].class);
        } catch (Exception e) {
            return new String[0];
        }
    }

    public void setSharedWith(String[] sharedWithArray) {
        if (sharedWithArray == null || sharedWithArray.length == 0) {
            this.sharedWith = null;
        } else {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                this.sharedWith = mapper.writeValueAsString(sharedWithArray);
            } catch (Exception e) {
                this.sharedWith = null;
            }
        }
    }

    // Parsowanie shareRequests JSON
    @JsonProperty("shareRequests")
    public String[] getShareRequests() {
        if (shareRequests == null || shareRequests.trim().isEmpty()) {
            return new String[0];
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(shareRequests, String[].class);
        } catch (Exception e) {
            return new String[0];
        }
    }

    public void setShareRequests(String[] shareRequestsArray) {
        if (shareRequestsArray == null || shareRequestsArray.length == 0) {
            this.shareRequests = null;
        } else {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                this.shareRequests = mapper.writeValueAsString(shareRequestsArray);
            } catch (Exception e) {
                this.shareRequests = null;
            }
        }
    }

    // Parsowanie assignedTo JSON
    @JsonProperty("assignedTo")
    public String[] getAssignedTo() {
        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            return new String[0];
        }
        
        String trimmed = assignedTo.trim();
        
        // Sprawdź czy to JSON array
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.readValue(trimmed, String[].class);
            } catch (Exception e) {
                System.err.println("Error parsing assignedTo JSON: " + e.getMessage());
                // Jeśli parsowanie się nie udało, traktuj jako pojedynczy string
                return new String[]{trimmed};
            }
        } else {
            // To jest pojedynczy string (stare dane)
            return new String[]{trimmed};
        }
    }

    public void setAssignedTo(String[] assignedToArray) {
        if (assignedToArray == null || assignedToArray.length == 0) {
            this.assignedTo = null;
        } else {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                this.assignedTo = mapper.writeValueAsString(assignedToArray);
            } catch (Exception e) {
                this.assignedTo = null;
            }
        }
    }

    public enum TaskStatus {
        DO_ZROBIENIA("do zrobienia"),
        W_TRAKCIE("w trakcie"), 
        ZAKONCZONE("zakończone"),
        ANULOWANE("anulowane");

        private final String displayName;

        TaskStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum TaskPriority {
        NISKI("niski"),
        SREDNI("średni"),
        WYSOKI("wysoki"),
        KRYTYCZNY("krytyczny");

        private final String displayName;

        TaskPriority(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
