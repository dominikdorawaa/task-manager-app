package com.taskmanager.controller;

import com.taskmanager.model.ExternalUser;
import com.taskmanager.service.ExternalUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external-users")
@RequiredArgsConstructor
public class ExternalUserController {

    private final ExternalUserService externalUserService;

    @GetMapping
    public ResponseEntity<List<ExternalUser>> getAllUsers(
            @RequestParam(required = false) String search) {
        List<ExternalUser> users;
        if (search != null && !search.trim().isEmpty()) {
            users = externalUserService.searchUsers(search);
        } else {
            users = externalUserService.getAllUsers();
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ExternalUser>> getActiveUsers() {
        List<ExternalUser> users = externalUserService.getActiveUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExternalUser> getUserById(@PathVariable String id) {
        ExternalUser user = externalUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody ExternalUser user) {
        try {
            ExternalUser createdUser = externalUserService.createUser(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Użytkownik został dodany");
            response.put("user", createdUser);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Błąd podczas dodawania użytkownika: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable String id,
            @RequestBody ExternalUser userDetails) {
        try {
            ExternalUser updatedUser = externalUserService.updateUser(id, userDetails);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Użytkownik został zaktualizowany");
            response.put("user", updatedUser);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Błąd podczas aktualizacji użytkownika: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String id) {
        try {
            externalUserService.deleteUser(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Użytkownik został usunięty");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Błąd podczas usuwania użytkownika: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
