import React, { useState, useEffect } from "react";
import styles from "./Error.module.css";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
// import img from "../../assets/profile/m57.png";
// import error from "../../assets/error.png";
import { getErrorDetail } from "../../utils/errorApi";

interface ErrorCardProps {
  error?: any;
  onCardClick?: (error: any) => void;
}

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

function ErrorCard({ error, onCardClick }: ErrorCardProps) {
  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onCardClick?.(error);
  };


  return (
    <div className={styles.errcard} onClick={handleModalClick}>
      <div
        className="sideTabContainer"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
        }}
      >
        <Avatar
          alt="Remy Sharp"
          src={
            process.env.PUBLIC_URL +
            (error ? error.profileImage : "/assets/profile/m57.png")
          }
          sx={{ width: 80, height: 80 }}
        />
        <h5 className={styles.status}>
          {error && error.state !== 0 ? "완료" : "진행"}
        </h5>
      </div>
      <div>
        <p className={styles.title}>Q. {error ? error.title : ""}</p>
        <div className={styles.skillbox}>
          {error && Array.isArray(error.skillName) ? (
            error.skillName.map((item: any, index: number) => (
              <span key={index} className={styles.language}>
                {item}
              </span>
            ))
          ) : (
            <h5 className={styles.language}>Python</h5>
          )}
        </div>
        <div
          className={styles.img}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            height: "60px"
          }}
        >
          {error.attachedFileInfos && error.attachedFileInfos.length > 3 ? (
              <div>
                {error.attachedFileInfos.slice(3).map(
                  (info: { url: string }, index: number) => (
                    <img
                      style={{ marginRight: "5px", height: "60px", width: "60px" }}
                      key={index}
                      src={info.url}
                      alt="Preview"
                    />
                  )
                )}
                <div style={{position: "relative"}}>
                  <img
                    style={{ marginRight: "5px", height: "60px", width: "60px" }}
                    key={4}
                    src={error.attachedFileInfos[3].url}
                    alt="Preview"
                  />
                  <div style={{position: "absolute", height: "60px", width: "60px", backgroundColor: "rgba(0, 0, 0, 0.241)", justifyContent: "center", alignItems: "center"}}>
                    <div style={{color: "#ffffff"}}>
                    +{error.attachedFileInfos.length - 3}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              error.attachedFileInfos.map(
                (info: { url: string }, index: number) => (
                  <img
                    style={{ marginRight: "5px", height: "60px", width: "60px" }}
                    key={index}
                    src={info.url}
                    alt="Preview"
                  />
                )
              )
            )}
        </div>
        <p className={styles.answer}>
          {" "}
          A. {error && error.reply ? error.reply : "아직 답변이 없습니다."}
        </p>
        <p className={styles.more}>
          {error && error.replyCount}개의 답변 더보기
        </p>
      </div>
    </div>
  );
}

export default ErrorCard;
