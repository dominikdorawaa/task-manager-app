package com.taskmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    private String title;

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

    // Przypisany użytkownik (Clerk User ID)
    @Column(name = "assigned_to")
    private String assignedTo;

    // Tagi jako JSON string
    @Column(name = "tags", columnDefinition = "text")
    private String tags;

    // Zdjęcia jako JSON string (ścieżki do plików)
    @Column(name = "images", columnDefinition = "text")
    private String images;

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
