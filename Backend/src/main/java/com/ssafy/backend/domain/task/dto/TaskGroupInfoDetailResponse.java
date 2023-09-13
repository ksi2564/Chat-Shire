package com.ssafy.backend.domain.task.dto;

import com.ssafy.backend.domain.task.Priority;
import com.ssafy.backend.domain.task.TaskGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskGroupInfoDetailResponse {
    private Long id;
    private String name;
    @Enumerated(EnumType.STRING)
    private Priority priority;
    private List<TaskInfoDetailResponse> taskInfoDetailResponses = new ArrayList<>();

    public void setTaskInfoDetailResponse(List<TaskInfoDetailResponse> taskInfoDetailResponses){this.taskInfoDetailResponses=taskInfoDetailResponses;}

    public static TaskGroupInfoDetailResponse fromEntity(TaskGroup taskGroup){
        return TaskGroupInfoDetailResponse.builder()
                .id(taskGroup.getId())
                .name(taskGroup.getName())
                .priority(taskGroup.getPriority()).build();
    }

    public static List<TaskGroupInfoDetailResponse> fromEntityList(List<TaskGroup> taskGroups){
        return taskGroups.stream()
                .map(TaskGroupInfoDetailResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
