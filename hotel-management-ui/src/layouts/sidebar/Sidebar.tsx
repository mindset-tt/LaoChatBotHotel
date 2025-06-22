import React from "react";
import "./sidebar.css";
import { Link, NavLink } from "react-router-dom";
import { Box, Divider } from "@mui/material";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

export const Sidebar = () => {
  return (
    <div className="sidebar-main">
      <div>some logo</div>
      <div className="chatList">
        {/* <span className="title">DASHBOARD</span> */}
        <Link to="/chats">
          <Box display="flex" alignItems="center" gap={1}>
            <DriveFileRenameOutlineIcon />
            Create a new Chat
          </Box>
        </Link>
        <Divider
          sx={{ color: "white", zIndex: "999", border: "1px solid gray" }}
        />
        <span className="title">RECENT CHATS</span>
        <div className="list">
          {/* {isPending
          ? "Loading..."
          : error
          ? "Something went wrong!"
          : data?.map((chat) => (
              <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
                {chat.title}
              </Link>
            ))} */}

          <NavLink
            to={`/chats/${34}`}
            key={34}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {"Chat Detail"}
          </NavLink>
        </div>
      </div>
    </div>
  );
};
