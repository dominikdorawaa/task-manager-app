package com.taskmanager.service;

import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.dto.CreateTaskRequest;
import com.taskmanager.dto.UpdateTaskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserService userService;

    @Transactional
    public Task createTask(Task task, Long userId) {
        User user = userService.getUserById(userId);
        task.setUser(user);
        return taskRepository.save(task);
    }

    @Transactional
    public Task createTaskWithoutUser(Task task) {
        // Tworzymy zadanie bez przypisanego użytkownika
        task.setUser(null);
        return taskRepository.save(task);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getUserTasks(Long userId) {
        return taskRepository.findByUser_Id(userId);
    }

    public List<Task> getUserTasksByStatus(Long userId, Task.TaskStatus status) {
        return taskRepository.findByUser_IdAndStatus(userId, status);
    }

    public Task getTaskById(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + taskId));
    }

    @Transactional
    public Task updateTask(Long taskId, Task taskDetails) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (taskDetails.getTitle() != null) {
            task.setTitle(taskDetails.getTitle());
        }
        if (taskDetails.getDescription() != null) {
            task.setDescription(taskDetails.getDescription());
        }
        if (taskDetails.getStatus() != null) {
            task.setStatus(taskDetails.getStatus());
        }
        if (taskDetails.getPriority() != null) {
            task.setPriority(taskDetails.getPriority());
        }
        if (taskDetails.getDueDate() != null) {
            task.setDueDate(taskDetails.getDueDate());
        }

        return taskRepository.save(task);
    }

    @Transactional
    public Task updateTaskFromRequest(Long taskId, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getTaskStatus() != null) {
            task.setStatus(request.getTaskStatus());
        }
        if (request.getTaskPriority() != null) {
            task.setPriority(request.getTaskPriority());
        }

        // Obsługa daty
        if (request.getDueDate() != null && !request.getDueDate().trim().isEmpty()) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(request.getDueDate());
                task.setDueDate(date.atStartOfDay()); // Konwersja na LocalDateTime
            } catch (Exception e) {
                // Nie zmieniamy daty jeśli parsowanie się nie udało
            }
        } else if (request.getDueDate() != null && request.getDueDate().trim().isEmpty()) {
            // Jeśli przesłano pusty string, usuń datę
            task.setDueDate(null);
        }

        // Obsługa tagów
        if (request.getTags() != null) {
            task.setTags(request.getTags());
        }

        // Obsługa zdjęć
        if (request.getImages() != null) {
            task.setImages(request.getImages());
        }

        // Obsługa przypisania użytkownika
        if (request.getAssignedTo() != null) {
            if (request.getAssignedTo().trim().isEmpty()) {
                // Jeśli przesłano pusty string, przypisz automatycznie do siebie
                task.setAssignedTo(task.getClerkUserId());
            } else {
                task.setAssignedTo(request.getAssignedTo());
            }
        }

        return taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }

    public List<Task> getTasksByStatus(Task.TaskStatus status) {
        return taskRepository.findByStatus(status);
    }

    @Transactional
    public Task createTaskForClerkUser(Task task, String clerkUserId) {
        // Zadanie bez przypisanego User obiektu, ale z clerkUserId
        task.setUser(null);
        task.setClerkUserId(clerkUserId); // Dodamy to pole do modelu Task
        return taskRepository.save(task);
    }

    public List<Task> getTasksForClerkUser(String clerkUserId, String userEmail) {
        System.out.println("=== GET TASKS FOR CLERK USER DEBUG ===");
        System.out.println("clerkUserId: " + clerkUserId);
        System.out.println("userEmail: " + userEmail);
        
        // Pobierz zadania utworzone przez użytkownika
        List<Task> createdTasks = taskRepository.findByClerkUserId(clerkUserId);
        System.out.println("Created tasks count: " + createdTasks.size());
        
        // Pobierz zadania przypisane do użytkownika po clerkUserId (ale nie utworzone przez niego)
        // Używamy prostszej metody która obsługuje ID z nawiasami
        List<Task> assignedTasksByUserId = taskRepository.findByAssignedToContainingAndClerkUserIdNot(clerkUserId, clerkUserId);
        System.out.println("Assigned tasks by userId count: " + assignedTasksByUserId.size());
        
        // Pobierz zadania przypisane do użytkownika po emailu (ale nie utworzone przez niego)
        List<Task> assignedTasksByEmail = new ArrayList<>();
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            assignedTasksByEmail = taskRepository.findByAssignedToAndClerkUserIdNot(userEmail, clerkUserId);
            System.out.println("Assigned tasks by email count: " + assignedTasksByEmail.size());
        }
        
        // Pobierz zadania udostępnione użytkownikowi
        List<Task> sharedTasks = taskRepository.findBySharedWithContainingAndClerkUserIdNot(clerkUserId, clerkUserId);
        System.out.println("Shared tasks count: " + sharedTasks.size());
        
        // Połącz listy
        List<Task> allTasks = new ArrayList<>();
        allTasks.addAll(createdTasks);
        allTasks.addAll(assignedTasksByUserId);
        allTasks.addAll(assignedTasksByEmail);
        allTasks.addAll(sharedTasks);
        
        System.out.println("Total tasks returned: " + allTasks.size());
        
        return allTasks;
    }

    @Transactional
    public Task createTaskFromRequest(CreateTaskRequest request, String clerkUserId) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getTaskStatus());
        task.setPriority(request.getTaskPriority());
        task.setClerkUserId(clerkUserId);
        task.setUser(null);

        // Obsługa daty
        if (request.getDueDate() != null && !request.getDueDate().trim().isEmpty()) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(request.getDueDate());
                task.setDueDate(date.atStartOfDay()); // Konwersja na LocalDateTime
            } catch (Exception e) {
                task.setDueDate(null);
            }
        }

        // Obsługa tagów
        if (request.getTags() != null && request.getTags().length > 0) {
            task.setTags(request.getTags());
        }

        // Obsługa zdjęć
        if (request.getImages() != null && request.getImages().length > 0) {
            task.setImages(request.getImages());
        }

        // Obsługa przypisania użytkownika
        if (request.getAssignedTo() != null && !request.getAssignedTo().trim().isEmpty()) {
            task.setAssignedTo(request.getAssignedTo());
        } else {
            // Jeśli nie przypisano do nikogo, przypisz automatycznie do siebie
            task.setAssignedTo(clerkUserId);
        }

        return taskRepository.save(task);
    }

    @Transactional
    public Task shareTask(Long taskId, List<String> userIds, String clerkUserId) {
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        System.out.println("Found task: " + task.getTitle());
        System.out.println("Task clerkUserId: " + task.getClerkUserId());
        System.out.println("Current sharedWith: " + java.util.Arrays.toString(task.getSharedWith()));

        // Sprawdź czy użytkownik ma prawo do udostępniania tego zadania
        if (task.getClerkUserId() == null) {
            throw new RuntimeException("Zadanie nie ma przypisanego właściciela");
        }
        
        if (!task.getClerkUserId().equals(clerkUserId)) {
            throw new RuntimeException("Nie masz uprawnień do udostępniania tego zadania. Właściciel: " + task.getClerkUserId() + ", Ty: " + clerkUserId);
        }

        // Pobierz obecną listę udostępnionych użytkowników
        String[] currentSharedWith = task.getSharedWith();
        List<String> sharedWithList = new ArrayList<>();
        if (currentSharedWith != null) {
            sharedWithList.addAll(java.util.Arrays.asList(currentSharedWith));
        }

        // Dodaj nowych użytkowników (bez duplikatów)
        for (String userId : userIds) {
            if (!sharedWithList.contains(userId)) {
                sharedWithList.add(userId);
            }
        }

        // Ustaw zaktualizowaną listę
        task.setSharedWith(sharedWithList.toArray(new String[0]));

        System.out.println("Updated sharedWith: " + java.util.Arrays.toString(task.getSharedWith()));
        
        Task savedTask = taskRepository.save(task);
        System.out.println("Task saved successfully with ID: " + savedTask.getId());
        System.out.println("Saved task sharedWith: " + java.util.Arrays.toString(savedTask.getSharedWith()));
        
        // Sprawdź czy zadanie zostało rzeczywiście zapisane w bazie
        Task verifyTask = taskRepository.findById(taskId).orElse(null);
        if (verifyTask != null) {
            System.out.println("Verification - Task sharedWith in DB: " + java.util.Arrays.toString(verifyTask.getSharedWith()));
        } else {
            System.out.println("ERROR: Task not found in DB after save!");
        }
        
        return savedTask;
    }

}