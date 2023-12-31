import React, { useEffect, useState } from "react";
import styles from "./IndivChatModal.module.css";
import {
  getReferences,
  deleteReferences,
  getReferencesChat,
} from "../../utils/taskReferenceApi";
import { Button, Modal } from "antd";
import { getProjectMem } from "../../utils/projectApi";
import MessageItem from "../message/MessageItem";

import { MdOutlineCancel } from "react-icons/md";
import { useRecoilState } from "recoil";
import { tasks_recoil } from "../../stores/atom";

interface IndivChatModalProps {
  onClose: () => void;
  taskId: any;
  projectId: string;
  open: boolean;
}
interface ChatItem {
  userId?: string;
  nickname: string;
  content: string;
  chatTime: string;
  chatNumber: number;
  id: string;
}
interface Member {
  userId: string;
  nickname: string;
}

function IndivChatModal({
  taskId,
  onClose,
  projectId,
  open,
}: IndivChatModalProps) {
  const [taskChat, setTaskChat] = useState<ChatItem[]>([]);
  const [reChat, setReChat] = useState<ChatItem[]>([]);
  const [chat, setChat] = useState([]);
  const [selectedChat, setSelectedChat] = useState("");
  const [pjtMem, setpjtMem] = useState<Member[]>([]);
  const [allTasks, setAllTasks] = useRecoilState(tasks_recoil);

  const getTaskChat = async () => {
    try {
      const response = await getReferences(taskId);
      setTaskChat(response.data.result[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const getProjectUsers = async () => {
    try {
      const response = await getProjectMem(projectId);
      setpjtMem(response.data.result[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const getInReChat = async (reId: string) => {
    try {
      const response = await getReferencesChat(reId);
      setReChat(response.data.result[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = async (reId: string) => {
    setSelectedChat(reId);
    getInReChat(reId);
  };

  const handleDelete = async () => {
    setReChat([]);
    setSelectedChat("");
  };

  const deleteRe = async (chatId: string) => {
    try {
      const response = await deleteReferences(taskId, chatId);
      getTaskChat();
    } catch (error) {
      console.error(error);
    }
  };

  function formatChatTime(chatTime: any) {
    const date = new Date(chatTime);
    return date.toLocaleString(); // 브라우저 설정에 따라 로케일에 맞게 날짜 및 시간을 표시
  }

  useEffect(() => {
    if (taskId) {
      getTaskChat();
    }
  }, [taskId, allTasks]);

  useEffect(() => {
    getProjectUsers();
  }, [taskId]);

  return (
    <div>
      {/* <div className={styles.modalOverlay}> */}
      {selectedChat !== "" ? (
        <Modal
          className={styles.customModal}
          style={{ fontFamily: "preRg", overflow: "scroll" }}
          title="참조된 채팅"
          centered
          open={open}
          onOk={onClose}
          onCancel={onClose}
          footer={[
            <Button
              key="back"
              style={{ fontFamily: "preRg" }}
              onClick={handleDelete}
            >
              뒤로가기
            </Button>,
          ]}
          width={800}
        >
          <div style={{ height: "60vh", maxHeight: "60vh", overflowY: "auto" }}>
            {reChat &&
              reChat.map((chat) => (
                <MessageItem message={chat} users={pjtMem} />
              ))}
          </div>{" "}
        </Modal>
      ) : (
        <Modal
          className={styles.customModal}
          style={{ fontFamily: "preRg" }}
          title="참조된 채팅"
          centered
          open={open}
          onOk={onClose}
          onCancel={onClose}
          footer={null}
          width={800}
        >
          <div style={{ height: "60vh", maxHeight: "60vh", overflowY: "auto" }}>
            {taskChat &&
              taskChat.map((chat) => (
                <div key={chat.chatNumber} className={styles.chat}>
                  {" "}
                  <div className={styles.nickname}>
                    {chat.nickname} : {chat.content ? chat.content : "첨부파일"}
                  </div>
                  <div className={styles.chatTime}>
                    {" "}
                    {formatChatTime(chat.chatTime)}
                  </div>
                  <button
                    className={styles.deletebtn}
                    style={{
                      backgroundColor: "#39a789",
                      fontFamily: "preRg",
                      border: "0px",
                      borderRadius: "10px",
                      color: "white",
                      padding: "2px",
                      marginRight: "4px",
                    }}
                    onClick={() => handleClick(chat.id)}
                  >
                    더보기
                  </button>
                  <button
                    className={styles.deletebtn}
                    style={{
                      backgroundColor: "#FF5B5B",
                      fontFamily: "preRg",
                      border: "0px",
                      borderRadius: "10px",
                      color: "white",
                    }}
                    onClick={() => deleteRe(chat.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            {/* <MdOutlineCancel
              style={{marginTop: "8px", cursor: "pointer"}}
              size={30}
              onClick={onClose}
              className={styles.closebtn}
            /> */}
            {/* <div style={{display: 'flex', justifyContent:'space-between'}} > */}
            {/* </div> */}
          </div>{" "}
        </Modal>
      )}
    </div>
  );
}

export default IndivChatModal;
