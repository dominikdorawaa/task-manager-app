package com.taskmanager.dto;

import com.taskmanager.model.Task;
import lombok.Data;

@Data
public class CreateTaskRequest {
    private String title;
    private String description;
    private String status;
    private String priority;
    private String dueDate; // String format: YYYY-MM-DD
    private String[] tags;
    private String[] images; // Ścieżki do zdjęć
    private String assignedTo; // Clerk User ID użytkownika przypisanego do zadania

    public Task.TaskStatus getTaskStatus() {
        if (status == null) return Task.TaskStatus.DO_ZROBIENIA;
        
        switch (status.toUpperCase()) {
            case "DO_ZROBIENIA": return Task.TaskStatus.DO_ZROBIENIA;
            case "W_TRAKCIE": return Task.TaskStatus.W_TRAKCIE;
            case "ZAKONCZONE": return Task.TaskStatus.ZAKONCZONE;
            case "ANULOWANE": return Task.TaskStatus.ANULOWANE;
            default: return Task.TaskStatus.DO_ZROBIENIA;
        }
    }

    public Task.TaskPriority getTaskPriority() {
        if (priority == null) return Task.TaskPriority.SREDNI;
        
        switch (priority.toUpperCase()) {
            case "NISKI": return Task.TaskPriority.NISKI;
            case "SREDNI": return Task.TaskPriority.SREDNI;
            case "WYSOKI": return Task.TaskPriority.WYSOKI;
            case "KRYTYCZNY": return Task.TaskPriority.KRYTYCZNY;
            default: return Task.TaskPriority.SREDNI;
        }
    }
}
