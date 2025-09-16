package com.taskmanager.dto;

import com.taskmanager.model.Task;
import jakarta.validation.constraints.Size;
import lombok.NoArgsConstructor;

@NoArgsConstructor
public class UpdateTaskRequest {
    @Size(max = 500, message = "Tytuł nie może być dłuższy niż 500 znaków")
    private String title;
    
    @Size(max = 3000, message = "Opis nie może być dłuższy niż 3000 znaków")
    private String description;
    private String status; // String jak w CreateTaskRequest
    private String priority; // String jak w CreateTaskRequest
    private String dueDate; // String w formacie YYYY-MM-DD
    private String[] tags;
    private String[] images; // Ścieżki do zdjęć
    private String[] assignedTo; // Clerk User IDs użytkowników przypisanych do zadania
    @Size(max = 1000, message = "Notatka nie może być dłuższa niż 1000 znaków")
    private String assignedUserNote; // Notatka od przypisanego użytkownika
    private String assignedUserNoteAuthor; // ID użytkownika który dodał notatkę

    // Gettery i settery
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    
    public String[] getTags() { return tags; }
    public void setTags(String[] tags) { this.tags = tags; }
    
    public String[] getImages() { return images; }
    public void setImages(String[] images) { this.images = images; }
    
    public String[] getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String[] assignedTo) { this.assignedTo = assignedTo; }
    
    public String getAssignedUserNote() { return assignedUserNote; }
    public void setAssignedUserNote(String assignedUserNote) { this.assignedUserNote = assignedUserNote; }
    
    public String getAssignedUserNoteAuthor() { return assignedUserNoteAuthor; }
    public void setAssignedUserNoteAuthor(String assignedUserNoteAuthor) { this.assignedUserNoteAuthor = assignedUserNoteAuthor; }


    // Gettery i settery dla Jackson deserializacji
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    @Override
    public String toString() {
        return "UpdateTaskRequest{" +
                "title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", status='" + status + '\'' +
                ", priority='" + priority + '\'' +
                ", dueDate='" + dueDate + '\'' +
                ", tags=" + java.util.Arrays.toString(tags) +
                '}';
    }

    public Task.TaskStatus getTaskStatus() {
        if (status == null) return null;
        
        switch (status.toUpperCase()) {
            case "DO_ZROBIENIA": return Task.TaskStatus.DO_ZROBIENIA;
            case "W_TRAKCIE": return Task.TaskStatus.W_TRAKCIE;
            case "ZAKONCZONE": return Task.TaskStatus.ZAKONCZONE;
            case "ANULOWANE": return Task.TaskStatus.ANULOWANE;
            default: return null;
        }
    }

    public Task.TaskPriority getTaskPriority() {
        if (priority == null) return null;
        
        switch (priority.toUpperCase()) {
            case "NISKI": return Task.TaskPriority.NISKI;
            case "SREDNI": return Task.TaskPriority.SREDNI;
            case "WYSOKI": return Task.TaskPriority.WYSOKI;
            case "KRYTYCZNY": return Task.TaskPriority.KRYTYCZNY;
            default: return null;
        }
    }
}
