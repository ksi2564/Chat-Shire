import React, { useEffect, useState } from "react";
import styles from "./MessageItem.module.css";

import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import { CardActionArea } from "@mui/material";
import { Button, Modal } from "antd";

interface User {
  nickname: string;
  profileColor: string;
  profileImage: string;
  state: string;
  userId: number;
}
interface StyledBadgeProps {
  userState: string;
}
export default function MessageItem({
  message,
  users,
}: {
  message: any;
  users: any;
}) {
  const [user, setUser] = useState<User>({
    nickname: "",
    profileColor: "",
    profileImage: "",
    state: "",
    userId: 0,
  });

  const [open, setOpen] = useState(false);
  const StyledBadge = styled(Badge)<StyledBadgeProps>(
    ({ theme, userState }) => ({
      "& .MuiBadge-badge": {
        backgroundColor:
          userState === "ONLINE"
            ? "#44b700"
            : userState === "AWAY"
            ? "orange"
            : userState === "OFFLINE"
            ? "gray"
            : userState === "DND"
            ? "red"
            : "#444444",
        color:
          userState === "ONLINE"
            ? "#44b700"
            : userState === "AWAY"
            ? "orange"
            : userState === "OFFLINE"
            ? "gray"
            : userState === "DND"
            ? "red"
            : "#444444",
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        "&::after": {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          // animation: "ripple 1.2s infinite ease-in-out",
          // border: "1px solid currentColor",
          content: '""',
        },
      },
      // "@keyframes ripple": {
      //   "0%": {
      //     transform: "scale(.8)",
      //     opacity: 1,
      //   },
      //   "100%": {
      //     transform: "scale(2.4)",
      //     opacity: 0,
      //   },
      // },
    })
  );

  const onClickDeleteChattingRoom = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // postInTask()
    // alert("채팅방을 정말 삭제하시겠어요?");
  };
  useEffect(() => {
    if (Array.isArray(users) && users?.length > 0 && message?.userId) {
      // users 배열을 필터링하여 userId가 message.message.userId와 같은 항목만 선택
      const filteredUsers = users.filter(
        (user: User) => user?.userId === message?.userId
      );

      // 선택된 사용자 정보를 setUser에 저장
      if (filteredUsers.length > 0) {
        setUser(filteredUsers[0]); // filter 함수의 결과는 배열이므로 첫 번째 요소만 가져옵니다.
      }
    }
  }, [users]);

  function formatChatTime(chatTime: any) {
    const date = new Date(chatTime);
    return date.toLocaleString(); // 브라우저 설정에 따라 로케일에 맞게 날짜 및 시간을 표시
  }

  return (
    <div
      className={styles.messageItemContainer}
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("message", JSON.stringify(message));
        e.dataTransfer.setData("nickname", user?.nickname);
      }}
    >
      <StyledBadge
        className={styles.messageItemProfile}
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
        userState={user?.state}
      >
        <Avatar
          alt="Remy Sharp"
          src={
            user && user?.profileImage
              ? process.env.PUBLIC_URL + user?.profileImage
              : process.env.PUBLIC_URL + "/assets/profile/m57.png"
          }
          sx={{
            width: 50,
            height: 50,
            backgroundColor:
              user && user?.profileColor ? user?.profileColor : "transparent",
          }}
        />
      </StyledBadge>
      <div className={styles.messageItemBody}>
        <div className={styles.messageItemName}>
          <span className={styles.messageProfileName}>
            {user && user?.nickname}
          </span>
          <span className={styles.messageTime}>
            {message && formatChatTime(message.chatTime)}
          </span>
        </div>
        <div
          className={styles.messageItemText}
          onContextMenu={(e) => {
            onClickDeleteChattingRoom(e);
          }}
        >
          <span style={{ wordBreak: "break-all" }}>
            {message && message?.content}
            {/* {message && message?.attachedFileInfos?.map((info: any, index: number) => (
              <img style={{height: '100px'}} key={index} src={info.url} alt="attached" />
            ))} */}
          </span>
          <div className={styles.messageItemText}>
            {message &&
              message?.attachedFileInfos?.map((info: any, index: number) => {
                const url = info.url.toLowerCase(); // URL을 소문자로 변환하여 비교

                if (url.endsWith("mp4")) {
                  return (
                    <video
                      className={styles.videoThumbnail}
                      width="250"
                      key={index}
                      controls
                    >
                      <source src={info.url} type="video/mp4" />
                    </video>
                  );
                } else if (
                  url.endsWith(".pdf") ||
                  url.endsWith(".docx") ||
                  url.endsWith(".doc") ||
                  url.endsWith(".xlsx") ||
                  url.endsWith(".xls") ||
                  url.endsWith(".txt")
                ) {
                  return (
                    // <a href={info.url} target="_blank" rel="noopener noreferrer">{info.url.split('/').pop()}</a>
                    <div className={styles.fileThumbnail} key={index}>
                      <CardActionArea
                        onClick={() => window.open(info.url, "_blank")}
                        style={{
                          height: "60px",
                          width: "230px",
                          display: "flex",
                          // flexDirection: "column",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "8px",
                        }}
                      >
                        <span style={{ fontFamily: "preBd" }}>
                          {info.url.split("/").pop()}
                        </span>
                        {/* <span style={{ fontFamily: "preLt" }}>
              {(info.size / 1024).toFixed(2)} KB
            </span> */}
                      </CardActionArea>
                    </div>
                  );
                } else {
                  return (
                    <img
                      onClick={() => setOpen(true)}
                      style={{ marginTop: "3px", height: "120px" }}
                      key={index}
                      src={info.url}
                      alt="attached"
                    />
                  );
                }
              })}
          </div>
        </div>
      </div>

      <Modal
        centered
        open={open}
        width={1000}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {message &&
          message?.attachedFileInfos?.map((info: any, index: number) => {
            return (
              <img
                style={{
                  padding: "20px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "auto",
                  marginTop: "3px",
                  height: "60vh",
                }}
                key={index}
                src={info.url}
                alt="attached"
              />
            );
          })}
      </Modal>
    </div>
  );
}
