package com.ssafy.backend.domain.chat.entity;

import static javax.persistence.FetchType.*;

import javax.persistence.*;

import com.ssafy.backend.domain.user.User;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
public class Participation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "PARTICIPATION_ID")
	private Long id;

	@ManyToOne(fetch = LAZY)
	@JoinColumn(name = "USER_ID")
	private User user;

	@ManyToOne(fetch = LAZY)
	@JoinColumn(name = "CHATROOM_ID")
	private ChatRoom chatRoom;

	public static Participation create(User user, ChatRoom chatRoom) {
		return Participation.builder()
				.user(user)
				.chatRoom(chatRoom)
				.build();
	}
}
