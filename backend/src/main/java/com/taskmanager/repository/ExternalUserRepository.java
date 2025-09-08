package com.taskmanager.repository;

import com.taskmanager.model.ExternalUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExternalUserRepository extends JpaRepository<ExternalUser, String> {
    List<ExternalUser> findByIsActiveTrue();
    List<ExternalUser> findByNameContainingIgnoreCase(String name);
}
