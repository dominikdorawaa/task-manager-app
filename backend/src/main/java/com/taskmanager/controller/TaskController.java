package com.taskmanager.controller;

import com.taskmanager.model.Task;
import com.taskmanager.service.TaskService;
import com.taskmanager.dto.CreateTaskRequest;
import com.taskmanager.dto.UpdateTaskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody CreateTaskRequest request, Authentication authentication) {
        System.out.println("=== CREATE TASK DEBUG ===");
        System.out.println("Authentication: " + (authentication != null ? authentication.getName() : "NULL"));
        System.out.println("Task request: " + request);
        
        if (authentication == null) {
            System.out.println("Authentication is NULL - returning 401");
            return ResponseEntity.status(401).build();
        }

        String clerkUserId = authentication.getName(); // To jest Clerk User ID
        System.out.println("Creating task for Clerk user: " + clerkUserId);
        Task createdTask = taskService.createTaskFromRequest(request, clerkUserId);
        System.out.println("Task created successfully: " + createdTask.getId());
        return ResponseEntity.ok(createdTask);
    }

    @GetMapping
    public ResponseEntity<List<Task>> getUserTasks(
            Authentication authentication,
            @RequestParam(required = false) String userEmail) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String clerkUserId = authentication.getName(); // To jest Clerk User ID
        
        System.out.println("Getting tasks for Clerk user: " + clerkUserId + ", email: " + userEmail);
        List<Task> tasks = taskService.getTasksForClerkUser(clerkUserId, userEmail);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long taskId) {
        Task task = taskService.getTaskById(taskId);
        return ResponseEntity.ok(task);
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long taskId,
            @RequestBody UpdateTaskRequest request,
            Authentication authentication) {
        
        System.out.println("=== UPDATE TASK DEBUG ===");
        System.out.println("Task ID: " + taskId);
        System.out.println("Update request: " + request);
        System.out.println("Authentication: " + (authentication != null ? authentication.getName() : "NULL"));
        
        if (authentication == null) {
            System.out.println("Authentication is NULL - returning 401");
            return ResponseEntity.status(401).build();
        }

        Task updatedTask = taskService.updateTaskFromRequest(taskId, request);
        System.out.println("Task updated successfully: " + updatedTask.getId());
        System.out.println("Updated task images: " + java.util.Arrays.toString(updatedTask.getImages()));
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Task>> getTasksByStatus(@PathVariable Task.TaskStatus status) {
        // Zwracamy wszystkie zadania o danym statusie
        List<Task> tasks = taskService.getTasksByStatus(status);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/stats/summary")
    public ResponseEntity<Map<String, Object>> getTaskStats() {
        List<Task> tasks = taskService.getAllTasks();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", tasks.size());
        stats.put("completed", tasks.stream().mapToInt(t -> t.getStatus() == Task.TaskStatus.ZAKONCZONE ? 1 : 0).sum());
        stats.put("overdue", tasks.stream().mapToInt(t -> 
            t.getDueDate() != null && t.getDueDate().isBefore(java.time.LocalDateTime.now()) && 
            t.getStatus() != Task.TaskStatus.ZAKONCZONE ? 1 : 0).sum());

        // Statystyki według statusu
        List<Map<String, Object>> byStatus = new java.util.ArrayList<>();
        for (Task.TaskStatus status : Task.TaskStatus.values()) {
            int count = (int) tasks.stream().filter(t -> t.getStatus() == status).count();
            Map<String, Object> statusStat = new HashMap<>();
            statusStat.put("_id", status.getDisplayName());
            statusStat.put("count", count);
            byStatus.add(statusStat);
        }
        stats.put("byStatus", byStatus);

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{taskId}/share")
    public ResponseEntity<Map<String, Object>> shareTask(
            @PathVariable Long taskId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String clerkUserId = authentication.getName();
        @SuppressWarnings("unchecked")
        java.util.List<String> userIds = (java.util.List<String>) request.get("userIds");
        String message = (String) request.get("message");

        System.out.println("=== SHARE TASK DEBUG ===");
        System.out.println("Task ID: " + taskId);
        System.out.println("User IDs: " + userIds);
        System.out.println("Message: " + message);
        System.out.println("Clerk User ID: " + clerkUserId);

        try {
            Task sharedTask = taskService.shareTask(taskId, userIds, clerkUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Zadanie zostało udostępnione");
            response.put("task", sharedTask);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error sharing task: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Błąd podczas udostępniania zadania: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

}
