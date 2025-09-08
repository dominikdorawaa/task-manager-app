package com.taskmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "external_users")
public class ExternalUser {
    @Id
    @NotBlank
    private String id; // Clerk User ID

    @NotBlank
    private String name;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Pola dla frontendu
    public String getCreatedAt() {
        return createdAt != null ? createdAt.toString() : null;
    }

    public String getUpdatedAt() {
        return updatedAt != null ? updatedAt.toString() : null;
    }
}
