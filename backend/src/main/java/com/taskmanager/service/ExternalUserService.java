package com.taskmanager.service;

import com.taskmanager.model.ExternalUser;
import com.taskmanager.repository.ExternalUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExternalUserService {
    private final ExternalUserRepository externalUserRepository;

    public List<ExternalUser> getAllUsers() {
        return externalUserRepository.findAll();
    }

    public List<ExternalUser> getActiveUsers() {
        return externalUserRepository.findByIsActiveTrue();
    }

    public List<ExternalUser> searchUsers(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllUsers();
        }
        return externalUserRepository.findByNameContainingIgnoreCase(searchTerm.trim());
    }

    public ExternalUser getUserById(String id) {
        return externalUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("External user not found with id: " + id));
    }

    @Transactional
    public ExternalUser createUser(ExternalUser user) {
        // Sprawdź czy użytkownik już istnieje
        if (externalUserRepository.existsById(user.getId())) {
            throw new RuntimeException("Użytkownik z tym ID już istnieje: " + user.getId());
        }

        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return externalUserRepository.save(user);
    }

    @Transactional
    public ExternalUser updateUser(String id, ExternalUser userDetails) {
        ExternalUser user = getUserById(id);

        if (userDetails.getName() != null) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getIsActive() != null) {
            user.setIsActive(userDetails.getIsActive());
        }

        user.setUpdatedAt(LocalDateTime.now());
        return externalUserRepository.save(user);
    }

    @Transactional
    public void deleteUser(String id) {
        ExternalUser user = getUserById(id);
        externalUserRepository.delete(user);
    }
}
